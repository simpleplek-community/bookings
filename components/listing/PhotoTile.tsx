"use client";

import React from "react";
import { X } from "lucide-react";
import type { ListingPhoto } from "../../types/listing";

type PhotoTileProps = {
  photo: ListingPhoto;
  index: number;
  isCover: boolean;
  onRemove: (id: string) => void;
  onMakeCover: (id: string) => void;
};

export function PhotoTile({
  photo,
  index,
  isCover,
  onRemove,
  onMakeCover,
}: PhotoTileProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-surface ${
        isCover ? "aspect-[3/2]" : "aspect-square"
      }`}
    >
      <img
        src={photo.src}
        alt={photo.alt || `Photo ${index + 1}`}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
      {isCover && (
        <span className="absolute left-3 top-3 rounded-md bg-canvas/90 backdrop-blur-xs px-3 py-1 text-sm font-semibold text-ink shadow-sm border border-line">
          Cover photo
        </span>
      )}
      <button
        type="button"
        onClick={() => onRemove(photo.id)}
        aria-label={`Remove photo ${index + 1}`}
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-canvas/90 backdrop-blur-xs text-ink shadow-sm border border-line transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      {!isCover && (
        <button
          type="button"
          onClick={() => onMakeCover(photo.id)}
          className="absolute bottom-3 left-3 whitespace-nowrap rounded-full bg-canvas/90 backdrop-blur-xs px-3 py-1.5 text-xs font-semibold text-ink shadow-sm border border-line transition-opacity duration-150 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100 cursor-pointer"
        >
          Make cover photo
        </button>
      )}
    </div>
  );
}
