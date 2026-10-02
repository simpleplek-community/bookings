import React from "react";
import { Clock, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingType = "nightly" | "hourly";

type BookingTypeToggleProps = {
  value: BookingType;
  onChange: (value: BookingType) => void;
};

const options = [
  { value: "nightly" as const, label: "Nightly stay", Icon: Moon },
  { value: "hourly" as const, label: "Hourly slots", Icon: Clock },
];

export function BookingTypeToggle({ value, onChange }: BookingTypeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Booking type"
      className="inline-flex items-center rounded-full border border-border bg-muted/40 p-1 shadow-xs"
    >
      {options.map(({ value: optionValue, label, Icon }) => {
        const selected = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(optionValue)}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer",
              selected
                ? "bg-foreground text-background shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
