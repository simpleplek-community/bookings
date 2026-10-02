"use client";

import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { CheckboxMark } from "./CheckboxMark";
import { PropertyPackage, formatZar } from "@/lib/types";
import { cn } from "@/lib/utils";

type PackagePickerDialogProps = {
  open: boolean;
  selectedIds: string[];
  packages: PropertyPackage[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
};

export function PackagePickerDialog({
  open,
  selectedIds,
  packages,
  onClose,
  onConfirm,
}: PackagePickerDialogProps) {
  const [draft, setDraft] = useState<string[]>(selectedIds);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(selectedIds);
      setQuery("");
    }
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = packages.filter((pkg) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      pkg.name.toLowerCase().includes(q) ||
      (pkg.category && pkg.category.toLowerCase().includes(q)) ||
      (pkg.description && pkg.description.toLowerCase().includes(q))
    );
  });

  const toggle = (id: string) => {
    setDraft((prev) =>
      prev.includes(id) ? prev.filter((val) => val !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        aria-describedby="picker-description"
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 id="picker-title" className="text-lg font-semibold text-foreground">
              Choose required packages
            </h2>
            <p id="picker-description" className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Guests booking under this rule must add one of these.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <label htmlFor="package-search" className="sr-only">
              Search packages
            </label>
            <input
              id="package-search"
              type="search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search packages..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {packages.length === 0
                ? "No packages found for this property."
                : `No packages match “${query}”.`}
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((pkg) => {
                const checked = draft.includes(pkg.id);
                const isPkgPro = Boolean(pkg.isPro || pkg.category === "pro");
                return (
                  <li key={pkg.id}>
                    <label className="-mx-2 flex cursor-pointer items-center gap-3.5 rounded-xl px-3 py-3.5 transition-colors duration-150 hover:bg-muted/60">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {pkg.name}
                          </span>
                          {isPkgPro && (
                            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                              PRO
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatZar(pkg.price)} · {pkg.category || "standard"}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggle(pkg.id)}
                      />
                      <CheckboxMark checked={checked} />
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={() => setDraft([])}
            disabled={draft.length === 0}
            className="text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-40 disabled:no-underline cursor-pointer"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(draft);
              onClose();
            }}
            className="whitespace-nowrap rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-xs transition-transform duration-150 hover:bg-foreground/90 active:scale-[0.98] cursor-pointer"
          >
            Save · {draft.length} selected
          </button>
        </div>
      </div>
    </div>
  );
}
