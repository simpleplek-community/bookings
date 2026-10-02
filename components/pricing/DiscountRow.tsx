"use client";

import React from "react";
import { CheckboxMark } from "./CheckboxMark";
import { clampPercent } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type DiscountRowProps = {
  id: string;
  title: string;
  description: string;
  example: string;
  enabled: boolean;
  percent: number;
  onToggle: () => void;
  onPercentChange: (percent: number) => void;
};

export function DiscountRow({
  id,
  title,
  description,
  example,
  enabled,
  percent,
  onToggle,
  onPercentChange,
}: DiscountRowProps) {
  return (
    <div className="flex items-start gap-4 sm:gap-6 py-5">
      <div className="min-w-0 flex-1">
        <h3 id={`${id}-title`} className="text-sm sm:text-base font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
        {enabled && percent > 0 && (
          <p className="mt-2 text-xs sm:text-sm font-medium text-primary">
            {example}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div
          className={cn(
            "flex items-center rounded-lg border px-3 py-1.5 transition-colors duration-150 focus-within:ring-2 focus-within:ring-primary/20",
            enabled
              ? "border-border bg-card focus-within:border-primary"
              : "border-border/60 bg-muted/30 opacity-60"
          )}
        >
          <label htmlFor={`${id}-percent`} className="sr-only">
            {title} percentage
          </label>
          <input
            id={`${id}-percent`}
            type="text"
            inputMode="numeric"
            value={percent}
            disabled={!enabled}
            onChange={(event) => onPercentChange(clampPercent(event.target.value))}
            className="w-8 bg-transparent text-right font-semibold text-sm tabular-nums text-foreground outline-none disabled:text-muted-foreground"
          />
          <span className={cn("ml-1 text-sm font-semibold", enabled ? "text-foreground" : "text-muted-foreground")}>
            %
          </span>
        </div>
        <button
          type="button"
          role="checkbox"
          aria-checked={enabled}
          aria-labelledby={`${id}-title`}
          onClick={onToggle}
          className="rounded-md p-1 -m-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
        >
          <CheckboxMark checked={enabled} />
        </button>
      </div>
    </div>
  );
}
