"use client";

import React, { useState, useEffect } from "react";
import { type Property, type PropertyPackage } from "@/lib/types";
import { formatZar } from "@/lib/types";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Mail,
  Package,
  Receipt,
  Send,
  Sparkles,
  TriangleAlert,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BookingItem {
  id: string;
  propertyId: string;
  packageId?: string | null;
  customerName: string;
  customerEmail: string;
  fromDate: string;
  toDate: string;
  total: number;
  paymentStatus: string;
  paidAddons?: string[];
}

interface SendPackagePaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  packages: PropertyPackage[];
  initialPropertyId?: string | null;
  initialPackageId?: string | null;
}

export function SendPackagePaymentRequestModal({
  isOpen,
  onClose,
  properties,
  packages,
  initialPropertyId,
  initialPackageId,
}: SendPackagePaymentRequestModalProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [isManualRecipient, setIsManualRecipient] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync initial property and package when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      const propId =
        initialPropertyId ||
        (properties.length > 0 ? properties[0].id : "");
      setSelectedPropertyId(propId);

      if (initialPackageId) {
        setSelectedPackageId(initialPackageId);
      } else {
        const propPackages = packages.filter((p) => p.propertyId === propId);
        setSelectedPackageId(propPackages.length > 0 ? propPackages[0].id : "");
      }
    }
  }, [isOpen, initialPropertyId, initialPackageId, properties, packages]);

  // Fetch bookings whenever selected property changes
  useEffect(() => {
    if (!selectedPropertyId) {
      setBookings([]);
      return;
    }

    let active = true;
    setIsLoadingBookings(true);

    fetch(`/api/bookings?propertyId=${encodeURIComponent(selectedPropertyId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json.success && Array.isArray(json.data)) {
          // Filter out synthetic calendar feeds that have no customerEmail
          const realBookings = json.data.filter(
            (b: any) => b.customerEmail && b.customerEmail.includes("@")
          );
          setBookings(realBookings);

          // If there is an outstanding / completed booking, pre-select or pick first
          if (realBookings.length > 0 && !selectedBookingId && !isManualRecipient) {
            const first = realBookings[0];
            setSelectedBookingId(first.id);
            setCustomerEmail(first.customerEmail);
            setCustomerName(first.customerName || "");
            if (first.packageId && !initialPackageId) {
              setSelectedPackageId(first.packageId);
            }
          }
        }
        setIsLoadingBookings(false);
      })
      .catch((err) => {
        if (active) {
          console.error("Failed to load bookings for property:", err);
          setIsLoadingBookings(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedPropertyId, isManualRecipient]);

  if (!isOpen) return null;

  const currentProperty = properties.find((p) => p.id === selectedPropertyId);
  const propertyPackages = packages.filter((p) => p.propertyId === selectedPropertyId);
  const currentPackage = propertyPackages.find((p) => p.id === selectedPackageId) || propertyPackages[0];
  const currentBooking = bookings.find((b) => b.id === selectedBookingId);

  const handleBookingChange = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    if (bookingId === "manual") {
      setIsManualRecipient(true);
      setCustomerEmail("");
      setCustomerName("");
    } else {
      setIsManualRecipient(false);
      const b = bookings.find((item) => item.id === bookingId);
      if (b) {
        setCustomerEmail(b.customerEmail);
        setCustomerName(b.customerName || "");
        if (b.packageId && propertyPackages.some((p) => p.id === b.packageId)) {
          setSelectedPackageId(b.packageId);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!selectedPropertyId) {
      setStatusMessage({ type: "error", text: "Please select a property." });
      return;
    }

    if (!selectedPackageId) {
      setStatusMessage({ type: "error", text: "Please select an outstanding package." });
      return;
    }

    if (!customerEmail || !customerEmail.includes("@")) {
      setStatusMessage({ type: "error", text: "Please enter a valid guest email address." });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/host/payment-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          packageId: selectedPackageId,
          bookingId: !isManualRecipient && selectedBookingId ? selectedBookingId : undefined,
          customerEmail: customerEmail.trim(),
          customerName: customerName.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to send payment request email.");
      }

      setStatusMessage({
        type: "success",
        text: `Payment request email sent successfully to ${customerEmail}!`,
      });

      // Clear note
      setNote("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send payment request.";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCompletedBooking = currentBooking?.toDate
    ? new Date(currentBooking.toDate).getTime() < Date.now()
    : false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-request-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card text-foreground shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5 sm:p-6 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="size-5" />
            </div>
            <div>
              <h2 id="payment-request-modal-title" className="text-lg font-bold tracking-tight">
                Send Package Payment Request
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Request payment for an outstanding package from a guest (completed stay or unpaid package).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {statusMessage && (
            <Alert
              variant={statusMessage.type === "success" ? "default" : "destructive"}
              className={statusMessage.type === "success" ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200" : ""}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TriangleAlert className="h-4 w-4" />
              )}
              <AlertDescription className="text-xs sm:text-sm font-medium">
                {statusMessage.text}
              </AlertDescription>
            </Alert>
          )}

          {/* 1. Select Property */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              1. Select Property
            </label>
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setSelectedBookingId("");
              }}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.name} {p.location ? `· ${p.location}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select Booking or Recipient */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Guest / Booking
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextState = !isManualRecipient;
                  setIsManualRecipient(nextState);
                  if (nextState) {
                    setSelectedBookingId("");
                    setCustomerEmail("");
                    setCustomerName("");
                  } else if (bookings.length > 0) {
                    handleBookingChange(bookings[0].id);
                  }
                }}
                className="text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                {isManualRecipient ? "← Choose from bookings" : "Enter guest email manually →"}
              </button>
            </div>

            {!isManualRecipient ? (
              <div className="space-y-2">
                {isLoadingBookings ? (
                  <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground bg-muted/40 rounded-lg">
                    <Loader2 className="size-4 animate-spin" />
                    <span>Loading bookings for this property...</span>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground bg-muted/40 rounded-lg space-y-1">
                    <p className="font-medium text-foreground">No bookings found for this property.</p>
                    <p>You can enter the guest email manually using the toggle above.</p>
                  </div>
                ) : (
                  <select
                    value={selectedBookingId}
                    onChange={(e) => handleBookingChange(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {bookings.map((b) => {
                      const completed = new Date(b.toDate).getTime() < Date.now();
                      const from = new Date(b.fromDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
                      const to = new Date(b.toDate).toLocaleDateString("en-ZA", { month: "short", day: "numeric" });
                      return (
                        <option key={b.id} value={b.id}>
                          {b.customerName || b.customerEmail} ({from} – {to}) {completed ? "· Completed" : ""} · {b.paymentStatus.toUpperCase()}
                        </option>
                      );
                    })}
                  </select>
                )}

                {currentBooking && (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center justify-between text-foreground font-medium">
                      <span>{currentBooking.customerName || "Guest"}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{currentBooking.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{currentBooking.customerEmail}</span>
                      <span>·</span>
                      <span className={isCompletedBooking ? "text-amber-600 dark:text-amber-400 font-medium" : "text-emerald-600 dark:text-emerald-400 font-medium"}>
                        {isCompletedBooking ? "Stay Completed" : "Upcoming Stay"}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{currentBooking.paymentStatus}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="customerName" className="text-xs text-muted-foreground block mb-1">
                    Guest Name
                  </label>
                  <input
                    id="customerName"
                    type="text"
                    placeholder="e.g. Alice Smith"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label htmlFor="customerEmail" className="text-xs text-muted-foreground block mb-1">
                    Guest Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="customerEmail"
                    type="email"
                    required
                    placeholder="guest@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Select Package Outstanding */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                3. Select Outstanding Package
              </label>
              <span className="text-xs text-muted-foreground">
                {propertyPackages.length} package{propertyPackages.length === 1 ? "" : "s"} available
              </span>
            </div>

            {propertyPackages.length === 0 ? (
              <div className="p-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-lg">
                No packages are currently configured for this property. Add a package to this property first.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {propertyPackages.map((pkg) => {
                  const isSelected = pkg.id === selectedPackageId;
                  const isPro = Boolean(pkg.isPro || pkg.category === "pro");
                  return (
                    <button
                      type="button"
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                          : "border-border bg-background hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                          {pkg.name}
                        </span>
                        {isPro && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                            <Sparkles className="size-3" /> Pro
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {pkg.description || "No description"}
                      </p>
                      <div className="mt-2 text-sm font-bold text-primary">
                        {formatZar(pkg.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Optional Custom Note */}
          <div className="space-y-1.5">
            <label htmlFor="hostNote" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              4. Note for Guest (Optional)
            </label>
            <textarea
              id="hostNote"
              rows={2}
              placeholder={
                isCompletedBooking
                  ? "e.g. Your stay has completed, but payment for the selected package remains outstanding. Please use the link below to pay online."
                  : "e.g. Please find the payment link for your requested package add-on."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-none rounded-lg border border-border bg-background p-2.5 text-xs sm:text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* 5. Summary Preview */}
          {currentPackage && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                <span>Payment Request Summary</span>
                <span>{formatZar(currentPackage.price)}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An email will be sent to <strong className="text-foreground">{customerEmail || "the recipient"}</strong> with a direct, secure Yoco payment link for <strong className="text-foreground">{currentPackage.name}</strong>.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || propertyPackages.length === 0 || !customerEmail}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Sending email...</span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>Send Payment Request</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
