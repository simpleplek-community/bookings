"use client";

// Safe declaration for window.fbq
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export interface PixelEstimateParams {
  estimateId: string;
  total?: number;
  propertyId?: string;
  propertyName?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
}

/**
 * Fires a Meta Pixel standard event safely from the browser.
 */
export function trackPixelEvent(
  eventName: "InitiateCheckout" | "ViewContent" | "Lead" | "Purchase" | "AddPaymentInfo" | "PageView" | string,
  params?: Record<string, any>,
  options?: { eventID?: string }
) {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.fbq === "function") {
      if (options?.eventID) {
        window.fbq("track", eventName, params || {}, { eventID: options.eventID });
      } else if (params) {
        window.fbq("track", eventName, params);
      } else {
        window.fbq("track", eventName);
      }
      if (process.env.NODE_ENV === "development") {
        console.log(`[Meta Pixel Client] Tracked "${eventName}":`, params, options);
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[Meta Pixel Client] window.fbq is not defined. Ensure NEXT_PUBLIC_META_PIXEL_ID is configured.`);
      }
    }
  } catch (err) {
    console.warn(`[Meta Pixel Client] Error tracking "${eventName}":`, err);
  }
}

/**
 * Convenience helper to track an estimate view on the client.
 * Fires standard event "InitiateCheckout" with deduplication eventID.
 */
export function trackPixelEstimate({
  estimateId,
  total,
  propertyId,
  propertyName,
  fromDate,
  toDate,
  status,
}: PixelEstimateParams) {
  const value = Number(total || 0);

  trackPixelEvent(
    "InitiateCheckout",
    {
      content_name: propertyName || "Stay Estimate",
      content_ids: propertyId ? [propertyId] : [],
      content_type: "product",
      value: value,
      currency: "ZAR",
      num_items: 1,
      checkin_date: fromDate,
      checkout_date: toDate,
      status: status || "pending",
    },
    { eventID: `estimate_${estimateId}` }
  );
}
