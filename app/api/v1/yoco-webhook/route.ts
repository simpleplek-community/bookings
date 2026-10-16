import { NextRequest, NextResponse } from "next/server";
import { updateBookingStatus, getEstimate, updateEstimateStatus, createBooking, listBookings, promoteUserToAdmin, getProperty, getBooking, updateBooking } from "@/lib/firebase";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { isPaymentsLive } from "@/lib/auth";
import { createHmac, timingSafeEqual } from "crypto";

const SUBSCRIPTION_PRICES_CENTS: Record<string, number> = { monthly: 1500, annual: 15000 };
const TIMESTAMP_TOLERANCE_SECONDS = 180;

// https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events
function verifyYocoSignature(request: NextRequest, rawBody: string, secret: string): boolean {
  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signatureHeader = request.headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TIMESTAMP_TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest();

  return signatureHeader.split(" ").some((entry) => {
    const sig = entry.split(",", 2)[1];
    if (!sig) return false;
    const provided = Buffer.from(sig, "base64");
    return provided.length === expected.length && timingSafeEqual(provided, expected);
  });
}

/** Rejects payments whose reported amount is below what we expected to charge. */
function amountCovers(paidCents: unknown, expectedCents: number): boolean {
  if (typeof paidCents !== "number") return true; // signature already proves the event came from Yoco
  return paidCents >= expectedCents;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const secret = process.env.YOCO_WEBHOOK_SECRET?.trim();
    if (secret) {
      if (!verifyYocoSignature(request, rawBody, secret)) {
        console.warn("[Yoco Webhook] Rejected webhook with invalid signature.");
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
      }
    } else if (isPaymentsLive()) {
      console.error("[Yoco Webhook] YOCO_WEBHOOK_SECRET is not configured; refusing unsigned webhook.");
      return NextResponse.json({ success: false, error: "Webhook secret not configured" }, { status: 503 });
    }

    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {}
    console.log("[Yoco Webhook] Received webhook event:", body.type || body.event, body.id || "");

    const eventType = body.type || body.event;
    const payload = body.payload || body;
    const metadata = payload.metadata || {};
    
    // Defensive extraction of booking ID, estimate ID & subscription details
    const bookingId = metadata.bookingId || payload.bookingId || body.bookingId;
    const estimateId = metadata.estimateId || payload.estimateId || body.estimateId;
    const intent = metadata.intent || payload.intent || body.intent;
    const userId = metadata.userId || payload.userId || body.userId;
    const customerEmail = metadata.email;
    const customerName = metadata.name;
    const paidCents = payload.amount;

    if (intent === "subscription" && userId) {
      if (eventType === "payment.succeeded" || eventType === "checkout.succeeded" || eventType === "charge.succeeded") {
        const plan = metadata.plan || "standard";
        const billingInterval = metadata.billingInterval === "monthly" ? "monthly" : "annual";
        if (!amountCovers(paidCents, SUBSCRIPTION_PRICES_CENTS[billingInterval])) {
          console.warn(`[Yoco Webhook] Subscription payment for ${userId} below plan price; ignoring.`);
          return NextResponse.json({ success: false, error: "Amount mismatch" }, { status: 400 });
        }
        console.log(`[Yoco Webhook] Subscription payment succeeded for user ${userId} with plan ${plan}. Promoting.`);
        await promoteUserToAdmin(userId, plan, billingInterval);
      }
      return NextResponse.json({ success: true, message: "Subscription processed successfully." });
    }

    if (intent === "addon" && bookingId) {
      if (eventType === "payment.succeeded" || eventType === "checkout.succeeded" || eventType === "charge.succeeded") {
        const bk = await getBooking(bookingId);
        if (bk) {
          const paidAddons = Array.from(new Set([...(bk.paidAddons || []), metadata.addonId || metadata.packageType].filter(Boolean)));
          await updateBooking(bookingId, { paidAddons });
        }
      }
      return NextResponse.json({ success: true, message: "Add-on payment processed." });
    }

    if (!bookingId && !estimateId) {
      console.warn("[Yoco Webhook] No bookingId, estimateId, or subscription intent found in webhook payload.");
      return NextResponse.json({ success: true, message: "Webhook received, but no action identifier was found." });
    }

    if (eventType === "payment.succeeded" || eventType === "checkout.succeeded" || eventType === "charge.succeeded") {
      if (bookingId) {
        console.log(`[Yoco Webhook] Payment succeeded for booking ${bookingId}`);
        const bk = await getBooking(bookingId);
        if (!bk) {
          return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
        }
        if (!amountCovers(paidCents, Math.round(Number(bk.total) * 100))) {
          console.warn(`[Yoco Webhook] Payment for booking ${bookingId} below booking total; ignoring.`);
          return NextResponse.json({ success: false, error: "Amount mismatch" }, { status: 400 });
        }
        await updateBookingStatus(bookingId, "paid");
        if (!bk.confirmationEmailSent) {
          try {
            await sendBookingConfirmationEmail({ ...bk, paymentStatus: "paid" });
          } catch (err) {
            console.error("[Yoco Webhook] Error sending confirmation email for bookingId:", err);
          }
        }
      } else if (estimateId) {
        console.log(`[Yoco Webhook] Payment succeeded for estimate ${estimateId}. Creating booking.`);
        const estimate = await getEstimate(estimateId);
        if (estimate && !amountCovers(paidCents, Math.round(Number(estimate.total) * 100))) {
          console.warn(`[Yoco Webhook] Payment for estimate ${estimateId} below estimate total; ignoring.`);
          return NextResponse.json({ success: false, error: "Amount mismatch" }, { status: 400 });
        }
        if (estimate) {
          const property = await getProperty(estimate.propertyId);
          const isHourly = property?.bookingType === "hourly";
          
          const targetEmail = customerEmail || estimate.customerEmail;
          const targetId = userId || estimate.customerId;
          const targetName = customerName || estimate.customerName;

          const existingBookings = await listBookings();
          const alreadyExists = existingBookings.some((b: any) => {
            if (isHourly) {
              return b.estimateId === estimateId && (b.customerEmail === targetEmail || b.customerId === targetId);
            } else {
              return b.estimateId === estimateId;
            }
          });

          if (!alreadyExists) {
            const booking = await createBooking({
              propertyId: estimate.propertyId,
              packageId: estimate.packageId || null,
              customerName: targetName,
              customerEmail: targetEmail,
              customerId: targetId,
              fromDate: estimate.fromDate,
              toDate: estimate.toDate,
              total: Number(estimate.total),
              paymentStatus: "paid",
              estimateId: estimate.id,
              guests: estimate.guests || [],
              guestsDetails: estimate.guestsDetails || {}
            } as any);
            
            if (!isHourly) {
              await updateEstimateStatus(estimateId, "paid");
            }

            // Trigger email notification with await
            try {
              await sendBookingConfirmationEmail(booking);
            } catch (err) {
              console.error("[Yoco Webhook] Failed to send sendBookingConfirmationEmail:", err);
            }
            
            console.log(`[Yoco Webhook] Booking created successfully from estimate ${estimateId}`);
          } else {
            console.log(`[Yoco Webhook] Booking already exists for estimate ${estimateId}`);
            const existing = existingBookings.find((b: any) => isHourly ? (b.estimateId === estimateId && (b.customerEmail === targetEmail || b.customerId === targetId)) : (b.estimateId === estimateId));
            if (existing) {
              const mergedGuests = Array.from(new Set([...(existing.guests || []), ...(estimate.guests || [])]));
              const mergedDetails = { ...(estimate.guestsDetails || {}), ...(existing.guestsDetails || {}) };
              await updateBooking(existing.id, {
                paymentStatus: "paid",
                guests: mergedGuests,
                guestsDetails: mergedDetails
              });
              existing.guests = mergedGuests;
              existing.guestsDetails = mergedDetails;

              if (!existing.confirmationEmailSent) {
                try {
                  await sendBookingConfirmationEmail(existing);
                } catch (err) {
                  console.error("[Yoco Webhook] Error sending email for existing booking:", err);
                }
              }
            }
          }
        } else {
          console.warn(`[Yoco Webhook] Estimate ${estimateId} not found.`);
        }
      }
    } else if (eventType === "payment.failed" || eventType === "checkout.failed" || eventType === "charge.failed") {
      if (bookingId) {
        console.log(`[Yoco Webhook] Payment failed for booking ${bookingId}`);
        await updateBookingStatus(bookingId, "failed");
      } else if (estimateId) {
        console.log(`[Yoco Webhook] Payment failed for estimate ${estimateId}`);
        await updateEstimateStatus(estimateId, "failed");
      }
    } else {
      console.log(`[Yoco Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Yoco Webhook] Error processing webhook:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

