"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles, Lock } from "lucide-react";

type ProSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
};

export function ProSwitch({ checked, disabled = false, onChange }: ProSwitchProps) {
  const reduceMotion = useReducedMotion();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      aria-labelledby="pro-switch-label"
      aria-describedby="pro-switch-desc"
      onClick={() => !disabled && onChange(!checked)}
      className={`flex w-full items-center gap-5 rounded-2xl border-2 p-6 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${
        disabled
          ? "opacity-60 cursor-not-allowed border-line bg-surface/50"
          : checked
          ? "border-pro bg-pro-soft cursor-pointer shadow-xs"
          : "border-line bg-canvas hover:border-line-strong cursor-pointer"
      }`}
    >
      <span
        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors duration-200 ${
          checked ? "bg-ink text-pro-line" : "bg-surface text-muted"
        }`}
      >
        {disabled ? (
          <Lock className="h-6 w-6 text-muted" aria-hidden="true" />
        ) : (
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span id="pro-switch-label" className="block text-lg font-semibold text-ink">
            Pro only property
          </span>
          {checked && (
            <span className="rounded-full bg-pro px-2.5 py-0.5 text-xs font-semibold text-white">
              Pro Exclusive
            </span>
          )}
        </span>
        <span id="pro-switch-desc" className="mt-1 block text-sm text-muted">
          Only guests with an active Pro membership can see and book this listing.
        </span>
      </span>

      <span
        aria-hidden="true"
        className={`flex h-8 w-[52px] shrink-0 items-center rounded-full p-1 transition-colors duration-200 ${
          checked ? "justify-end bg-pro-strong" : "justify-start bg-line-strong"
        }`}
      >
        <motion.span
          layout
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 700, damping: 40 }
          }
          className="grid h-6 w-6 place-items-center rounded-full bg-canvas shadow"
        >
          {checked && (
            <Check className="h-3.5 w-3.5 text-pro-strong" strokeWidth={3} />
          )}
        </motion.span>
      </span>
    </button>
  );
}
