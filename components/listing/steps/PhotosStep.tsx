"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ImagePlus, Plus, Sparkles } from "lucide-react";
import { PhotoTile } from "../PhotoTile";
import type { ListingPhoto } from "../../../types/listing";

const ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/avif";

type PhotosStepProps = {
  photos: ListingPhoto[];
  error: string | null;
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  onMakeCover: (id: string) => void;
  onLoadSample?: () => void;
};

export function PhotosStep({
  photos,
  error,
  onAdd,
  onRemove,
  onMakeCover,
  onLoadSample,
}: PhotosStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const openPicker = () => inputRef.current?.click();

  const dragProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) onAdd(e.dataTransfer.files);
    },
  };

  const [cover, ...rest] = photos;
  const layoutTransition = { duration: 0.25, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] };

  return (
    <div>
      <input
        ref={inputRef}
        id="property-images"
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload property photos"
        onChange={(e) => {
          if (e.target.files) onAdd(e.target.files);
          e.target.value = "";
        }}
      />

      {photos.length === 0 ? (
        <div
          {...dragProps}
          className={`flex h-[360px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-colors duration-150 ${
            isDragging ? "border-ink bg-surface" : "border-line-strong bg-canvas"
          }`}
        >
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface border border-line">
            <ImagePlus className="h-8 w-8 text-ink" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className="mt-4 text-xl font-semibold text-ink">Drag your photos here</p>
          <p className="mt-1 text-sm text-muted">PNG, JPG, WEBP or AVIF up to 10MB each</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={openPicker}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors duration-150 hover:bg-black cursor-pointer"
            >
              Upload from your device
            </button>
            {onLoadSample && (
              <button
                type="button"
                onClick={onLoadSample}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:border-ink hover:bg-surface cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                Load sample photos
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          {...dragProps}
          className={`rounded-xl ${
            isDragging ? "outline-dashed outline-2 outline-offset-4 outline-ink" : ""
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="font-semibold text-ink">
              {photos.length} photo{photos.length === 1 ? "" : "s"}
            </p>
            <button
              type="button"
              onClick={openPicker}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line-strong px-4 py-2 text-sm font-semibold text-ink transition-colors duration-150 hover:border-ink hover:bg-surface cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add more
            </button>
          </div>

          {cover && (
            <motion.div layout="position" key={cover.id} transition={layoutTransition}>
              <PhotoTile
                photo={cover}
                index={0}
                isCover
                onRemove={onRemove}
                onMakeCover={onMakeCover}
              />
            </motion.div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4">
            {rest.map((photo, i) => (
              <motion.div key={photo.id} layout="position" transition={layoutTransition}>
                <PhotoTile
                  photo={photo}
                  index={i + 1}
                  isCover={false}
                  onRemove={onRemove}
                  onMakeCover={onMakeCover}
                />
              </motion.div>
            ))}
            <button
              type="button"
              onClick={openPicker}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line-strong text-ink transition-colors duration-150 hover:border-ink hover:bg-surface cursor-pointer"
            >
              <Plus className="h-8 w-8 text-muted" strokeWidth={1.5} aria-hidden="true" />
              <span className="text-sm font-semibold">Add more</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-error font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
