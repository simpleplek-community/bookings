"use client";

import React from "react";
import { Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";
import type { ListingDraft, StepId } from "../../../types/listing";

type ReviewStepProps = {
  draft: ListingDraft;
  errorMessage?: string | null;
  onEdit: (step: StepId) => void;
};

export function ReviewStep({ draft, errorMessage, onEdit }: ReviewStepProps) {
  const cover = draft.photos[0];
  const rows: { label: string; value: string; step: StepId }[] = [
    { label: "Title", value: draft.title, step: "title" },
    { label: "Listing URL", value: `simpleplek.com/stays/${draft.slug}`, step: "title" },
    { label: "Location", value: draft.location, step: "location" },
    {
      label: "Photos",
      value: `${draft.photos.length} photo${draft.photos.length === 1 ? "" : "s"}`,
      step: "photos",
    },
    { label: "Description", value: draft.description, step: "description" },
    {
      label: "Visibility",
      value: draft.isPro ? "Pro members only" : "All guests",
      step: "visibility",
    },
  ];

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error font-medium"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Publication Failed</p>
            <p className="mt-0.5 text-xs opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <article className="self-start rounded-2xl bg-canvas p-4 shadow-[0_6px_20px_rgba(0,0,0,0.12)] border border-line">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-surface border border-line">
            {cover ? (
              <img src={cover.src} alt={cover.alt} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted">
                <ImageIcon className="h-8 w-8" aria-hidden="true" />
              </div>
            )}
            {draft.isPro && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-pro-line" aria-hidden="true" />
                Pro only
              </span>
            )}
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink break-words">{draft.title || "Untitled Property"}</h2>
          <p className="text-muted text-sm mt-0.5">{draft.location || "Location not set"}</p>
        </article>

        <dl className="divide-y divide-line rounded-2xl border border-line bg-canvas p-6 shadow-xs">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <dt className="text-sm font-semibold text-ink">{row.label}</dt>
                <dd className="mt-1 line-clamp-2 break-words text-sm text-muted">{row.value || "—"}</dd>
              </div>
              <button
                type="button"
                onClick={() => onEdit(row.step)}
                aria-label={`Edit ${row.label.toLowerCase()}`}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-ink underline underline-offset-2 transition-colors duration-150 hover:bg-surface cursor-pointer"
              >
                Edit
              </button>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
