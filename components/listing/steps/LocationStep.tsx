"use client";

import React from "react";
import { MapPin } from "lucide-react";
import { locations } from "../../../data/locations";

type LocationStepProps = {
  location: string;
  onChange: (value: string) => void;
};

export function LocationStep({ location, onChange }: LocationStepProps) {
  const query = location.trim().toLowerCase();
  const suggestions = query
    ? locations
        .filter((l) => l.toLowerCase().includes(query) && l.toLowerCase() !== query)
        .slice(0, 5)
    : [];

  return (
    <div>
      <label htmlFor="property-location" className="sr-only">
        Location
      </label>
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink"
          aria-hidden="true"
        />
        <input
          id="property-location"
          value={location}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Llandudno, Cape Town"
          autoComplete="off"
          className="w-full rounded-full border border-line-strong bg-canvas py-4 pl-14 pr-6 text-lg text-ink shadow-[0_6px_16px_rgba(0,0,0,0.08)] placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
        />
      </div>

      {suggestions.length > 0 && (
        <ul className="mt-3 overflow-hidden rounded-3xl border border-line bg-canvas py-2 shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => onChange(s)}
                className="flex w-full items-center gap-4 px-5 py-3 text-left text-ink transition-colors duration-150 hover:bg-surface focus-visible:bg-surface focus-visible:outline-none cursor-pointer"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface border border-line">
                  <MapPin className="h-5 w-5 text-muted" aria-hidden="true" />
                </span>
                <span className="font-medium text-ink">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {location.trim() && suggestions.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          Showing guests: <span className="font-semibold text-ink">{location}</span>
        </p>
      )}
    </div>
  );
}
