"use client";

import React from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved";

type SaveBarProps = {
  isNew?: boolean;
  saveState: SaveState;
  disabled?: boolean;
  onDelete?: () => void;
  onSave?: () => void;
  formId?: string;
};

export function SaveBar({
  isNew = false,
  saveState,
  disabled = false,
  onDelete,
  onSave,
  formId,
}: SaveBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 sm:py-4">
        <div>
          {!isNew && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              aria-haspopup="dialog"
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs sm:text-sm font-semibold text-destructive underline-offset-4 hover:underline cursor-pointer"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete listing
            </button>
          ) : (
            <div />
          )}
        </div>

        <button
          type={formId ? "submit" : "button"}
          form={formId}
          onClick={formId ? undefined : onSave}
          disabled={disabled || saveState === "saving"}
          className={cn(
            "inline-flex min-w-[140px] sm:min-w-[160px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-foreground px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-background shadow-xs transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
            saveState === "saved" && "bg-emerald-600 text-white"
          )}
        >
          {saveState === "saving" && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {saveState === "saved" && (
            <Check className="h-4 w-4" aria-hidden="true" />
          )}
          {saveState === "saving"
            ? isNew
              ? "Creating..."
              : "Saving..."
            : saveState === "saved"
              ? "Saved"
              : isNew
                ? "Create Listing"
                : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
