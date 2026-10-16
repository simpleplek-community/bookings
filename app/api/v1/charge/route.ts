import { NextResponse } from "next/server";

/**
 * Retired. This endpoint used Yoco's legacy charges API with an amount chosen
 * by the browser, and "simulated" a successful charge when no key was set.
 * Nothing in the app calls it; payments go through Yoco Checkout
 * (/api/v1/generate_checkout_link) and are confirmed by the signed webhook.
 */
export async function POST() {
  return NextResponse.json(
    { success: false, error: "This payment endpoint has been retired. Use Yoco Checkout." },
    { status: 410 }
  );
}
