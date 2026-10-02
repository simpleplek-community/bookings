import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxMarkProps = {
  checked: boolean;
  className?: string;
};

export function CheckboxMark({ checked, className }: CheckboxMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-150",
        checked
          ? "border-primary bg-primary text-primary-foreground shadow-xs"
          : "border-border bg-background hover:border-foreground/40",
        className
      )}
    >
      {checked && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
    </span>
  );
}
