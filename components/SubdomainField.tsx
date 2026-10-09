"use client";

import React from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { AvailabilityStatus } from "../hooks/useSubdomainAvailability";
import { ROOT_DOMAIN, sanitizeSubdomain } from "../utils/subdomain";

type SubdomainFieldProps = {
  value: string;
  onChange: (value: string) => void;
  status: AvailabilityStatus;
  error: string | null;
  suggestions: string[];
};

export function SubdomainField({ value, onChange, status, error, suggestions }: SubdomainFieldProps) {
  const hasProblem = status === "invalid" || status === "taken";

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="subdomain" className="text-sm font-semibold text-foreground">
        Page address
      </label>
      <div
        className={`flex h-11 items-center overflow-hidden rounded-xl border bg-background transition-colors focus-within:ring-2 ${
          hasProblem
            ? "border-destructive focus-within:ring-destructive/15"
            : "border-border focus-within:border-primary focus-within:ring-primary/15"
        }`}
      >
        <span className="pl-3.5 text-sm text-muted-foreground select-none">https://</span>
        <input
          id="subdomain"
          type="text"
          value={value}
          onChange={(e) => onChange(sanitizeSubdomain(e.target.value))}
          placeholder="your-name"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={hasProblem}
          aria-describedby="subdomain-status"
          className="h-full min-w-0 flex-1 bg-transparent px-1 font-mono text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        <span className="h-full border-l border-border bg-muted/40 px-3.5 text-xs sm:text-sm font-medium leading-10 text-muted-foreground select-none">
          .{ROOT_DOMAIN}
        </span>
      </div>

      <div id="subdomain-status" aria-live="polite" className="min-h-5 text-xs sm:text-sm">
        {status === "unchanged" && (
          <p className="text-muted-foreground">This is your current address.</p>
        )}
        {status === "checking" && (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking availability…
          </p>
        )}
        {status === "available" && (
          <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <Check className="h-3.5 w-3.5" />
            {value}.{ROOT_DOMAIN} is available
          </p>
        )}
        {status === "invalid" && (
          <p className="flex items-center gap-1.5 text-destructive font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}
        {status === "taken" && (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-destructive font-medium">
              <X className="h-3.5 w-3.5" />
              That address is already taken.
            </p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground text-xs">Try:</span>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onChange(s)}
                    className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:border-foreground/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Lowercase letters, numbers and hyphens. 3–30 characters.</p>
    </div>
  );
}
