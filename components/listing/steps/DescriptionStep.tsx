"use client";

import React from "react";

const MAX_DESCRIPTION = 500;

type DescriptionStepProps = {
  description: string;
  onChange: (value: string) => void;
};

export function DescriptionStep({ description, onChange }: DescriptionStepProps) {
  return (
    <div>
      <label htmlFor="property-description" className="sr-only">
        Description
      </label>
      <textarea
        id="property-description"
        rows={7}
        maxLength={MAX_DESCRIPTION}
        value={description}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your stay, amenities, views, scenery..."
        className="w-full resize-none rounded-xl border border-line-strong bg-canvas px-5 py-4 text-lg leading-relaxed text-ink placeholder:text-faint focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />
      <p className="mt-2 text-sm font-semibold text-muted">
        {description.length}/{MAX_DESCRIPTION}
      </p>
    </div>
  );
}
