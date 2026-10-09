"use client";

import React from "react";
import { Globe, Lock, Sparkles, AlertTriangle } from "lucide-react";
import { ProSwitch } from "../ProSwitch";

type VisibilityStepProps = {
  isPro: boolean;
  userPlan?: string;
  isAdmin?: boolean;
  onChange: (value: boolean) => void;
};

export function VisibilityStep({ isPro, userPlan = "standard", isAdmin = false, onChange }: VisibilityStepProps) {
  const Icon = isPro ? Lock : Globe;
  const isRestricted = userPlan === "standard" && !isAdmin;

  return (
    <div className="space-y-6">
      <ProSwitch
        checked={isPro}
        disabled={isRestricted}
        onChange={onChange}
      />

      {isRestricted && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Pro Host Subscription Required</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Your host account is currently on the Standard plan. Upgrading to a Pro plan enables exclusive Pro-only listings for verified Pro members.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 px-1" aria-live="polite">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
        <p className="text-muted text-base leading-relaxed">
          {isPro ? (
            <>
              Hidden from regular guests. Pro members see it in search with a{" "}
              <span className="font-semibold text-ink inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Pro only
              </span>{" "}
              badge.
            </>
          ) : (
            <>Visible to every guest browsing Simple Plek.</>
          )}
        </p>
      </div>
    </div>
  );
}
