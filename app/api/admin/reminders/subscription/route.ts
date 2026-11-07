import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, updateUserProfile, listAllUserProfiles } from "@/lib/firebase";
import { sendSubscriptionLapsedEmail } from "@/lib/email";
import { getSessionUser, unauthorized, forbidden } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return unauthorized("Please sign in to manage subscription reminders.");
    }

    const body = await request.json().catch(() => ({}));
    const { userId, email, all } = body;

    const host = request.headers.get("host") || "";
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const siteUrl = host ? `${proto}://${host}` : request.nextUrl.origin;
    const renewalUrl = `${siteUrl}/subscribe`;

    // Target specific user or caller requesting their own reminder
    const targetUserId = userId || (!all ? session.uid : undefined);

    if (targetUserId) {
      // Permission: Can only request for self unless super admin
      if (targetUserId !== session.uid && !session.isSuperAdmin) {
        return forbidden("Only administrators can send reminders to other members.");
      }

      const profile = await getUserProfile(targetUserId);
      const recipientEmail = email || profile?.email || session.email;

      if (!recipientEmail) {
        return NextResponse.json(
          { success: false, error: "Could not find a valid email address for this member." },
          { status: 400 }
        );
      }

      const expiresAt = profile?.subscriptionExpiresAt || null;
      const now = Date.now();
      const isExpired = expiresAt ? new Date(expiresAt).getTime() < now : true;
      const daysLapsed = expiresAt
        ? Math.max(1, Math.ceil((now - new Date(expiresAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;

      const billingInterval = profile?.billingInterval || (profile?.plan === "standard" ? "monthly" : "annual");
      const amountDueZar = billingInterval === "monthly" ? 15 : 150;
      const reminderCount = (profile?.lapsedReminderCount || 0) + 1;

      const sent = await sendSubscriptionLapsedEmail({
        email: recipientEmail,
        name: profile?.displayName || recipientEmail.split("@")[0],
        plan: profile?.plan || "pro",
        billingInterval,
        subscriptionExpiresAt: expiresAt,
        daysLapsed,
        amountDueZar,
        renewalUrl,
        reminderCount,
      });

      if (!sent) {
        return NextResponse.json(
          { success: false, error: "Failed to send email. Check delivery service configuration." },
          { status: 502 }
        );
      }

      // Record reminder timestamp and increment count in user profile
      await updateUserProfile(targetUserId, {
        lastLapsedReminderSentAt: new Date().toISOString(),
        lapsedReminderCount: reminderCount,
        subscriptionStatus: "expired",
      });

      return NextResponse.json({
        success: true,
        message: `Subscription payment reminder #${reminderCount} sent to ${recipientEmail}.`,
        reminderCount,
        sentAt: new Date().toISOString(),
      });
    }

    // "All" mode: Admin sweeps all lapsed / expired subscriptions
    if (!session.isSuperAdmin) {
      return forbidden("Only administrators can trigger bulk subscription reminders.");
    }

    const allProfiles = await listAllUserProfiles();
    const now = Date.now();
    const results: Array<{ uid: string; email: string; reminderCount: number }> = [];

    for (const [uid, profile] of Object.entries(allProfiles)) {
      const p = profile as any;
      const plan = p.plan || (p.isAdmin ? "pro" : "free");
      if (plan !== "pro" && plan !== "standard") continue;

      const expiresAt = p.subscriptionExpiresAt;
      const isExpired =
        p.subscriptionStatus === "expired" ||
        (expiresAt && new Date(expiresAt).getTime() < now);

      if (!isExpired) continue;

      const recipientEmail = p.email;
      if (!recipientEmail || !recipientEmail.includes("@")) continue;

      const daysLapsed = expiresAt
        ? Math.max(1, Math.ceil((now - new Date(expiresAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;
      const billingInterval = p.billingInterval || (plan === "standard" ? "monthly" : "annual");
      const amountDueZar = billingInterval === "monthly" ? 15 : 150;
      const reminderCount = (p.lapsedReminderCount || 0) + 1;

      const sent = await sendSubscriptionLapsedEmail({
        email: recipientEmail,
        name: p.displayName || recipientEmail.split("@")[0],
        plan,
        billingInterval,
        subscriptionExpiresAt: expiresAt,
        daysLapsed,
        amountDueZar,
        renewalUrl,
        reminderCount,
      });

      if (sent) {
        await updateUserProfile(uid, {
          lastLapsedReminderSentAt: new Date().toISOString(),
          lapsedReminderCount: reminderCount,
          subscriptionStatus: "expired",
        });
        results.push({ uid, email: recipientEmail, reminderCount });
      }
    }

    return NextResponse.json({
      success: true,
      sentCount: results.length,
      results,
      message: `Sent ${results.length} subscription payment reminder${results.length === 1 ? "" : "s"}.`,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("POST /api/admin/reminders/subscription error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Support cron or diagnostic check
  try {
    const session = await getSessionUser(request);
    if (!session) return unauthorized();

    const profile = await getUserProfile(session.uid);
    const expiresAt = profile?.subscriptionExpiresAt;
    const isExpired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;

    return NextResponse.json({
      success: true,
      data: {
        userId: session.uid,
        isExpired,
        expiresAt,
        subscriptionStatus: profile?.subscriptionStatus || (isExpired ? "expired" : "active"),
        lastLapsedReminderSentAt: profile?.lastLapsedReminderSentAt || null,
        lapsedReminderCount: profile?.lapsedReminderCount || 0,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
