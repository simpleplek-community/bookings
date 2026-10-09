"use client";

import React from "react";
import { Lock } from "lucide-react";
import { publicHost } from "../utils/subdomain";
import type { Property } from "@/lib/types";

export type HostProfileData = {
  subdomain: string;
  displayName: string;
  bio: string;
};

type PublicPagePreviewProps = {
  profile: HostProfileData;
  properties?: Property[];
};

export function PublicPagePreview({ profile, properties = [] }: PublicPagePreviewProps) {
  const name = profile.displayName.trim() || "Your name";
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hostAddress = publicHost(profile.subdomain || "your-name");

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3.5 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1 text-xs text-muted-foreground font-mono">
          <Lock className="h-3 w-3 shrink-0 text-muted-foreground/70" />
          <span className="truncate">{hostAddress}</span>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-sm font-bold text-background shadow-xs"
          >
            {initials || "SP"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">
              {properties.length} place{properties.length === 1 ? "" : "s"} to stay
            </p>
          </div>
        </div>

        {profile.bio.trim() && (
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {properties.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {properties.slice(0, 4).map((p) => {
              const coverImg = p.images?.[0] || "/placeholder.svg";
              const isHourly = p.bookingType === "hourly";
              return (
                <div key={p.id || p.slug} className="flex flex-col gap-1.5 overflow-hidden">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                      src={coverImg}
                      alt={p.title || "Property"}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="truncate text-xs font-semibold text-foreground">{p.title || p.name}</p>
                  <p className="-mt-1 text-[11px] text-muted-foreground font-medium">
                    R {Math.round(p.basePricePerNight || 0).toLocaleString()} {isHourly ? "/ hour" : "/ night"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="aspect-[4/3] w-full rounded-xl bg-muted/70 flex items-center justify-center text-xs text-muted-foreground">
                Preview 1
              </div>
              <p className="truncate text-xs font-medium text-foreground">Sample Villa</p>
              <p className="-mt-1 text-xs text-muted-foreground">R 2,800 / night</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="aspect-[4/3] w-full rounded-xl bg-muted/70 flex items-center justify-center text-xs text-muted-foreground">
                Preview 2
              </div>
              <p className="truncate text-xs font-medium text-foreground">Sample Studio</p>
              <p className="-mt-1 text-xs text-muted-foreground">R 1,800 / hour</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
