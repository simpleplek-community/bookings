"use client";

import React, { ChangeEvent, useRef } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type PriceEditorProps = {
  price: number;
  unit: "night" | "hour";
  onChange: (price: number) => void;
  error?: string;
};

export function PriceEditor({ price, unit, onChange, error }: PriceEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const display = price > 0 ? price.toLocaleString("en-US") : "";
  const digitCount = Math.max(display.replace(/\D/g, "").length, 1);
  const commaCount = (display.match(/,/g) || []).length;
  const invalid = price < 1 || Boolean(error);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 7);
    onChange(digits ? Number(digits) : 0);
  };

  return (
    <div className="mt-8 flex w-full flex-col items-center">
      <label htmlFor="property-price" className="sr-only">
        Base price per {unit}
      </label>
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-baseline text-6xl font-bold leading-none tracking-tight sm:text-7xl lg:text-8xl text-foreground">
          <span aria-hidden="true" className="select-none font-semibold text-foreground/80 mr-1">
            R
          </span>
          <input
            ref={inputRef}
            id="property-price"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={display}
            placeholder="0"
            onChange={handleChange}
            aria-invalid={invalid}
            aria-describedby="price-hint"
            style={{ width: `${Math.max(digitCount + commaCount * 0.4, 1.2)}ch` }}
            className="bg-transparent p-0 text-center font-bold tabular-nums text-foreground outline-none placeholder:text-muted-foreground/30 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          aria-label="Edit price"
          className="rounded-full border border-border bg-card p-2.5 text-foreground/80 shadow-xs transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <p
        id="price-hint"
        className={cn(
          "mt-3 text-sm font-medium transition-colors",
          invalid ? "text-destructive font-semibold" : "text-muted-foreground"
        )}
      >
        {error ? error : invalid ? "Enter a price of at least R1" : `per ${unit}`}
      </p>
    </div>
  );
}
