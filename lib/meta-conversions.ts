import { createHash } from "crypto";
import { NextRequest } from "next/server";

export interface MetaUserData {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phone?: string | null;
  externalId?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface MetaCustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  num_items?: number;
  checkin_date?: string;
  checkout_date?: string;
  status?: string;
  [key: string]: any;
}

export interface MetaConversionEventParams {
  eventName: "InitiateCheckout" | "Lead" | "Purchase" | "ViewContent" | string;
  eventId?: string;
  eventSourceUrl?: string;
  userData: MetaUserData;
  customData?: MetaCustomData;
}

/**
 * Normalizes and SHA-256 hashes a string according to Meta Conversions API specifications.
 */
export function hashMetaField(value?: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return createHash("sha256").update(normalized).digest("hex");
}

/**
 * Parses a full name into first and last names.
 */
export function parseName(fullName?: string | null): { firstName?: string; lastName?: string } {
  if (!fullName) return {};
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return {};
  const firstName = parts[0];
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
  return { firstName, lastName };
}

/**
 * Extracts client metadata (IP, user agent, Facebook cookies) from NextRequest.
 */
export function extractClientMetadata(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || undefined;

  // Extract client IP (checking proxies, Cloudflare, Vercel, standard headers)
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const clientIp = cfConnectingIp || (forwardedFor ? forwardedFor.split(",")[0].trim() : realIp) || undefined;

  // Facebook cookies: _fbp (browser id) and _fbc (click id)
  const fbp = request.cookies.get("_fbp")?.value || undefined;
  let fbc = request.cookies.get("_fbc")?.value || undefined;

  // If _fbc cookie isn't set, inspect if fbclid is present in request URL or referer
  if (!fbc) {
    try {
      const url = new URL(request.url);
      const fbclid = url.searchParams.get("fbclid");
      if (fbclid) {
        fbc = `fb.1.${Date.now()}.${fbclid}`;
      }
    } catch {}
  }

  const referer = request.headers.get("referer") || undefined;

  return { userAgent, clientIp, fbp, fbc, referer };
}

/**
 * Sends a server-side event to Meta Conversions API (Graph API v21.0).
 */
export async function sendMetaConversionEvent(params: MetaConversionEventParams): Promise<{
  success: boolean;
  skipped?: boolean;
  error?: string;
  response?: any;
}> {
  const pixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;
  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim();

  if (!pixelId || !accessToken) {
    // Graceful skip when credentials are not configured yet
    return {
      success: false,
      skipped: true,
      error: "META_PIXEL_ID or META_CONVERSIONS_API_ACCESS_TOKEN not configured."
    };
  }

  try {
    const { firstName: derivedFn, lastName: derivedLn } = parseName(params.userData.fullName);
    const firstName = params.userData.firstName || derivedFn;
    const lastName = params.userData.lastName || derivedLn;

    const hashedEmail = hashMetaField(params.userData.email);
    const hashedFn = hashMetaField(firstName);
    const hashedLn = hashMetaField(lastName);
    const hashedPhone = hashMetaField(params.userData.phone);
    const hashedExternalId = hashMetaField(params.userData.externalId);

    const userDataPayload: Record<string, any> = {};

    if (hashedEmail) userDataPayload.em = [hashedEmail];
    if (hashedFn) userDataPayload.fn = [hashedFn];
    if (hashedLn) userDataPayload.ln = [hashedLn];
    if (hashedPhone) userDataPayload.ph = [hashedPhone];
    if (hashedExternalId) userDataPayload.external_id = [hashedExternalId];

    if (params.userData.clientIp) userDataPayload.client_ip_address = params.userData.clientIp;
    if (params.userData.userAgent) userDataPayload.client_user_agent = params.userData.userAgent;
    if (params.userData.fbp) userDataPayload.fbp = params.userData.fbp;
    if (params.userData.fbc) userDataPayload.fbc = params.userData.fbc;

    const eventData: Record<string, any> = {
      event_name: params.eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      user_data: userDataPayload,
    };

    if (params.eventId) {
      eventData.event_id = params.eventId;
    }

    if (params.eventSourceUrl) {
      eventData.event_source_url = params.eventSourceUrl;
    }

    if (params.customData) {
      eventData.custom_data = params.customData;
    }

    const payload: Record<string, any> = {
      data: [eventData],
    };

    if (testEventCode) {
      payload.test_event_code = testEventCode;
    }

    const apiUrl = `https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });

    const result = await response.json();

    if (!response.ok) {
      console.warn(`[Meta CAPI] Event "${params.eventName}" failed (${response.status}):`, result?.error?.message || result);
      return { success: false, error: result?.error?.message || "Meta API error", response: result };
    }

    console.log(`[Meta CAPI] Successfully sent "${params.eventName}" (event_id=${params.eventId || "none"})`);
    return { success: true, response: result };
  } catch (err: any) {
    console.warn(`[Meta CAPI] Error dispatching "${params.eventName}":`, err?.message || err);
    return { success: false, error: err?.message || "Network error" };
  }
}

/**
 * Convenience helper to track when an estimate is generated.
 * Standard event: InitiateCheckout (or custom event name configured in META_ESTIMATE_EVENT_NAME).
 */
export async function trackEstimateCreated({
  request,
  estimate,
  property,
  user,
}: {
  request: NextRequest;
  estimate: {
    id: string;
    total: number;
    fromDate?: string;
    toDate?: string;
    customerEmail?: string;
    customerName?: string;
    customerId?: string;
    propertyId: string;
  };
  property?: {
    id: string;
    title?: string;
    name?: string;
    slug?: string;
  } | null;
  user?: {
    uid?: string;
    email?: string | null;
  } | null;
}) {
  const clientMeta = extractClientMetadata(request);
  const eventName = process.env.META_ESTIMATE_EVENT_NAME || "InitiateCheckout";
  const propertyTitle = property?.title || property?.name || "Stay";
  const total = Number(estimate.total || 0);

  return sendMetaConversionEvent({
    eventName,
    eventId: `estimate_${estimate.id}`,
    eventSourceUrl: clientMeta.referer || request.url,
    userData: {
      email: estimate.customerEmail || user?.email,
      fullName: estimate.customerName,
      externalId: estimate.customerId || user?.uid,
      clientIp: clientMeta.clientIp,
      userAgent: clientMeta.userAgent,
      fbp: clientMeta.fbp,
      fbc: clientMeta.fbc,
    },
    customData: {
      currency: "ZAR",
      value: total,
      content_name: propertyTitle,
      content_ids: [estimate.propertyId],
      content_type: "product",
      contents: [
        {
          id: estimate.propertyId,
          quantity: 1,
          item_price: total,
        },
      ],
      num_items: 1,
      checkin_date: estimate.fromDate,
      checkout_date: estimate.toDate,
      status: "estimate_created",
    },
  });
}

/**
 * Convenience helper to track when a stay is booked/paid.
 * Standard event: Purchase.
 * This is vital to create Exclusion Audiences so you don't waste ad spend on already converted guests.
 */
export async function trackBookingPurchased({
  request,
  booking,
  property,
}: {
  request?: NextRequest | null;
  booking: {
    id: string;
    total: number;
    customerEmail?: string;
    customerName?: string;
    customerId?: string;
    propertyId: string;
    fromDate?: string;
    toDate?: string;
  };
  property?: {
    id: string;
    title?: string;
    name?: string;
  } | null;
}) {
  const clientMeta = request
    ? extractClientMetadata(request)
    : { userAgent: undefined, clientIp: undefined, fbp: undefined, fbc: undefined, referer: undefined };
  const propertyTitle = property?.title || property?.name || "Stay";
  const total = Number(booking.total || 0);

  return sendMetaConversionEvent({
    eventName: "Purchase",
    eventId: `booking_${booking.id}`,
    eventSourceUrl: clientMeta.referer,
    userData: {
      email: booking.customerEmail,
      fullName: booking.customerName,
      externalId: booking.customerId,
      clientIp: clientMeta.clientIp,
      userAgent: clientMeta.userAgent,
      fbp: clientMeta.fbp,
      fbc: clientMeta.fbc,
    },
    customData: {
      currency: "ZAR",
      value: total,
      content_name: propertyTitle,
      content_ids: [booking.propertyId],
      content_type: "product",
      contents: [
        {
          id: booking.propertyId,
          quantity: 1,
          item_price: total,
        },
      ],
      num_items: 1,
      checkin_date: booking.fromDate,
      checkout_date: booking.toDate,
    },
  });
}
