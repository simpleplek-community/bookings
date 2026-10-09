"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Moon, Package, Plus, Sparkles } from "lucide-react";
import { formatZar, rateLabel, resolveBookingType, type Property, type PropertyPackage } from "@/lib/types";

interface PropertyCardProps {
  property: Property;
  packages: PropertyPackage[];
  onOpenPackages: () => void;
}

export function PropertyCard({ property, packages, onOpenPackages }: PropertyCardProps) {
  const bookingType = resolveBookingType(property);
  const isHourly = bookingType === "hourly";
  const ModeIcon = isHourly ? Clock : Moon;

  const proCount = packages.filter((p) => p.isPro || p.category === "pro").length;
  const standardCount = packages.filter((p) => p.category === "standard" || (!p.category && !p.isPro)).length;
  const addonCount = packages.filter((p) => p.category === "addon" || p.category === "hosted" || p.category === "special").length;
  const hasPackages = packages.length > 0;

  const coverImage = property.images?.[0] || "/placeholder.svg";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:shadow-sm">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/60">
        <img
          src={coverImage}
          alt={property.title || property.name || "Property"}
          className="size-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/95 backdrop-blur-xs px-2.5 py-1 text-xs font-medium text-foreground shadow-xs">
            <ModeIcon className="h-3.5 w-3.5 text-muted-foreground" />
            {isHourly ? "Hourly slots" : "Nightly stay"}
          </span>
          <div>
            {property.isPro && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Pro Only
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">{property.title || property.name}</h3>
            <p className="text-xs sm:text-sm capitalize text-muted-foreground font-medium">
              {property.location || "No location set"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">{rateLabel(property)}</p>
            <p className="text-base font-bold text-foreground">{formatZar(property.basePricePerNight)}</p>
          </div>
        </div>

        <p className="line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {property.description || "No description provided yet."}
        </p>

        {isHourly && property.slots && property.slots.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {property.slots.map((slot) => (
              <span
                key={slot}
                className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-mono font-medium tabular-nums text-foreground"
              >
                {slot}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={onOpenPackages}
            className="inline-flex items-center gap-1.5 rounded-lg py-1 px-2 text-xs sm:text-sm font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
          >
            {hasPackages ? (
              <>
                <Package className="h-4 w-4 text-primary" />
                <span>{packages.length} package{packages.length === 1 ? "" : "s"}</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>Add packages</span>
              </>
            )}
          </button>
          {hasPackages && (
            <p className="text-[11px] text-muted-foreground font-medium">
              {standardCount} std{proCount > 0 ? ` · ${proCount} pro` : ""} · {addonCount} add-on
            </p>
          )}
        </div>

        <Link
          href={`/admin/properties/${property.id || property.slug}`}
          className="inline-flex h-9.5 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Configure
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}