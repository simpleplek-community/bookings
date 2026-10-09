"use client";

import React from "react";

const MAX_TITLE = 50;

type TitleStepProps = {
  title: string;
  slug: string;
  slugIsValid: boolean;
  onTitleChange: (value: string) => void;
  onSlugChange: (value: string) => void;
};

export function TitleStep({
  title,
  slug,
  slugIsValid,
  onTitleChange,
  onSlugChange,
}: TitleStepProps) {
  const showSlugError = slug.length > 0 && !slugIsValid;

  return (
    <div>
      <label htmlFor="property-title" className="sr-only">
        Property title
      </label>
      <textarea
        id="property-title"
        rows={3}
        maxLength={MAX_TITLE}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="e.g. Llandudno Cliffside Villa"
        className="w-full resize-none rounded-xl border border-line-strong bg-canvas px-5 py-4 text-2xl font-medium leading-snug text-ink placeholder:text-faint focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />
      <p className="mt-2 text-sm font-semibold text-muted">
        {title.length}/{MAX_TITLE}
      </p>

      <div className="mt-10">
        <label htmlFor="property-slug" className="text-sm font-semibold text-ink">
          Listing URL
        </label>
        <div
          className={`mt-2 flex items-center rounded-xl border bg-canvas focus-within:ring-1 ${
            showSlugError
              ? "border-error focus-within:ring-error"
              : "border-line-strong focus-within:border-ink focus-within:ring-ink"
          }`}
        >
          <span className="whitespace-nowrap pl-4 text-muted text-sm sm:text-base">
            simpleplek.com/stays/
          </span>
          <input
            id="property-slug"
            inputMode="url"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="llandudno-cliffside-villa"
            aria-invalid={showSlugError}
            aria-describedby="property-slug-hint"
            className="min-w-0 flex-1 bg-transparent py-3 pr-4 text-ink font-mono placeholder:text-faint focus:outline-none"
          />
        </div>
        <p
          id="property-slug-hint"
          className={`mt-2 text-sm ${showSlugError ? "text-error font-medium" : "text-muted"}`}
        >
          {showSlugError
            ? "Use lowercase letters, numbers and single dashes only."
            : "Generated from your title. Lowercase letters, numbers and dashes only."}
        </p>
      </div>
    </div>
  );
}
