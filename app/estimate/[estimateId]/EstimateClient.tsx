"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, AuthProvider } from "@/components/auth";
import { formatDisplayDate } from "@/lib/utils";
import { trackPixelEstimate, trackPixelEvent } from "@/lib/client-pixel";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  CircleCheckIcon,
  HouseIcon,
  KeyRoundIcon,
  LinkIcon,
  RefreshCwIcon,
  LockIcon,
  PinIcon,
  ShieldXIcon,
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
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

interface Estimate {
  id: string;
  propertyId: string;
  packageId: string | null;
  customerName: string;
  customerEmail: string;
  customerId: string;
  fromDate: string;
  toDate: string;
  total: number;
  paymentStatus: string;
  token?: string;
  guests?: string[];
  guestsDetails?: Record<string, { name: string; email?: string; joinedAt?: string }>;
  viewerRole?: "admin" | "host" | "customer" | "guest";
}

import { MandatoryRule } from "@/lib/types";
import { mandatoryPackageIdsFor, quoteStay, resolveMembershipTier, standardStayFeeFor, type MembershipTier } from "@/lib/pricing";

interface Property {
  id: string;
  title: string;
  slug: string;
  basePricePerNight: number;
  bookingType?: string;
  images?: string[];
  imageUrl?: string;
  image?: string;
  coverImage?: string;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  mandatoryRules?: MandatoryRule[];
}

interface Package {
  id: string;
  propertyId: string;
  name: string;
  price: number;
  description: string;
  category: string;
  isEnabled: boolean;
  isPro?: boolean;
}

interface EstimateClientProps {
  estimate: Estimate;
  property: Property | null;
  selectedPackage: Package | null;
}

function EstimateClientContent({ estimate: initialEstimate, property, selectedPackage }: EstimateClientProps) {
  const { user, loading: authLoading } = useAuth();
  // The server-rendered estimate has no token or contact details; the viewer's scoped
  // copy (with their role) is loaded from the API once they are signed in.
  const [estimate, setEstimate] = useState<Estimate>(initialEstimate);
  const [access, setAccess] = useState<"loading" | "granted" | "denied">("loading");
  const [copied, setCopied] = useState(false);
  const [isRefreshingLink, setIsRefreshingLink] = useState(false);
  const [linkRefreshed, setLinkRefreshed] = useState(false);
  const [removingGuestId, setRemovingGuestId] = useState<string>("");
  const [guestError, setGuestError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(estimate.packageId || "");
  const [isUpdatingPackage, setIsUpdatingPackage] = useState(false);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [isProUser, setIsProUser] = useState<boolean>(false);
  const [membershipTier, setMembershipTier] = useState<MembershipTier>("standard");

  const [hasUserPaid, setHasUserPaid] = useState(false);
  const [isLoadingPaymentStatus, setIsLoadingPaymentStatus] = useState(true);

  const [latestEstimate, setLatestEstimate] = useState<any | null>(null);
  const [latestEstimatePropertyTitle, setLatestEstimatePropertyTitle] = useState<string>("");

  // Track Meta Pixel InitiateCheckout event on the estimate page
  useEffect(() => {
    trackPixelEstimate({
      estimateId: initialEstimate.id,
      total: initialEstimate.total,
      propertyId: initialEstimate.propertyId,
      propertyName: property?.title || "Stay Estimate",
      fromDate: initialEstimate.fromDate,
      toDate: initialEstimate.toDate,
      status: initialEstimate.paymentStatus || "pending",
    });
  }, [
    initialEstimate.id,
    initialEstimate.total,
    initialEstimate.propertyId,
    initialEstimate.fromDate,
    initialEstimate.toDate,
    initialEstimate.paymentStatus,
    property?.title,
  ]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAccess("denied");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/estimates/${initialEstimate.id}`);
        const result = await res.json();
        if (cancelled) return;
        if (res.ok && result.success && result.data) {
          setEstimate(result.data);
          setAccess("granted");
        } else {
          setAccess("denied");
        }
      } catch (err) {
        console.error("Failed to load estimate access:", err);
        if (!cancelled) setAccess("denied");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, initialEstimate.id]);

  const canManage = estimate.viewerRole === "customer" || estimate.viewerRole === "host" || estimate.viewerRole === "admin";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsProUser(false);
      setMembershipTier("standard");
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/user/profile?userId=${user.uid}&email=${user.email || ""}`);
        const result = await res.json();
        if (result.success && result.data) {
          const plan = result.data.plan;
          const isAdmin = Boolean(result.data.isAdmin);
          const billingInterval = result.data.billingInterval;
          setIsProUser(plan === "pro" || isAdmin);
          setMembershipTier(resolveMembershipTier({ plan, billingInterval, isAdmin }));
        }
      } catch (err) {
        console.error("Failed to load user profile in estimate client:", err);
      }
    };
    fetchProfile();
  }, [user, authLoading]);

  const from = new Date(estimate.fromDate);
  const to = new Date(estimate.toDate);

  const basePricePerNight = property ? property.basePricePerNight : 1500;
  const currentSelectedPackage = packages.find(p => p.id === selectedPackageId) || (selectedPackageId === estimate.packageId ? selectedPackage : null);

  // Same calculation the API uses to store and charge the total.
  const quote = quoteStay(property ?? { basePricePerNight }, from, to, currentSelectedPackage, membershipTier);
  const isHourly = quote.isHourly;
  const nights = quote.units;
  const isPaid = isHourly
    ? hasUserPaid
    : (estimate.paymentStatus === "paid" || estimate.paymentStatus === "success" || hasUserPaid);

  const weeklyDiscount = property?.weeklyDiscount ?? 0;
  const monthlyDiscount = property?.monthlyDiscount ?? 0;
  const discountAmount = quote.discountAmount;
  const packagePrice = quote.packagePrice;
  const standardFee = quote.standardFee;
  const finalTotal = quote.total;

  const isPackagePro = (p: Package) => Boolean(p.isPro || p.category === "pro");
  const availablePackages = packages.filter((p) => !isPackagePro(p) || isProUser);
  const proPackages = packages.filter((p) => isPackagePro(p));

  const handlePackageChange = async (packageId: string) => {
    // Guests have a read-only view; only the organiser, host or an admin may change the package.
    if (!canManage) return;
    if (packageId) {
      const activePkg = packages.find((p) => p.id === packageId);
      if (activePkg && isPackagePro(activePkg) && !isProUser) {
        setPackageError("This package is exclusively available to Pro subscribers.");
        return;
      }
    }

    setSelectedPackageId(packageId);
    setIsUpdatingPackage(true);
    setPackageError(null);

    try {
      const res = await fetch("/api/estimates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId: estimate.id,
          packageId: packageId || null
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to update package option in database.");
      }

      setEstimate((prev) => ({
        ...prev,
        total: result.estimate?.total ?? prev.total,
        packageId: result.estimate?.packageId ?? (packageId || null),
      }));
    } catch (err: any) {
      setPackageError(err?.message || "Failed to update the selected package.");
    } finally {
      setIsUpdatingPackage(false);
    }
  };

  const mandatoryPackageIds = React.useMemo(
    () => mandatoryPackageIdsFor(property, nights),
    [property, nights]
  );

  const hasMandatoryRule = mandatoryPackageIds.length > 0;

  const userAllowedMandatoryIds = React.useMemo(() => {
    return mandatoryPackageIds.filter((id) => {
      const pkg = packages.find((p) => p.id === id);
      if (!pkg) return true;
      return !isPackagePro(pkg) || isProUser;
    });
  }, [mandatoryPackageIds, packages, isProUser]);

  useEffect(() => {
    if (!canManage) return;
    if (hasMandatoryRule) {
      if (userAllowedMandatoryIds.length > 0) {
        if (!userAllowedMandatoryIds.includes(selectedPackageId)) {
          handlePackageChange(userAllowedMandatoryIds[0] || "");
        }
      } else {
        if (selectedPackageId) {
          const selPkg = packages.find((p) => p.id === selectedPackageId);
          if (selPkg && isPackagePro(selPkg) && !isProUser) {
            handlePackageChange("");
          }
        }
      }
    } else {
      if (!isProUser && selectedPackageId) {
        const selPkg = packages.find((p) => p.id === selectedPackageId);
        if (selPkg && isPackagePro(selPkg)) {
          handlePackageChange("");
        }
      }
    }
  }, [canManage, hasMandatoryRule, mandatoryPackageIds, userAllowedMandatoryIds, selectedPackageId, packages, isProUser]);

  // Fetch packages for the property
  useEffect(() => {
    const loadPackages = async () => {
      try {
        const res = await fetch(`/api/packages?propertyId=${estimate.propertyId}`);
        const result = await res.json();
        if (result.success && result.data) {
          setPackages(result.data.filter((p: any) => p.category !== "addon"));
        }
      } catch (err) {
        console.error("Failed to load packages on estimate page:", err);
      }
    };
    loadPackages();
  }, [estimate.propertyId]);

  // Check if current user has already paid for this estimate (to support multiple hourly payments)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoadingPaymentStatus(false);
      return;
    }
    const checkUserPaid = async () => {
      try {
        const res = await fetch(`/api/bookings?propertyId=${estimate.propertyId}`);
        const result = await res.json();
        if (result.success && result.data) {
          const userBooking = result.data.find(
            (b: any) => b.estimateId === estimate.id && (b.customerId === user.uid || b.customerEmail === user.email) && (b.paymentStatus === "paid" || b.paymentStatus === "success")
          );
          if (userBooking) {
            setHasUserPaid(true);
          }
        }
      } catch (err) {
        console.error("Failed to check user payment status:", err);
      } finally {
        setIsLoadingPaymentStatus(false);
      }
    };
    checkUserPaid();
  }, [estimate.propertyId, estimate.id, user, authLoading]);

  // Load latest estimate
  useEffect(() => {
    if (!user) {
      setLatestEstimate(null);
      return;
    }

    const fetchLatestEstimate = async () => {
      try {
        const res = await fetch(`/api/estimates/latest?userId=${user.uid}`);
        const result = await res.json();
        if (result.success && result.data) {
          setLatestEstimate(result.data);
          try {
            const propRes = await fetch(`/api/posts/${result.data.propertyId}`);
            const propResult = await propRes.json();
            if (propResult.success && propResult.data) {
              setLatestEstimatePropertyTitle(propResult.data.title || propResult.data.name || "");
            }
          } catch (propErr) {
            console.error("Failed to fetch latest estimate property details:", propErr);
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest active estimate:", err);
      }
    };
    fetchLatestEstimate();
  }, [user]);

  // Copy share url helper (only managers receive the token)
  const inviteUrl =
    typeof window !== "undefined" && estimate.token ? `${window.location.origin}/i/${estimate.token}` : "";

  const handleRefreshLink = async () => {
    if (!window.confirm("Create a new invite link? The current link will stop working for anyone who hasn't joined yet.")) return;
    setIsRefreshingLink(true);
    setGuestError(null);
    try {
      const res = await fetch(`/api/estimates/${estimate.id}/invite`, { method: "POST" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Could not refresh the invite link.");
      setEstimate((prev) => ({ ...prev, token: result.token }));
      setLinkRefreshed(true);
      setTimeout(() => setLinkRefreshed(false), 4000);
    } catch (err: any) {
      setGuestError(err.message || "Could not refresh the invite link.");
    } finally {
      setIsRefreshingLink(false);
    }
  };

  const handleRemoveGuest = async (guestId: string, label: string) => {
    if (!window.confirm(`Remove ${label} from this stay? They won't be able to rejoin with the invite link.`)) return;
    setRemovingGuestId(guestId);
    setGuestError(null);
    try {
      const res = await fetch(`/api/estimates/${estimate.id}/guests/${encodeURIComponent(guestId)}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Could not remove the guest.");
      setEstimate((prev) => {
        const guestsDetails = { ...(prev.guestsDetails || {}) };
        delete guestsDetails[guestId];
        return { ...prev, guests: (prev.guests || []).filter((g) => g !== guestId), guestsDetails };
      });
    } catch (err: any) {
      setGuestError(err.message || "Could not remove the guest.");
    } finally {
      setRemovingGuestId("");
    }
  };

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePay = async () => {
    setIsPaying(true);
    setPayError(null);

    try {
      const targetType = currentSelectedPackage
        ? currentSelectedPackage.id
        : (packages.length > 0
          ? packages[0].id
          : (estimate.propertyId === "cottage" ? "long_weekend_at_the_Cottage" : "shack_stack")
        );

      const linkRes = await fetch("/api/v1/generate_checkout_link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: targetType,
          estimateId: estimate.id,
          userId: user?.uid,
          email: user?.email,
          name: user?.displayName || user?.email?.split("@")[0] || "Guest"
        }),
      });

      const linkResult = await linkRes.json();
      if (!linkRes.ok || !linkResult.status) {
        throw new Error(linkResult.data || "Redirect link generation failed.");
      }

      // Track payment initiation in Meta Pixel
      trackPixelEvent(
        "AddPaymentInfo",
        {
          content_name: property?.title || "Stay Estimate",
          content_ids: [estimate.propertyId],
          content_type: "product",
          value: finalTotal,
          currency: "ZAR",
        },
        { eventID: `payment_${estimate.id}` }
      );

      window.location.href = linkResult.data.redirectUrl;
    } catch (err: any) {
      setPayError(err.message || "An error occurred generating checkout link.");
      setIsPaying(false);
    }
  };

  if (authLoading || isLoadingPaymentStatus || (user && access === "loading")) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Spinner className="size-6 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Securing session context</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Empty className="mx-auto my-20 max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <KeyRoundIcon />
          </EmptyMedia>
          <EmptyTitle>Authentication required</EmptyTitle>
          <EmptyDescription>
            Please sign in to view and interact with these estimate details.
          </EmptyDescription>
        </EmptyHeader>
        <Button
          nativeButton={false}
          render={<Link href={`/login?redirect=/estimate/${estimate.id}`} />}
        >
          Sign in
        </Button>
      </Empty>
    );
  }

  if (access !== "granted") {
    return (
      <Empty className="mx-auto my-20 max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="text-destructive">
            <ShieldXIcon />
          </EmptyMedia>
          <EmptyTitle>Access denied</EmptyTitle>
          <EmptyDescription>
            You do not have permission to view this estimate. You must be invited as a guest or be
            the customer who generated the estimate.
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Go home
        </Button>
      </Empty>
    );
  }

  const propThumbnail =
    property?.images?.[0] || property?.imageUrl || property?.image || property?.coverImage;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 font-sans sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Stay estimate
          </span>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">
            Estimate for {property?.title || "Llandudno"}
          </h1>
          <span className="font-mono text-xs text-muted-foreground">Ref: {estimate.id}</span>
        </div>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Return home
        </Button>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
        {/* Left Side: Summary Details */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Stay Configuration Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col items-start gap-1.5">
                  <Badge variant="secondary">
                    {estimate.propertyId === "shack"
                      ? "Beach Shack"
                      : estimate.propertyId === "cottage"
                        ? "Cozy Cottage"
                        : "Yoga Retreat"}
                  </Badge>
                  <CardTitle className="text-lg">
                    {property?.title || "Llandudno Property"}
                  </CardTitle>
                  <CardDescription>Estimate configuration and customer details</CardDescription>
                </div>

                {propThumbnail ? (
                  <img
                    src={propThumbnail || "/placeholder.svg"}
                    alt={property?.title || "Property"}
                    className="size-16 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <HouseIcon className="size-6" />
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-2 pt-(--card-spacing)">
              <Separator className="mb-2" />
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{estimate.customerName}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Contact email</span>
                <span className="font-mono text-xs">{estimate.customerEmail}</span>
              </div>
            </CardContent>
          </Card>

          {/* Booking Dates & Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="size-4 text-muted-foreground" />
                {isHourly ? "Reserved slot date" : "Reserved stay dates"}
              </CardTitle>
              <div data-slot="card-action" className="col-start-2 row-start-1 justify-self-end">
                <Badge variant="secondary">
                  {isHourly ? "1 slot" : `${nights} night${nights > 1 ? "s" : ""}`}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className={`grid grid-cols-1 gap-4 ${isHourly ? "" : "sm:grid-cols-2"}`}>
              {/* Check In */}
              <div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {isHourly ? "Start time" : "Check-in"}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDisplayDate(from)}
                  </span>
                </div>
                <span className="font-heading text-base font-semibold">
                  {isHourly
                    ? from.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })
                    : "From 14:00"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isHourly ? "Slot time" : "Arrival window"}
                </span>
              </div>

              {/* Check Out */}
              {!isHourly && (
                <div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Check-out
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatDisplayDate(to)}
                    </span>
                  </div>
                  <span className="font-heading text-base font-semibold">
                    By 10:00
                  </span>
                  <span className="text-xs text-muted-foreground">Departure window</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Select Package Option Tiles */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Select package option</CardTitle>
              <CardDescription>
                {!canManage
                  ? "The organiser chooses the package for this stay."
                  : isHourly
                  ? "Enhance your booking by choosing a curated package experience, or check out with standard options."
                  : "Enhance your stay by choosing a curated package experience, or check out with standard accommodation."}
              </CardDescription>
            </CardHeader>

            <CardContent
              role="radiogroup"
              aria-label="Package option"
              className="flex flex-col gap-3"
            >
              {packageError && (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>Could not update package</AlertTitle>
                  <AlertDescription>{packageError}</AlertDescription>
                </Alert>
              )}

              {/* Option: Standard / No Package Tile */}
              <button
                type="button"
                role="radio"
                aria-checked={selectedPackageId === ""}
                disabled={!canManage || isUpdatingPackage || isPaid || (hasMandatoryRule && userAllowedMandatoryIds.length > 0)}
                onClick={() => handlePackageChange("")}
                className={`flex w-full items-start justify-between gap-4 rounded-lg border p-4 text-left transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-70 ${selectedPackageId === ""
                  ? "border-primary bg-primary/5"
                  : "bg-muted/30 hover:bg-muted/60"
                  } ${(hasMandatoryRule && userAllowedMandatoryIds.length > 0) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${selectedPackageId === ""
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input"
                    }`}
                >
                  {selectedPackageId === "" && <CheckIcon className="size-3" />}
                </span>

                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-sm font-medium">
                      {isHourly ? "Standard slot" : "Standard stay"}
                    </span>
                    {membershipTier === "pro_annual" && (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Pro Annual: Free
                      </span>
                    )}
                    {membershipTier === "pro_monthly" && (
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Pro Monthly: R25 (50% off)
                      </span>
                    )}
                    {membershipTier === "standard" && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground border">
                        Standard fee: R50
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Standard booking with base amenities included. No additional package added.
                  </p>
                </div>

                <span className={`mt-0.5 shrink-0 font-heading text-sm font-semibold ${standardStayFeeFor(membershipTier) === 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                  {standardStayFeeFor(membershipTier) === 0 ? "Free (R 0)" : `R ${standardStayFeeFor(membershipTier)}`}
                </span>
              </button>

              {availablePackages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                const isAllowedByRule = !hasMandatoryRule || mandatoryPackageIds.includes(pkg.id);
                const isDisabled = !canManage || isUpdatingPackage || isPaid || !isAllowedByRule;
                const price = pkg.price || 0;

                return (
                  <button
                    key={pkg.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isDisabled}
                    onClick={() => !isDisabled && handlePackageChange(pkg.id)}
                    className={`flex w-full items-start justify-between gap-4 rounded-lg border p-4 text-left transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-70 ${isSelected
                      ? "border-primary bg-primary/5"
                      : "bg-muted/30 hover:bg-muted/60"
                      } ${!isAllowedByRule ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input"
                        }`}
                    >
                      {isSelected && <CheckIcon className="size-3" />}
                    </span>

                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-sm font-medium">{pkg.name}</span>
                        {(pkg.isPro || pkg.category === "pro") && (
                          <Badge className="border-secondary/40 bg-secondary/10 text-secondary-600 dark:text-secondary-400 text-[10px] font-bold uppercase">
                            Pro
                          </Badge>
                        )}
                        {hasMandatoryRule && mandatoryPackageIds.includes(pkg.id) && (
                          <Badge variant="secondary" className="font-medium text-muted-foreground">
                            {userAllowedMandatoryIds.length === 1
                              ? (isHourly ? "Required for booking" : "Required for stay length")
                              : "Mandatory option"}
                          </Badge>
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {pkg.description}
                        </p>
                      )}
                      {hasMandatoryRule && !isAllowedByRule && (
                        <p className="text-xs text-muted-foreground italic">
                          Not eligible for {nights} {isHourly ? (nights === 1 ? "slot" : "slots") : (nights === 1 ? "night" : "nights")}.
                        </p>
                      )}
                    </div>

                    <span className="mt-0.5 shrink-0 font-heading text-sm font-semibold">
                      +R {price.toLocaleString()}
                    </span>
                  </button>
                );
              })}

              {/* Locked Pro-exclusive Packages Teaser for Non-Pro Users */}
              {!isProUser && proPackages.length > 0 && (
                <div className="mt-2 flex flex-col gap-3 rounded-xl border border-secondary/30 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary/20 text-secondary">
                        <LockIcon className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                          {proPackages.length} Pro-Exclusive Package{proPackages.length > 1 ? "s" : ""}
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
                    {proPackages.map((pkg) => (
                      <div key={pkg.id} className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <LockIcon className="size-3 text-secondary/70" />
                          <span className="font-medium text-foreground">{pkg.name}</span>
                        </div>
                        <span className="font-semibold text-secondary">R {pkg.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invite Guests & Sharing Portal */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="size-4 text-muted-foreground" />
                {canManage ? <>Invite guests &amp; share estimate</> : "Guests on this stay"}
              </CardTitle>
              <CardDescription>
                {canManage
                  ? "Anyone with this link can ask to join. You'll get an email when someone joins, and you can remove guests or refresh the link at any time."
                  : `You joined this stay as a guest. ${estimate.customerName} manages the invite link and guest list.`}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {guestError && (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertDescription>{guestError}</AlertDescription>
                </Alert>
              )}

              {canManage && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label htmlFor="invite-url" className="sr-only">
                      Invite URL
                    </label>
                    <Input
                      id="invite-url"
                      type="text"
                      readOnly
                      value={inviteUrl}
                      className="flex-1 font-mono text-xs"
                    />
                    <Button onClick={handleCopy} className="shrink-0" disabled={!inviteUrl}>
                      {copied ? (
                        <CheckIcon data-icon="inline-start" />
                      ) : (
                        <LinkIcon data-icon="inline-start" />
                      )}
                      {copied ? "Copied" : "Copy link"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {linkRefreshed ? "New link created. The old link no longer works." : "Shared the link with the wrong person? Refresh it."}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleRefreshLink} disabled={isRefreshingLink}>
                      {isRefreshingLink ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
                      Refresh invite link
                    </Button>
                  </div>
                </div>
              )}

              {/* Guest List Roster */}
              {estimate.guests && estimate.guests.length > 0 && (
                <div className="flex flex-col gap-2 border-t pt-4">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Joined guest roster ({estimate.guests.length})
                  </span>
                  <ul className="flex flex-col gap-1.5">
                    {estimate.guests.map((gUid) => {
                      const details = estimate.guestsDetails?.[gUid];
                      const name = details?.name || (gUid === user.uid ? "You" : "Guest");
                      const label = details?.email ? `${name} (${details.email})` : name;
                      return (
                        <li
                          key={gUid}
                          className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2"
                        >
                          <span className="flex min-w-0 items-center gap-2 text-sm">
                            <UserIcon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate font-mono text-xs">{label}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            {details?.joinedAt && (
                              <span className="hidden text-xs text-muted-foreground sm:inline">
                                Joined {formatDisplayDate(details.joinedAt)}
                              </span>
                            )}
                            {canManage ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveGuest(gUid, name)}
                                disabled={removingGuestId === gUid}
                              >
                                {removingGuestId === gUid ? "Removing..." : "Remove"}
                              </Button>
                            ) : (
                              <Badge variant="secondary">Joined</Badge>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Total calculations & Secure Book action */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="lg:sticky lg:top-6">
            <CardHeader className="border-b">
              <CardTitle>Estimate summary</CardTitle>
              <div data-slot="card-action" className="col-start-2 row-start-1 justify-self-end">
                <Badge variant={isPaid ? "default" : "outline"}>
                  {isPaid ? "Paid" : "Pending payment"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {/* Active Estimate Sharing Widget */}
              {canManage && latestEstimate && latestEstimate.id === estimate.id && (
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 mb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Active estimate ready
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {latestEstimate.token ? `${latestEstimate.token.slice(0, 8)}…` : "Active"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-heading text-sm font-semibold">
                      R {latestEstimate.total ? latestEstimate.total.toLocaleString() : "0"}
                    </div>
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                      {copied ? (
                        <CheckIcon data-icon="inline-start" />
                      ) : (
                        <LinkIcon data-icon="inline-start" />
                      )}
                      {copied ? "Copied" : "Share link"}
                    </Button>
                  </div>
                </div>
              )}

              {latestEstimate && latestEstimate.id !== estimate.id && (
                <div className="flex flex-col gap-2 rounded-lg border bg-secondary/40 border-secondary/20 p-3 mb-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium tracking-wide text-secondary-600 dark:text-secondary-400 uppercase">
                      Newer active estimate ready
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-heading text-sm font-semibold">
                      R {latestEstimate.total ? latestEstimate.total.toLocaleString() : "0"}
                    </div>
                    <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/estimate/${latestEstimate.id}`} />}>
                      <ArrowRightIcon data-icon="inline-start" />
                      View active
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Created by</span>
                <span className="font-medium">{estimate.customerName}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{isHourly ? "Duration" : "Stay length"}</span>
                <span className="font-medium">
                  {isHourly ? "1 slot" : `${nights} night${nights === 1 ? "" : "s"}`}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  {isHourly ? "Booking cost" : "Accommodation cost"}
                </span>
                <span className="font-medium">R {(basePricePerNight * nights).toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between gap-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>
                    {nights >= 28 ? "Monthly discount" : "Weekly discount"} ({nights >= 28 ? monthlyDiscount : weeklyDiscount}% off)
                  </span>
                  <span>-R {Math.round(discountAmount).toLocaleString()}</span>
                </div>
              )}
              {currentSelectedPackage ? (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">
                    Package cost ({currentSelectedPackage.name})
                  </span>
                  <span className="font-medium">R {packagePrice.toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    Standard booking fee
                    {membershipTier === "pro_annual" && (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        Pro Annual (Free)
                      </span>
                    )}
                    {membershipTier === "pro_monthly" && (
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                        Pro Monthly (50% off)
                      </span>
                    )}
                  </span>
                  <span className={`font-medium ${standardFee === 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                    {standardFee === 0 ? "Free (R 0)" : `R ${standardFee.toLocaleString()}`}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Total payable</span>
                <span className="font-heading text-2xl font-semibold">
                  R {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              {payError && (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>Checkout failed</AlertTitle>
                  <AlertDescription>{payError}</AlertDescription>
                </Alert>
              )}

              {!isPaid ? (
                <Button
                  id="btn-confirm-pay-yoco"
                  className="w-full"
                  onClick={handlePay}
                  disabled={isPaying || isLoadingPaymentStatus}
                >
                  {(isPaying || isLoadingPaymentStatus) && <Spinner data-icon="inline-start" />}
                  {isLoadingPaymentStatus
                    ? "Checking payment status"
                    : isPaying
                      ? "Connecting to checkout"
                      : "Confirm & pay via Yoco"}
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Alert>
                    <CircleCheckIcon />
                    <AlertTitle>Stay fully paid</AlertTitle>
                    <AlertDescription>Your booking is confirmed.</AlertDescription>
                  </Alert>
                  <Button
                    className="w-full"
                    nativeButton={false}
                    render={<Link href="/bookings" />}
                  >
                    Go to my bookings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function EstimateClient(props: EstimateClientProps) {
  return (
    <AuthProvider>
      <EstimateClientContent {...props} />
    </AuthProvider>
  );
}
