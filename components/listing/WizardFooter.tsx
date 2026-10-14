"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

type WizardFooterProps = {
  stepIndex: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  canContinue: boolean;
  isPublishing: boolean;
  onBack: () => void;
  onNext: () => void;
};

export function WizardFooter({
  stepIndex,
  totalSteps,
  isFirst,
  isLast,
  canContinue,
  isPublishing,
  onBack,
  onNext,
}: WizardFooterProps) {
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 bg-canvas border-t border-line">
      <div
        className="h-1.5 w-full bg-line"
        role="progressbar"
        aria-label="Listing progress"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={stepIndex + 1}
      >
        <motion.div
          className="h-full bg-ink"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
        />
      </div>
      <div className="flex h-20 items-center justify-between px-6 md:px-12 max-w-5xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className={`rounded-lg px-3 py-2 text-base font-semibold text-ink underline underline-offset-2 transition-colors duration-150 hover:bg-surface cursor-pointer ${
            isFirst ? "invisible" : ""
          }`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue || isPublishing}
          className={`inline-flex min-w-[120px] items-center justify-center gap-2 whitespace-nowrap rounded-lg px-6 py-3.5 text-base font-semibold text-white transition-[background-color,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 cursor-pointer ${
            isLast ? "bg-brand hover:bg-brand-hover" : "bg-ink hover:bg-black"
          }`}
        >
          {isPublishing && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isLast ? (isPublishing ? "Publishing…" : "Publish listing") : "Next"}
        </button>
      </div>
    </footer>
  );
}
