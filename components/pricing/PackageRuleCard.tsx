"use client";

import React, { useState } from "react";
import { ChevronDown, Trash2, X } from "lucide-react";
import { PackagePickerDialog } from "./PackagePickerDialog";
import { RULE_OPERATORS, RuleOperator } from "@/lib/pricing";
import { MandatoryRule, PropertyPackage, formatZar, getRulePackageIds } from "@/lib/types";

type PackageRuleCardProps = {
  rule: MandatoryRule;
  index: number;
  unitPlural: string;
  packages: PropertyPackage[];
  onChange: (patch: Partial<MandatoryRule>) => void;
  onRemove: () => void;
};

export function PackageRuleCard({
  rule,
  index,
  unitPlural,
  packages,
  onChange,
  onRemove,
}: PackageRuleCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedIds = getRulePackageIds(rule);
  const selected = packages.filter((pkg) => selectedIds.includes(pkg.id));
  const operatorId = `rule-${index}-operator`;
  const valueId = `rule-${index}-value`;

  const handleRemovePackage = (pkgId: string) => {
    const nextIds = selectedIds.filter((id) => id !== pkgId);
    onChange({
      packageIds: nextIds,
      packageId: nextIds[0] || "",
    });
  };

  const handleConfirmPackages = (ids: string[]) => {
    onChange({
      packageIds: ids,
      packageId: ids[0] || "",
    });
  };

  return (
    <article
      aria-label={`Rule ${index + 1}`}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-foreground font-normal">
          <span>When a stay is</span>
          <label htmlFor={operatorId} className="sr-only">
            Condition
          </label>
          <div className="relative inline-block">
            <select
              id={operatorId}
              value={rule.operator}
              onChange={(event) =>
                onChange({ operator: event.target.value as RuleOperator })
              }
              className="appearance-none rounded-xl border border-border bg-background py-1.5 pl-3 pr-8 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {RULE_OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <label htmlFor={valueId} className="sr-only">
            Number of {unitPlural}
          </label>
          <input
            id={valueId}
            type="number"
            min={1}
            value={rule.nights}
            onChange={(event) =>
              onChange({ nights: Math.max(1, Number.parseInt(event.target.value, 10) || 1) })
            }
            className="w-16 rounded-xl border border-border bg-background px-2 py-1.5 text-center text-sm font-semibold tabular-nums text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <span>{unitPlural}</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove rule ${index + 1}`}
          className="-mr-1 -mt-1 rounded-full p-2 text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-xs sm:text-sm font-medium text-foreground">
            Guests must pick from
          </p>
          <span className="whitespace-nowrap text-xs text-muted-foreground font-mono">
            {selected.length} of {packages.length} selected
          </span>
        </div>

        {selected.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {selected.map((pkg) => {
              const isPkgPro = Boolean(pkg.isPro || pkg.category === "pro");
              return (
                <li
                  key={pkg.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1.5 text-xs sm:text-sm"
                >
                  <span className="font-semibold text-foreground">{pkg.name}</span>
                  {isPkgPro && (
                    <span className="rounded bg-amber-500/20 px-1 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      PRO
                    </span>
                  )}
                  <span className="text-muted-foreground">{formatZar(pkg.price)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePackage(pkg.id)}
                    aria-label={`Remove ${pkg.name}`}
                    className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-xs sm:text-sm text-destructive font-medium">
            No packages yet — this rule won’t apply until you add at least one package.
          </p>
        )}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-haspopup="dialog"
          className="mt-3.5 inline-block text-xs sm:text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80 cursor-pointer"
        >
          {selected.length > 0 ? "Edit packages" : "Choose packages"}
        </button>
      </div>

      <PackagePickerDialog
        open={pickerOpen}
        selectedIds={selectedIds}
        packages={packages}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleConfirmPackages}
      />
    </article>
  );
}
