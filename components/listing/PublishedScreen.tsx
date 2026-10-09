"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ExternalLink, Sliders, ArrowRight, Plus } from "lucide-react";
import type { ListingDraft } from "../../types/listing";

type PublishedScreenProps = {
  draft: ListingDraft;
  createdPropertyId?: string | null;
  onCreateAnother: () => void;
};

export function PublishedScreen({
  draft,
  createdPropertyId,
  onCreateAnother,
}: PublishedScreenProps) {
  const cover = draft.photos[0];

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center"
    >
      {cover && (
        <div className="relative">
          <img
            src={cover.src}
            alt={cover.alt || draft.title}
            className="h-44 w-44 rounded-3xl object-cover shadow-[0_8px_28px_rgba(0,0,0,0.14)] border-2 border-canvas"
          />
          <span className="absolute -bottom-3 -right-3 grid h-12 w-12 place-items-center rounded-full border-4 border-canvas bg-success text-white shadow-md">
            <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
          </span>
        </div>
      )}
      <h1 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl">
        Your listing is live!
      </h1>
      <p className="mt-3 text-base sm:text-lg text-muted max-w-md">
        <span className="font-semibold text-ink">{draft.title}</span> is now{" "}
        {draft.isPro ? "available to Pro members" : "visible to all guests"} at{" "}
        <span className="font-mono font-medium text-xs sm:text-sm text-foreground bg-surface px-2 py-1 rounded-md">
          simpleplek.com/stays/{draft.slug}
        </span>
      </p>

      <div className="mt-8 flex flex-col w-full max-w-sm gap-3">
        {createdPropertyId && (
          <Link
            href={`/admin/properties/${createdPropertyId}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-semibold text-white shadow-xs transition-[background-color,transform] duration-150 hover:bg-black active:scale-[0.98]"
          >
            <Sliders className="h-4 w-4" />
            Configure pricing & availability
          </Link>
        )}

        <Link
          href={`/stays/${draft.slug}`}
          target="_blank"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-canvas px-6 py-3 font-semibold text-ink transition-colors duration-150 hover:bg-surface hover:border-ink"
        >
          <ExternalLink className="h-4 w-4" />
          Preview public listing
        </Link>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onCreateAnother}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface hover:border-ink cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create another
          </button>
          <Link
            href="/admin/properties"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface hover:border-ink"
          >
            Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
