"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import { useAuth, AuthProvider } from "@/components/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDisplayDate, cn } from "@/lib/utils";
import type { BookingPurchase } from "@/lib/types";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  CheckCircle2Icon,
  GiftIcon,
  KeyRoundIcon,
  LockIcon,
  ReceiptIcon,
  RefreshCwIcon,
  Share2Icon,
  ShieldXIcon,
  SparklesIcon,
  TriangleAlertIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

interface Property {
  id: string;
  title: string;
  slug: string;
  basePricePerNight: number;
  images?: string[];
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  bookingType?: string;
}

interface PackageData {
  id: string;
  propertyId: string;
  name: string;
  price: number;
  description: string;
  category: string;
  isEnabled: boolean;
  isPro?: boolean;
}

interface Booking {
  id: string;
  propertyId: string;
  packageId: string | null;
  customerName: string;
  customerEmail: string;
  fromDate: string;
  toDate: string;
  total: number;
  paymentStatus: string;
  token?: string;
  guests?: string[];
  guestsDetails?: Record<string, { name: string; email?: string; joinedAt?: string }>;
  viewerRole?: "admin" | "host" | "customer" | "guest";
  paidAddons?: string[];
  purchases?: BookingPurchase[];
  createdAt?: string;
}

function BookingDetailsContent({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [isProUser, setIsProUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [purchasingAddonId, setPurchasingAddonId] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [addonError, setAddonError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [isRefreshingLink, setIsRefreshingLink] = useState<boolean>(false);
  const [linkRefreshed, setLinkRefreshed] = useState<boolean>(false);
  const [removingGuestId, setRemovingGuestId] = useState<string>("");
  const [guestError, setGuestError] = useState<string | null>(null);
  const [dismissedNotice, setDismissedNotice] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [showReceipts, setShowReceipts] = useState<boolean>(false);

  const isPaymentSuccess = searchParams.get("payment") === "success" && searchParams.get("intent") === "addon";
  const purchaseSuccessNotice = actionNotice || (isPaymentSuccess && !dismissedNotice
    ? "Add-on successfully purchased! Your reservation and financial ledger have been updated."
    : null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        // 1. Fetch Booking
        const bkRes = await fetch(`/api/bookings/${id}`);
        const bkResult = await bkRes.json();
        if (!bkRes.ok || !bkResult.success) {
          setAccessDenied(bkRes.status === 403);
          setIsLoading(false);
          return;
        }
        let bkData = bkResult.data;

        // Auto-confirm add-on purchase if returning from successful checkout
        const payment = searchParams.get("payment");
        const intent = searchParams.get("intent");
        const addonId = searchParams.get("addonId");

        if (payment === "success" && intent === "addon" && addonId) {
          const isAlreadyRecorded =
            (bkData.paidAddons && bkData.paidAddons.includes(addonId)) ||
            (bkData.purchases && bkData.purchases.some((p: BookingPurchase) => p.packageId === addonId));

          if (!isAlreadyRecorded) {
            try {
              const confirmRes = await fetch(`/api/bookings/${id}/purchases`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId: addonId, paymentStatus: "paid" }),
              });
              const confirmData = await confirmRes.json();
              if (confirmRes.ok && confirmData.success && confirmData.data) {
                bkData = {
                  ...bkData,
                  purchases: confirmData.data.purchases,
                  paidAddons: confirmData.data.paidAddons,
                };
              }
            } catch (confirmErr) {
              console.error("Failed to auto-confirm add-on purchase:", confirmErr);
            }
          }
        }

        setBooking(bkData);

        // Fetch user profile to verify Pro status for current viewer / customer
        const targetUserId = user?.uid;
        const targetEmail = user?.email || bkData.customerEmail;
        if (targetUserId || targetEmail) {
          try {
            const profileRes = await fetch(`/api/user/profile?userId=${targetUserId || ""}&email=${targetEmail || ""}`);
            const profileResult = await profileRes.json();
            if (profileResult.success && profileResult.data) {
              const plan = profileResult.data.plan;
              const isAdmin = profileResult.data.isAdmin;
              setIsProUser(plan === "pro" || Boolean(isAdmin));
            }
          } catch (e) {
            console.error("Failed to load user profile for pro status check:", e);
          }
        }

        // 2. Fetch specific property details directly
        const propRes = await fetch(`/api/posts/${bkData.propertyId}`);
        const propResult = await propRes.json();
        if (propResult.success && propResult.data) {
          setProperty(propResult.data);
        }

        // 3. Fetch Packages for this property
        const pkgRes = await fetch(`/api/packages?propertyId=${bkData.propertyId}`);
        const pkgResult = await pkgRes.json();
        if (pkgResult.success && pkgResult.data) {
          setPackages(pkgResult.data);
        }
      } catch (err) {
        console.error("Failed to load booking details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id, user, searchParams]);

  const handleCopyInviteLink = () => {
    if (!booking?.token) return;
    const inviteUrl = `${window.location.origin}/i/${booking.token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRefreshLink = async () => {
    if (!booking) return;
    if (!window.confirm("Create a new invite link? The current link will stop working for anyone who hasn't joined yet.")) return;
    setIsRefreshingLink(true);
    setGuestError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/invite`, { method: "POST" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Could not refresh the invite link.");
      setBooking((prev) => (prev ? { ...prev, token: result.token } : prev));
      setLinkRefreshed(true);
      setTimeout(() => setLinkRefreshed(false), 4000);
    } catch (err: unknown) {
      setGuestError((err as Error).message || "Could not refresh the invite link.");
    } finally {
      setIsRefreshingLink(false);
    }
  };

  const handleRemoveGuest = async (guestId: string, label: string) => {
    if (!booking) return;
    if (!window.confirm(`Remove ${label} from this booking? They won't be able to rejoin with the invite link.`)) return;
    setRemovingGuestId(guestId);
    setGuestError(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/guests/${encodeURIComponent(guestId)}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Could not remove the guest.");
      setBooking((prev) => {
        if (!prev) return prev;
        const guestsDetails = { ...(prev.guestsDetails || {}) };
        delete guestsDetails[guestId];
        return { ...prev, guests: (prev.guests || []).filter((g) => g !== guestId), guestsDetails };
      });
    } catch (err: unknown) {
      setGuestError((err as Error).message || "Could not remove the guest.");
    } finally {
      setRemovingGuestId("");
    }
  };

  const handlePurchaseAddon = async (addon: PackageData) => {
    if (!booking) return;
    const isProAddon = Boolean(addon.isPro || addon.category === "pro");
    if (isProAddon && !isProUser) {
      setAddonError("This add-on is exclusively available to Pro subscribers. Upgrade to Pro to add it to your stay.");
      return;
    }

    setAddonError(null);
    setPurchasingAddonId(addon.id);
    try {
      const response = await fetch("/api/v1/generate_checkout_link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || booking.customerEmail || "",
        },
        body: JSON.stringify({
          type: addon.id,
          bookingId: booking.id,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.status) {
        // Fallback for development/testing when payments are not live or test mode
        const fallbackRes = await fetch(`/api/bookings/${booking.id}/purchases`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId: addon.id }),
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.success) {
          setBooking((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              purchases: fallbackData.data.purchases,
              paidAddons: fallbackData.data.paidAddons,
            };
          });
          setActionNotice(`"${addon.name}" has been successfully added to your stay!`);
          setPurchasingAddonId("");
          return;
        }

        throw new Error(result.data || fallbackData.error || "Failed to generate checkout link.");
      }

      window.location.assign(result.data.redirectUrl);
    } catch (err: unknown) {
      const error = err as Error;
      setAddonError(error.message || "Failed to initiate purchase.");
      setPurchasingAddonId("");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Spinner className="size-6 text-primary" />
        <span className="text-sm text-muted-foreground">Retrieving stay details...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <KeyRoundIcon />
            </EmptyMedia>
            <EmptyTitle>Authentication required</EmptyTitle>
            <EmptyDescription>
              Please log in to view stay reservation information.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              className="w-full"
              nativeButton={false}
              render={<Link href={`/login?redirect=/bookings/${id}`} />}
            >
              Sign in
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  if (!booking && !accessDenied) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Booking not found</EmptyTitle>
            <EmptyDescription>
              The requested booking details could not be found or have been removed.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              className="w-full"
              nativeButton={false}
              render={<Link href="/bookings" />}
            >
              Go to bookings dashboard
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  // The API only returns bookings the user is party to, hosts or administers.
  if (accessDenied || !booking) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ShieldXIcon />
            </EmptyMedia>
            <EmptyTitle>Access restricted</EmptyTitle>
            <EmptyDescription>
              You do not have authorization to view this booking.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              className="w-full"
              nativeButton={false}
              render={<Link href="/bookings" />}
            >
              Go to bookings dashboard
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const canManage = booking.viewerRole === "customer" || booking.viewerRole === "host" || booking.viewerRole === "admin";
  const isHourly = property?.bookingType === "hourly";
  const checkIn = formatDisplayDate(booking.fromDate);
  const checkOut = formatDisplayDate(booking.toDate);
  const stayNights = Math.max(
    1,
    Math.ceil(Math.abs(new Date(booking.toDate).getTime() - new Date(booking.fromDate).getTime()) / (1000 * 60 * 60 * 24))
  );

  let checkInTimeStr = "From 14:00";
  let checkOutTimeStr = "By 10:00";
  let checkInLabel = "Standard arrival window";
  let checkOutLabel = "Departure cutoff time";

  if (isHourly) {
    const fromDateObj = new Date(booking.fromDate);
    const toDateObj = new Date(booking.toDate);
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    };
    checkInTimeStr = `At ${formatTime(fromDateObj)}`;
    checkOutTimeStr = `Until ${formatTime(toDateObj)}`;
    checkInLabel = "Scheduled start time";
    checkOutLabel = "Scheduled end time";
  }
  const propName = property ? property.title : booking.propertyId;
  const isPaid = booking.paymentStatus === "paid" || booking.paymentStatus === "success";

  const isPackagePro = (p: PackageData) => Boolean(p.isPro || p.category === "pro");
  const isAddon = (p: PackageData) => p.category === "addon";

  // Standard add-ons available for any guest, or all add-ons if customer is Pro
  const availableAddons = packages.filter(
    (p) => p.propertyId === booking.propertyId && isAddon(p) && (isProUser || !isPackagePro(p))
  );

  // Pro-exclusive add-ons on this property
  const proAddons = packages.filter(
    (p) => p.propertyId === booking.propertyId && isAddon(p) && isPackagePro(p)
  );

  const bookedPackage = packages.find((p) => p.id === booking.packageId);

  const statusVariant: "default" | "secondary" | "destructive" = isPaid
    ? "default"
    : booking.paymentStatus === "failed"
      ? "destructive"
      : "secondary";

  // Financial record computations
  const recordedStayPurchase = (booking.purchases || []).find((p) => p.type === "stay");
  const staySubtotal = Number(booking.total || 0);

  const recordedAddonPurchases = (booking.purchases || []).filter((p) => p.type === "addon");
  const recordedAddonPackageIds = new Set(recordedAddonPurchases.map((p) => p.packageId));

  const legacyAddonPurchases: BookingPurchase[] = (booking.paidAddons || [])
    .filter((addonId) => !recordedAddonPackageIds.has(addonId))
    .map((addonId) => {
      const pkg = packages.find((p) => p.id === addonId);
      return {
        id: `pur_legacy_${addonId}`,
        type: "addon",
        packageId: addonId,
        name: pkg?.name || "Add-on Package",
        description: pkg?.description || "",
        amount: Number(pkg?.price || 0),
        currency: "ZAR",
        status: "paid",
        createdAt: booking.fromDate || new Date().toISOString(),
        purchasedBy: booking.customerName || "Customer",
        paymentMethod: "Online Payment",
      };
    });

  const allAddonPurchases: BookingPurchase[] = [...recordedAddonPurchases, ...legacyAddonPurchases];

  const purchasedAddonIds = new Set([
    ...(booking.paidAddons || []),
    ...(allAddonPurchases.map((p) => p.packageId).filter(Boolean) as string[]),
  ]);

  const addonsSubtotal = allAddonPurchases
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const grandTotal = staySubtotal + addonsSubtotal;
  const totalPaid = (isPaid ? staySubtotal : 0) + addonsSubtotal;
  const balanceRemaining = Math.max(0, grandTotal - totalPaid);

  const allPurchasesList: BookingPurchase[] = [
    recordedStayPurchase || {
      id: `stay_${booking.id}`,
      type: "stay",
      packageId: booking.packageId,
      name: bookedPackage?.name || (isHourly ? "Hourly Space Reservation" : "Stay Reservation"),
      description: isHourly
        ? `${checkInTimeStr} - ${checkOutTimeStr}`
        : `${stayNights} night${stayNights > 1 ? "s" : ""} • ${checkIn} to ${checkOut}`,
      amount: staySubtotal,
      currency: "ZAR",
      status: isPaid ? "paid" : "pending",
      createdAt: booking.fromDate || new Date().toISOString(),
      purchasedBy: booking.customerName || booking.customerEmail,
      paymentMethod: "Reservation Payment",
    },
    ...allAddonPurchases,
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reservation overview
          </span>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
            Booking overview
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="self-start sm:self-auto"
          nativeButton={false}
          render={<Link href="/bookings" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back to dashboard
        </Button>
      </header>

      {purchaseSuccessNotice && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200">
          <CheckCircle2Icon className="size-4 text-emerald-600" />
          <AlertTitle>Add-on confirmed!</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{purchaseSuccessNotice}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDismissedNotice(true);
                setActionNotice(null);
              }}
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
        {/* Main Left Column */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Property Summary & Status Card */}
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <CardTitle className="truncate text-2xl">{propName}</CardTitle>
                <CardDescription className="truncate font-mono text-xs">
                  Ref: {booking.id}
                </CardDescription>
                <div className="pt-1">
                  <Badge variant={statusVariant}>{booking.paymentStatus}</Badge>
                </div>
              </div>

              {property?.images && property.images.length > 0 && (
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={property.images[0] || "/placeholder.svg"}
                    alt={propName}
                    className="size-full object-cover"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Separator />
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Primary guest</span>
                <span className="font-medium">{booking.customerName}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">Contact email</span>
                <span className="truncate font-mono text-xs">{booking.customerEmail}</span>
              </div>
              {booking.packageId && (
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Stay package</span>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>{bookedPackage?.name || booking.packageId}</span>
                    {bookedPackage && isPackagePro(bookedPackage) && (
                      <Badge className="bg-secondary/15 text-secondary border border-secondary/30 text-[9px] font-bold uppercase">
                        Pro
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Check-in / Check-out Schedule */}
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-muted-foreground" />
                {isHourly ? "Slot schedule" : "Stay schedule"}
              </CardTitle>
              <Badge variant="secondary">
                {isHourly ? "Hourly slot" : `${stayNights} night${stayNights > 1 ? "s" : ""} total`}
              </Badge>
            </CardHeader>
            <CardContent className={`grid grid-cols-1 gap-4 ${isHourly ? "" : "sm:grid-cols-2"}`}>
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {isHourly ? "Start time" : "Check-in"}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{checkInTimeStr}</span>
                </div>
                <span className="font-heading text-base font-medium">{checkIn}</span>
                <span className="text-xs text-muted-foreground">{checkInLabel}</span>
              </div>

              {!isHourly && (
                <div className="flex flex-col gap-1 rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Check-out
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">{checkOutTimeStr}</span>
                  </div>
                  <span className="font-heading text-base font-medium">{checkOut}</span>
                  <span className="text-xs text-muted-foreground">{checkOutLabel}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Guest Management & Invitation Portal */}
          {isPaid && (
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="size-4 text-muted-foreground" />
                    Invited stay guests
                  </CardTitle>
                  <CardDescription>
                    {canManage
                      ? "Share your invite link with companions. You'll get an email when someone joins."
                      : `${booking.customerName} manages the invite link and guest list for this stay.`}
                  </CardDescription>
                </div>

                {canManage && booking.token && (
                  <Button onClick={handleCopyInviteLink} className="shrink-0">
                    {copiedLink ? (
                      <CheckIcon data-icon="inline-start" />
                    ) : (
                      <Share2Icon data-icon="inline-start" />
                    )}
                    {copiedLink ? "Invite copied" : "Share invite link"}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {guestError && (
                  <Alert variant="destructive">
                    <TriangleAlertIcon />
                    <AlertDescription>{guestError}</AlertDescription>
                  </Alert>
                )}

                {canManage && (
                  <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
                    {booking.token && (
                      <span className="break-all font-mono text-xs text-muted-foreground">
                        {typeof window !== "undefined" ? `${window.location.origin}/i/${booking.token}` : ""}
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {linkRefreshed
                          ? "New link created. The old link no longer works."
                          : "Shared the link with the wrong person? Refresh it."}
                      </span>
                      <Button variant="outline" size="sm" onClick={handleRefreshLink} disabled={isRefreshingLink}>
                        {isRefreshingLink ? (
                          <Spinner className="size-3.5" data-icon="inline-start" />
                        ) : (
                          <RefreshCwIcon data-icon="inline-start" />
                        )}
                        Refresh invite link
                      </Button>
                    </div>
                  </div>
                )}

                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Confirmed party ({booking.guests?.length || 0})
                </span>

                {booking.guests && booking.guests.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {booking.guests.map((gUid) => {
                      const details = booking.guestsDetails?.[gUid];
                      const guestName =
                        details?.name ||
                        (gUid === user.uid
                          ? user.displayName || user.email?.split("@")[0] || "You"
                          : "Guest");

                      const label =
                        gUid === user.uid && guestName !== "You"
                          ? `${guestName} (You)`
                          : guestName;

                      return (
                        <li
                          key={gUid}
                          className="flex items-center justify-between gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm"
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            <UserIcon className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate text-xs">
                              {label}
                              {canManage && details?.email ? ` · ${details.email}` : ""}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            {details?.joinedAt && (
                              <span className="hidden text-xs text-muted-foreground sm:inline">
                                Joined {formatDisplayDate(details.joinedAt)}
                              </span>
                            )}
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveGuest(gUid, guestName)}
                                disabled={removingGuestId === gUid}
                              >
                                {removingGuestId === gUid ? "Removing..." : "Remove"}
                              </Button>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-dashed p-5 text-center">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {canManage
                        ? "No companions have accepted this stay invite yet. Share the link above to invite them."
                        : "No other guests have joined yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Financial Summary & Add-ons */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Financial Breakdown Card with Full Purchases Record */}
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl">Financial breakdown</CardTitle>
                <CardDescription>
                  Record of stay accommodation & purchased add-ons
                </CardDescription>
              </div>
              <Badge
                variant={statusVariant}
                className={isPaid && balanceRemaining === 0 ? "bg-emerald-600 hover:bg-emerald-600 text-white font-semibold" : undefined}
              >
                {isPaid && balanceRemaining === 0 ? "Fully settled" : booking.paymentStatus}
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Itemized Line Items */}
              <div className="flex flex-col gap-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Itemized charges
                </span>

                {/* Base Stay Reservation Item */}
                <div className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-card p-3 text-sm">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <CalendarIcon className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{bookedPackage?.name || "Stay Reservation"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {isHourly
                        ? `${checkInTimeStr} - ${checkOutTimeStr}`
                        : `${stayNights} night${stayNights > 1 ? "s" : ""} • ${checkIn} to ${checkOut}`}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-heading font-semibold tabular-nums text-foreground">
                      R {staySubtotal.toLocaleString()}
                    </span>
                    <Badge
                      variant={isPaid ? "outline" : "secondary"}
                      className={isPaid ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-[10px]" : "text-[10px]"}
                    >
                      {isPaid ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                </div>

                {/* Purchased Add-ons List */}
                {allAddonPurchases.length > 0 ? (
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>Add-on packages ({allAddonPurchases.length})</span>
                      <span className="text-foreground tabular-nums">
                        R {addonsSubtotal.toLocaleString()}
                      </span>
                    </div>

                    {allAddonPurchases.map((purchase) => {
                      const matchingPkg = packages.find((p) => p.id === purchase.packageId);
                      const isPro = matchingPkg ? isPackagePro(matchingPkg) : false;
                      const purchaserLabel =
                        typeof purchase.purchasedBy === "string"
                          ? purchase.purchasedBy
                          : purchase.purchasedBy?.name || purchase.purchasedBy?.email || "Guest";

                      return (
                        <div
                          key={purchase.id}
                          className="flex items-start justify-between gap-3 rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-sm transition-colors"
                        >
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <GiftIcon className="size-3.5 text-secondary shrink-0" />
                              <span className="truncate">{purchase.name}</span>
                              {isPro && (
                                <Badge className="bg-secondary text-secondary-foreground border-none font-bold text-[8px] uppercase px-1.5 py-0">
                                  Pro
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {purchase.createdAt && (
                                <span>{formatDisplayDate(purchase.createdAt)}</span>
                              )}
                              {purchaserLabel && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">By {purchaserLabel}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="font-heading font-semibold tabular-nums text-foreground">
                              R {Number(purchase.amount).toLocaleString()}
                            </span>
                            <Badge
                              variant="outline"
                              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 text-[10px] flex items-center gap-1"
                            >
                              <CheckCircle2Icon className="size-2.5" />
                              Paid
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      No add-on packages purchased yet. See available upgrades below.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Subtotals & Grand Total Summary */}
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Stay subtotal</span>
                  <span className="tabular-nums">R {staySubtotal.toLocaleString()}</span>
                </div>
                {allAddonPurchases.length > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Add-ons subtotal</span>
                    <span className="tabular-nums">+ R {addonsSubtotal.toLocaleString()}</span>
                  </div>
                )}

                <Separator className="my-1" />

                <div className="flex items-center justify-between">
                  <span className="font-heading font-semibold text-foreground">Total charges</span>
                  <span className="font-heading text-xl font-bold tabular-nums text-foreground">
                    R {grandTotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total paid</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                    R {totalPaid.toLocaleString()}
                  </span>
                </div>

                {balanceRemaining > 0 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Balance remaining</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                      R {balanceRemaining.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Collapsible Purchase History & Receipts Ledger */}
              <div className="pt-2 border-t border-border/70">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReceipts((prev) => !prev)}
                  className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <ReceiptIcon className="size-3.5" />
                    Purchase ledger & receipts ({allPurchasesList.length})
                  </span>
                  <span>{showReceipts ? "Hide" : "Show"}</span>
                </Button>

                {showReceipts && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-dashed border-border/70">
                    {allPurchasesList.map((pur) => (
                      <div
                        key={pur.id}
                        className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-2 text-xs"
                      >
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="font-medium truncate text-foreground">{pur.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono truncate">
                            Ref: {pur.id} • {pur.createdAt ? formatDisplayDate(pur.createdAt) : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-heading font-semibold tabular-nums text-foreground">
                            R {Number(pur.amount).toLocaleString()}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-bold border-emerald-500/40 text-emerald-600"
                          >
                            {pur.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* In-App Add-ons Purchases */}
          {isPaid && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2">
                    <GiftIcon className="size-4 text-muted-foreground" />
                    Enhance stay
                  </CardTitle>
                  <CardDescription>
                    Select optional upgrades for this destination listing.
                  </CardDescription>
                </div>
                {isProUser && proAddons.length > 0 && (
                  <Badge className="bg-secondary/15 text-secondary border border-secondary/30 text-[10px] font-bold tracking-wider uppercase">
                    Pro Member Access
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {addonError && (
                  <Alert variant="destructive">
                    <TriangleAlertIcon />
                    <AlertTitle>Purchase failed</AlertTitle>
                    <AlertDescription>{addonError}</AlertDescription>
                  </Alert>
                )}

                {availableAddons.length === 0 && (!isProUser && proAddons.length === 0) ? (
                  <p className="text-sm text-muted-foreground">
                    No add-ons available for this property.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {availableAddons.map((addon) => {
                      const isProAddonItem = isPackagePro(addon);
                      const isAlreadyPurchased = purchasedAddonIds.has(addon.id);

                      return (
                        <div
                          key={addon.id}
                          className={cn(
                            "flex flex-col gap-3 rounded-lg border p-4 transition-colors",
                            isAlreadyPurchased
                              ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                              : isProAddonItem
                                ? "border-secondary/40 bg-secondary/5 hover:border-secondary/60"
                                : "border-border bg-muted/50 hover:border-primary/50"
                          )}
                        >
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {isProAddonItem && (
                                  <Badge className="bg-secondary hover:bg-secondary/90 text-secondary-foreground border-none font-bold text-[9px] uppercase flex items-center gap-1">
                                    <SparklesIcon className="size-2.5" />
                                    Pro Exclusive
                                  </Badge>
                                )}
                                <h3 className="font-heading text-sm font-medium">{addon.name}</h3>
                              </div>
                              {isAlreadyPurchased && (
                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 border-none font-bold text-[9px] uppercase flex items-center gap-1">
                                  <CheckCircle2Icon className="size-2.5" />
                                  Purchased
                                </Badge>
                              )}
                            </div>
                            {addon.description && (
                              <p className="text-sm leading-relaxed text-muted-foreground">
                                {addon.description}
                              </p>
                            )}
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-heading text-sm font-semibold tabular-nums">
                              R {addon.price.toLocaleString()}
                            </span>
                            {isAlreadyPurchased ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 font-semibold cursor-not-allowed"
                              >
                                <CheckIcon className="size-3.5" data-icon="inline-start" />
                                Added to stay
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handlePurchaseAddon(addon)}
                                disabled={purchasingAddonId === addon.id}
                                className={isProAddonItem ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold" : undefined}
                              >
                                {purchasingAddonId === addon.id && (
                                  <Spinner className="size-3.5" data-icon="inline-start" />
                                )}
                                {purchasingAddonId === addon.id ? "Connecting..." : "Add to stay"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Locked Pro Add-on Teaser for Non-Pro Customers */}
                {!isProUser && proAddons.length > 0 && (
                  <div className="flex flex-col gap-3 rounded-xl border border-secondary/30 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary/20 text-secondary">
                          <LockIcon className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                            {proAddons.length} Pro-Exclusive Add-on{proAddons.length > 1 ? "s" : ""}
                          </p>
                          <p className="text-xs font-semibold text-foreground">
                            Available for Pro subscribers only
                          </p>
                        </div>
                      </div>

                      <Link href="/subscribe">
                        <Button size="sm" className="h-7 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-xs font-bold px-3">
                          Unlock with Pro
                        </Button>
                      </Link>
                    </div>

                    <div className="flex flex-col gap-2 pt-1 border-t border-secondary/20">
                      {proAddons.map((addon) => {
                        const isAlreadyPurchased = purchasedAddonIds.has(addon.id);
                        return (
                          <div
                            key={addon.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-secondary/20 bg-background/60 px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-secondary/40 text-secondary text-[9px] font-bold uppercase">
                                Pro Only
                              </Badge>
                              <span className="font-medium text-foreground">{addon.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-muted-foreground">
                                R {addon.price.toLocaleString()}
                              </span>
                              {isAlreadyPurchased && (
                                <Badge className="bg-emerald-600 text-white font-bold text-[8px] uppercase">
                                  Purchased
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      }
    >
      <AuthProvider>
        <BookingDetailsContent id={unwrappedParams.id} />
      </AuthProvider>
    </Suspense>
  );
}
