import { NextRequest, NextResponse } from "next/server";
import { loadStayForRequest } from "@/lib/stay-access";
import { getPackage, updateBooking, getUserProfile, isUserAdmin } from "@/lib/firebase";
import { isPaymentsLive } from "@/lib/auth";
import type { BookingPurchase } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await loadStayForRequest(request, "booking", id);
    if (!access.ok) return access.response;

    const booking = access.record;
    const purchases: BookingPurchase[] = Array.isArray(booking.purchases) ? booking.purchases : [];
    const paidAddons: string[] = Array.isArray(booking.paidAddons) ? booking.paidAddons : [];

    const staySubtotal = Number(booking.total || 0);
    const addonsSubtotal = purchases
      .filter((p) => p.type === "addon" && p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const grandTotal = staySubtotal + addonsSubtotal;
    const totalPaid = (booking.paymentStatus === "paid" ? staySubtotal : 0) + addonsSubtotal;

    return NextResponse.json({
      success: true,
      data: {
        purchases,
        paidAddons,
        financialSummary: {
          staySubtotal,
          addonsSubtotal,
          grandTotal,
          totalPaid,
          paymentStatus: booking.paymentStatus,
        },
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("GET /api/bookings/[id]/purchases error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await loadStayForRequest(request, "booking", id);
    if (!access.ok) return access.response;

    const booking = access.record;
    const session = access.session;
    const body = await request.json().catch(() => ({}));
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({ success: false, error: "packageId is required." }, { status: 400 });
    }

    const pkg = await getPackage(packageId);
    if (!pkg) {
      return NextResponse.json({ success: false, error: "Add-on package not found." }, { status: 404 });
    }

    // Verify Pro access if add-on is Pro-exclusive
    const isProPkg = Boolean(pkg.isPro || pkg.category === "pro");
    if (isProPkg) {
      const userProfile = session.uid ? await getUserProfile(session.uid) : null;
      const isAdmin = await isUserAdmin(session.uid, session.email || "");
      const isPro = userProfile?.plan === "pro" || isAdmin;
      if (!isPro) {
        return NextResponse.json(
          { success: false, error: "This add-on is exclusive to Pro members." },
          { status: 403 }
        );
      }
    }

    const host = request.headers.get("host") || "";
    const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
    const isTestKey = Boolean(process.env.YOCO_SEC?.trim().startsWith("sk_test_"));
    const isClientConfirm = body.paymentStatus === "paid" || body.paymentStatus === "success";

    // Allow recording if payments are not live, or in test environment/localhost (where webhooks cannot reach),
    // or when confirming a successful checkout redirect, or when performed by host/admin
    const canRecord =
      !isPaymentsLive() ||
      isTestKey ||
      isLocalhost ||
      access.role === "host" ||
      access.role === "admin" ||
      isClientConfirm;

    if (!canRecord) {
      return NextResponse.json(
        { success: false, error: "Add-ons must be purchased through online checkout." },
        { status: 402 }
      );
    }

    const purchaserName =
      (booking.guestsDetails && session.uid && booking.guestsDetails[session.uid]?.name) ||
      session.email ||
      session.uid ||
      "Guest";

    const newPurchase: BookingPurchase = {
      id: body.id || `pur_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: "addon",
      packageId: pkg.id,
      name: pkg.name || pkg.title || "Add-on Package",
      description: pkg.description || "",
      amount: Number(pkg.price || 0),
      currency: "ZAR",
      status: "paid",
      createdAt: new Date().toISOString(),
      purchasedBy: purchaserName,
      paymentMethod: body.paymentMethod || (isPaymentsLive() ? "Yoco Online Payment" : "Development Mock"),
    };

    const existingPurchases: BookingPurchase[] = Array.isArray(booking.purchases) ? booking.purchases : [];

    // Check if this add-on was already recorded to avoid duplicates
    const alreadyRecorded = existingPurchases.some(
      (p) => p.packageId === pkg.id && p.type === "addon"
    );

    if (alreadyRecorded) {
      return NextResponse.json({
        success: true,
        data: {
          purchases: existingPurchases,
          paidAddons: booking.paidAddons || [pkg.id],
        },
      });
    }

    const hasStayPurchase = existingPurchases.some((p) => p.type === "stay");
    const purchasesList = [...existingPurchases];
    if (!hasStayPurchase && (booking.paymentStatus === "paid" || booking.paymentStatus === "success")) {
      const stayPkg = booking.packageId ? await getPackage(booking.packageId) : null;
      purchasesList.unshift({
        id: `pur_stay_${booking.id}`,
        type: "stay",
        packageId: booking.packageId || null,
        name: stayPkg?.name || "Stay Reservation",
        description: "Accommodation reservation",
        amount: Number(booking.total || 0),
        currency: "ZAR",
        status: "paid",
        createdAt: booking.fromDate || new Date().toISOString(),
        purchasedBy: booking.customerName || booking.customerEmail || "Customer",
        paymentMethod: "Reservation Payment",
      });
    }

    purchasesList.push(newPurchase);
    const paidAddons = Array.from(new Set([...(booking.paidAddons || []), pkg.id]));

    await updateBooking(id, { purchases: purchasesList, paidAddons });

    return NextResponse.json({
      success: true,
      data: {
        purchase: newPurchase,
        purchases: purchasesList,
        paidAddons,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("POST /api/bookings/[id]/purchases error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
