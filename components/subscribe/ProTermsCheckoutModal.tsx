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
import { ExternalLink, ShieldCheck, Loader2 } from "lucide-react";

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
      <DialogContent className="sm:max-w-xl flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b bg-muted/20">
          <DialogHeader className="gap-2">
            <div className="flex items-center justify-between">
              <Badge variant={isAnnual ? "default" : "secondary"} className="text-xs font-semibold">
                Pro Membership Terms ({priceDisplay})
              </Badge>
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Capital Acquisition &amp; Share Block Terms
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              By subscribing to the Pro Plan, you agree to the long-term capital acquisition terms governed by the Share Blocks Control Act and Companies Act.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Reduced Terms Content */}
        <div className="p-6 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Key Financial &amp; Exit Notice:
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-foreground/90">
              <li className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card p-3">
                <span className="font-semibold text-foreground shrink-0">•</span>
                <span>
                  <strong>25-Year Capital Allocation:</strong> Monthly payments are split between operational levies and capital contributions toward property equity.
                </span>
              </li>
              <li className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card p-3">
                <span className="font-semibold text-foreground shrink-0">•</span>
                <span>
                  <strong>No Cash Refunds:</strong> If you cancel or default, your net balance converts to internal Member Credits (1 Credit = ZAR 1.00) redeemable for stays. Cash buy-backs are not available.
                </span>
              </li>
              <li className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card p-3">
                <span className="font-semibold text-foreground shrink-0">•</span>
                <span>
                  <strong>Secondary Liquidity:</strong> Transferring equity or credits requires selling/transferring your interest to another member via a formal Cession Agreement on the platform.
                </span>
              </li>
              <li className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card p-3">
                <span className="font-semibold text-foreground shrink-0">•</span>
                <span>
                  <strong>Cancellation Penalty:</strong> Early cancellation incurs an administrative penalty of up to 10% of the remaining contract value under the CPA.
                </span>
              </li>
              <li className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card p-3">
                <span className="font-semibold text-foreground shrink-0">•</span>
                <span>
                  <strong>Default:</strong> Missing 3 consecutive monthly payments results in default and property interest reversion to the entity.
                </span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-end text-xs text-muted-foreground">
            <Link
              href="/terms#section-11"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Read full Terms of Use (Sections 11 &amp; 12)
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Audit Notice & Checkbox */}
          <div className="rounded-lg bg-muted/40 p-4 border border-border space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By checking the box below, you confirm your explicit agreement. A timestamped audit log (User ID &amp; IP) will be saved for compliance.
            </p>

            <div className="flex items-start gap-2.5 pt-1">
              <Checkbox
                id="shareblock-terms-acknowledgement"
                checked={hasAcknowledged}
                onCheckedChange={(checked) => setHasAcknowledged(Boolean(checked))}
                className="mt-0.5"
              />
              <label
                htmlFor="shareblock-terms-acknowledgement"
                className="text-xs sm:text-sm text-foreground font-medium leading-snug cursor-pointer select-none"
              >
                I confirm my explicit agreement to the Share Block / Leasehold terms and capital allocation conditions.
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="m-0 p-4 sm:px-6 sm:py-4 border-t bg-muted/20 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="text-xs text-muted-foreground">
            {hasAcknowledged && (
              <span className="text-primary font-medium flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Ready for payment
              </span>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 shrink-0 my-1 mr-1">
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
              className="gap-2 font-medium px-4"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isProcessing
                ? "Connecting..."
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
