"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Scale,
  ShieldCheck,
  Building2,
  Coins,
  AlertCircle,
  ExternalLink,
  Lock,
  Loader2,
} from "lucide-react";

interface ProTermsCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: "monthly" | "annual" | null;
  isProcessing: boolean;
  isMockBypass?: boolean;
  onConfirm: (plan: "monthly" | "annual") => Promise<void>;
}

export function ProTermsCheckoutModal({
  isOpen,
  onClose,
  plan,
  isProcessing,
  isMockBypass = false,
  onConfirm,
}: ProTermsCheckoutModalProps) {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const handleClose = () => {
    setHasAcknowledged(false);
    onClose();
  };

  if (!plan) return null;

  const isAnnual = plan === "annual";
  const planName = isAnnual ? "Pro Annual" : "Pro Monthly";
  const priceDisplay = isAnnual ? "R 150 / year" : "R 15 / month";

  const handleConfirm = async () => {
    if (!hasAcknowledged || isProcessing) return;
    await onConfirm(plan);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b bg-muted/20">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
                <Scale className="h-4 w-4" />
                <span>Statutory Compliance & Capital Review</span>
              </div>
              <Badge variant={isAnnual ? "default" : "secondary"}>
                {planName} ({priceDisplay})
              </Badge>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Pro Plan Share Block / Leasehold Terms
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
              Before completing payment, South African property regulations require explicit review and consent of the capital allocation, operational levy, and cancellation structure (Sections 11 &amp; 12).
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Terms Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Section 11.2 Breakdown */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-foreground text-sm">
                  11.2 Pro Membership: Share Block / Leasehold Acquisition
                </h4>
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-primary">
                Capital Allocation
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Unlike short-term standard subscriptions, Pro Membership constitutes a long-term capital acquisition program over a 25-year horizon, structured under South African company and property statutes:
            </p>
            <ul className="grid grid-cols-1 gap-2 text-xs text-foreground/90">
              <li className="flex items-start gap-2 rounded-md bg-background/80 p-2.5 border border-border/50">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Legal Status:</strong> Governed by the <em>Share Block Control Act (Act 59 of 1980)</em> and the <em>Companies Act (Act 71 of 2008)</em>. Your contributions actively accrue toward Member Interest or Shareholder Equity in the underlying property entity.
                </span>
              </li>
              <li className="flex items-start gap-2 rounded-md bg-background/80 p-2.5 border border-border/50">
                <Coins className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Premiums &amp; Operational Levy:</strong> Contributions are bifurcated: an operational levy covers platform infrastructure, calendar sync, and marketing, while capital allocations fund long-term property equity.
                </span>
              </li>
            </ul>
          </div>

          {/* Section 12 Breakdown */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <h4 className="font-semibold text-foreground text-sm">
                  12. Cancellation &amp; &quot;Member Credit&quot; System
                </h4>
              </div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Closed-Loop Policy
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Because Pro membership involves dedicated capital deployment in property assets, the following strict closed-loop rules apply:
            </p>
            <div className="space-y-2 text-xs text-foreground/90">
              <div className="rounded-md bg-muted/40 p-2.5 border border-border/40">
                <span className="font-semibold text-foreground">12.1 Cancellation &amp; CPA Penalty:</span>
                <span className="text-muted-foreground block mt-0.5">
                  Early termination or cancellation forfeits specific claims to the underlying Sectional Title or 99-Year Leasehold. A reasonable administrative and resale penalty (capped at 10% of remaining contract value under the Consumer Protection Act) applies.
                </span>
              </div>
              <div className="rounded-md bg-muted/40 p-2.5 border border-border/40">
                <span className="font-semibold text-foreground">12.2 Member Credits (Internal Platform Accounting):</span>
                <span className="text-muted-foreground block mt-0.5">
                  Accumulated net capital (premiums less operational costs, interest, and VAT) converts into Member Credits on the internal platform registry. <strong>1 Credit = ZAR 1.00</strong>, redeemable solely for booking accommodation. Credits are not cryptocurrencies and carry <strong>no cash redemption or buy-back</strong>.
                </span>
              </div>
              <div className="rounded-md bg-muted/40 p-2.5 border border-border/40">
                <span className="font-semibold text-foreground">12.3 Transferability &amp; Default Reversion:</span>
                <span className="text-muted-foreground block mt-0.5">
                  Liquidity is provided solely via transfer to other members via a formal Cession Agreement on the Platform. Failure to pay premiums for 3 consecutive months constitutes default, reverting property interest to the entity while converting net equity into Member Credits.
                </span>
              </div>
            </div>
          </div>

          {/* Full terms link */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Review the complete legal agreement:</span>
            <Link
              href="/terms#section-11"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Terms of Use (Sections 11 &amp; 12)
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <Separator />

          {/* Audit Trail Notice & Active Checkbox */}
          <div className="space-y-4 rounded-xl bg-muted/30 p-4 border border-border">
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Statutory Audit Trail:</strong> Confirming this step permanently logs a timestamped record of your explicit consent, IP address, and User ID to our compliance database.
              </span>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="shareblock-terms-acknowledgement"
                checked={hasAcknowledged}
                onCheckedChange={(checked) => setHasAcknowledged(Boolean(checked))}
                className="mt-0.5"
              />
              <label
                htmlFor="shareblock-terms-acknowledgement"
                className="text-xs text-foreground font-medium leading-relaxed cursor-pointer select-none"
              >
                I have read, understood, and explicitly agree to the{" "}
                <span className="text-primary font-semibold">Share Block / Leasehold Acquisition Terms</span>{" "}
                (Section 11) and the{" "}
                <span className="text-primary font-semibold">Capital Allocation &amp; Cancellation Policy</span>{" "}
                (Section 12). I acknowledge that my subscription includes both an operational levy and capital contribution subject to closed-loop Member Credit conversion.
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {!hasAcknowledged ? (
              <span className="text-amber-600 dark:text-amber-500 font-medium">
                * Please check the box above to proceed.
              </span>
            ) : (
              <span className="text-primary font-medium flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Terms acknowledged. Ready for payment.
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={!hasAcknowledged || isProcessing}
              className="gap-2 font-medium"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isProcessing
                ? "Connecting to Payment..."
                : isMockBypass
                ? `Confirm & Activate ${planName}`
                : `Confirm & Pay ${priceDisplay}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
