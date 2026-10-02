"use client";

import React from "react";
import { Info, Plus, AlertTriangle, Clock, Zap, Sun, Sunset } from "lucide-react";
import { BookingTypeToggle } from "./BookingTypeToggle";
import { PriceEditor } from "./PriceEditor";
import { DiscountRow } from "./DiscountRow";
import { PackageRuleCard } from "./PackageRuleCard";
import { discountedTotal, formatRand } from "@/lib/pricing";
import { MandatoryRule, PropertyPackage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

function formatSlotLabel(slotTime: string) {
  const [h, m] = slotTime.split(":");
  const hourNum = Number.parseInt(h, 10);
  const ampm = hourNum >= 12 ? "PM" : "AM";
  const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${displayHour}:${m} ${ampm}`;
}

type PricingTabProps = {
  price: number;
  onPriceChange: (price: number) => void;
  bookingType: "nightly" | "hourly";
  onBookingTypeChange: (type: "nightly" | "hourly") => void;
  weeklyDiscount: { enabled: boolean; percent: number };
  onWeeklyDiscountChange: (val: { enabled: boolean; percent: number }) => void;
  monthlyDiscount: { enabled: boolean; percent: number };
  onMonthlyDiscountChange: (val: { enabled: boolean; percent: number }) => void;
  rules: MandatoryRule[];
  onAddRule: () => void;
  onUpdateRule: (index: number, patch: Partial<MandatoryRule>) => void;
  onRemoveRule: (index: number) => void;
  packages: PropertyPackage[];
  priceError?: string;
  // Hourly slot settings
  slots?: string[];
  onToggleSlot?: (slotTime: string) => void;
  onClearSlots?: () => void;
  onSetSlots?: (slots: string[]) => void;
  slotAlignment?: "hourly" | "halfHour" | "all";
  onSlotAlignmentChange?: (align: "hourly" | "halfHour" | "all") => void;
  visibleSlots?: string[];
  morningSlots?: string[];
  afternoonSlots?: string[];
  hiddenSelectedCount?: number;
  slotsError?: string;
};

export function PricingTab({
  price,
  onPriceChange,
  bookingType,
  onBookingTypeChange,
  weeklyDiscount,
  onWeeklyDiscountChange,
  monthlyDiscount,
  onMonthlyDiscountChange,
  rules,
  onAddRule,
  onUpdateRule,
  onRemoveRule,
  packages,
  priceError,
  slots = [],
  onToggleSlot,
  onClearSlots,
  onSetSlots,
  slotAlignment = "hourly",
  onSlotAlignmentChange,
  visibleSlots = [],
  morningSlots = [],
  afternoonSlots = [],
  hiddenSelectedCount = 0,
  slotsError,
}: PricingTabProps) {
  const isNightly = bookingType === "nightly";
  const unitPlural = isNightly ? "nights" : "slots";
  const monthlyNotHigher =
    weeklyDiscount.enabled &&
    monthlyDiscount.enabled &&
    monthlyDiscount.percent <= weeklyDiscount.percent;

  return (
    <div className="space-y-12">
      {/* 1. Price Hero Section */}
      <section aria-labelledby="price-heading" className="py-6 sm:py-10">
        <div className="flex flex-col items-center text-center">
          <h2 id="price-heading" className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Set your price
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">
            You can change it anytime.
          </p>
          <div className="mt-6">
            <BookingTypeToggle
              value={bookingType}
              onChange={onBookingTypeChange}
            />
          </div>
          <PriceEditor
            price={price}
            unit={isNightly ? "night" : "hour"}
            onChange={onPriceChange}
            error={priceError}
          />
        </div>
      </section>

      {/* 2. Hourly Slots Selector (when Hourly is selected) */}
      {!isNightly && onToggleSlot && onClearSlots && onSetSlots && onSlotAlignmentChange && (
        <section aria-labelledby="slots-heading" className="border-t border-border pt-10">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 id="slots-heading" className="text-base font-semibold text-foreground">
                  Available time slots
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Guests can book any of the time slots you activate below.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge variant={slots.length > 0 ? "secondary" : "outline"} className="text-xs font-normal">
                  <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {slots.length} {slots.length === 1 ? "slot" : "slots"} active
                </Badge>
                {slots.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="text-xs text-muted-foreground hover:text-destructive h-7 px-2 cursor-pointer"
                    onClick={onClearSlots}
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/30 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>Quick Presets</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="h-7 text-xs bg-background hover:bg-muted cursor-pointer"
                  onClick={() => {
                    onSetSlots([
                      "08:00", "09:00", "10:00", "11:00", "12:00",
                      "13:00", "14:00", "15:00", "16:00", "17:00",
                    ]);
                    onSlotAlignmentChange("hourly");
                  }}
                >
                  08:00 – 17:00 (Hourly)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="h-7 text-xs bg-background hover:bg-muted font-medium text-primary border-primary/30 cursor-pointer"
                  onClick={() => {
                    onSetSlots([
                      "08:30", "09:30", "10:30", "11:30", "12:30",
                      "13:30", "14:30", "15:30", "16:30", "17:30",
                    ]);
                    onSlotAlignmentChange("halfHour");
                  }}
                >
                  08:30 – 17:30 (Half-hour shift)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="h-7 text-xs bg-background hover:bg-muted cursor-pointer"
                  onClick={() => {
                    const morning = visibleSlots.filter((s) => Number.parseInt(s.split(":")[0], 10) < 12);
                    onSetSlots(Array.from(new Set([...slots, ...morning])).sort());
                  }}
                >
                  + Add Morning ({slotAlignment === "halfHour" ? "08:30-11:30" : "08:00-11:00"})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="h-7 text-xs bg-background hover:bg-muted cursor-pointer"
                  onClick={() => {
                    const afternoon = visibleSlots.filter((s) => Number.parseInt(s.split(":")[0], 10) >= 12);
                    onSetSlots(Array.from(new Set([...slots, ...afternoon])).sort());
                  }}
                >
                  + Add Afternoon ({slotAlignment === "halfHour" ? "12:30-17:30" : "12:00-17:00"})
                </Button>
              </div>
            </div>

            {/* Alignment Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <span className="text-xs font-semibold text-foreground">
                Slot Alignment:
              </span>
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => onSlotAlignmentChange("hourly")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                    slotAlignment === "hourly"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  On the Hour (:00)
                </button>
                <button
                  type="button"
                  onClick={() => onSlotAlignmentChange("halfHour")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                    slotAlignment === "halfHour"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Half-Past (:30)
                </button>
                <button
                  type="button"
                  onClick={() => onSlotAlignmentChange("all")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                    slotAlignment === "all"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All (Every 30m)
                </button>
              </div>
            </div>

            {/* Slot Pills AM / PM */}
            <div className="space-y-4">
              {morningSlots.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Sun className="h-3.5 w-3.5 text-amber-500" /> Morning (AM)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {morningSlots.map((slotTime) => {
                      const isSelected = slots.includes(slotTime);
                      return (
                        <button
                          key={slotTime}
                          type="button"
                          onClick={() => onToggleSlot(slotTime)}
                          className={cn(
                            "px-3 py-1.5 text-xs rounded-lg border font-medium transition-all cursor-pointer",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                              : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                          )}
                        >
                          {formatSlotLabel(slotTime)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {afternoonSlots.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Sunset className="h-3.5 w-3.5 text-orange-500" /> Afternoon & Evening (PM)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {afternoonSlots.map((slotTime) => {
                      const isSelected = slots.includes(slotTime);
                      return (
                        <button
                          key={slotTime}
                          type="button"
                          onClick={() => onToggleSlot(slotTime)}
                          className={cn(
                            "px-3 py-1.5 text-xs rounded-lg border font-medium transition-all cursor-pointer",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                              : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                          )}
                        >
                          {formatSlotLabel(slotTime)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {hiddenSelectedCount > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/40 px-3.5 py-2.5 rounded-xl border border-border/60">
                  <span>
                    💡 <strong>{hiddenSelectedCount}</strong> other active slot(s) currently hidden by this alignment filter.
                  </span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-primary underline underline-offset-2 cursor-pointer"
                    onClick={() => onSlotAlignmentChange("all")}
                  >
                    Switch to All view
                  </button>
                </div>
              )}

              {slotsError && (
                <p className="text-xs font-semibold text-destructive">{slotsError}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. Discounts Section (Nightly only) */}
      {isNightly && (
        <section aria-labelledby="discounts-heading" className="border-t border-border pt-10">
          <h2 id="discounts-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Discounts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reward guests who book longer stays.
          </p>

          <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card px-5 sm:px-6 shadow-xs">
            <DiscountRow
              id="weekly-discount"
              title="Weekly discount"
              description="For stays of 7 nights or more"
              example={`Guests pay ${formatRand(discountedTotal(price, 7, weeklyDiscount.percent))} for 7 nights instead of ${formatRand(price * 7)}`}
              enabled={weeklyDiscount.enabled}
              percent={weeklyDiscount.percent}
              onToggle={() =>
                onWeeklyDiscountChange({
                  ...weeklyDiscount,
                  enabled: !weeklyDiscount.enabled,
                })
              }
              onPercentChange={(percent) =>
                onWeeklyDiscountChange({
                  ...weeklyDiscount,
                  percent,
                })
              }
            />
            <DiscountRow
              id="monthly-discount"
              title="Monthly discount"
              description="For stays of 28 nights or more"
              example={`Guests pay ${formatRand(discountedTotal(price, 28, monthlyDiscount.percent))} for 28 nights instead of ${formatRand(price * 28)}`}
              enabled={monthlyDiscount.enabled}
              percent={monthlyDiscount.percent}
              onToggle={() =>
                onMonthlyDiscountChange({
                  ...monthlyDiscount,
                  enabled: !monthlyDiscount.enabled,
                })
              }
              onPercentChange={(percent) =>
                onMonthlyDiscountChange({
                  ...monthlyDiscount,
                  percent,
                })
              }
            />
          </div>

          {monthlyNotHigher && (
            <div className="mt-3 flex items-start gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border/60">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span>
                Your monthly discount isn’t higher than your weekly one, so month-long guests won’t save extra.
              </span>
            </div>
          )}
        </section>
      )}

      {/* 4. Required Packages Section */}
      <section aria-labelledby="packages-heading" className="border-t border-border pt-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <h2 id="packages-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Required packages
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Ask guests to add a package when their booking length matches a rule.
            </p>
          </div>
        </div>

        {packages.length === 0 ? (
          <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No packages configured</AlertTitle>
            <AlertDescription className="text-xs sm:text-sm">
              You must configure packages for this property first before setting up mandatory rules. Head to the Packages page to add deals.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="mt-6 space-y-4">
            {rules.map((rule, index) => (
              <PackageRuleCard
                key={index}
                rule={rule}
                index={index}
                unitPlural={unitPlural}
                packages={packages}
                onChange={(patch) => onUpdateRule(index, patch)}
                onRemove={() => onRemoveRule(index)}
              />
            ))}

            {rules.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No rules yet. Guests can book without adding a mandatory package.
                </p>
                <button
                  type="button"
                  onClick={onAddRule}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/80 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add first rule
                </button>
              </div>
            )}
          </div>
        )}

        {packages.length > 0 && rules.length > 0 && (
          <button
            type="button"
            onClick={onAddRule}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-foreground/20 bg-background px-4 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-colors duration-150 hover:bg-muted cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add rule
          </button>
        )}
      </section>
    </div>
  );
}
