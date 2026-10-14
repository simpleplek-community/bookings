"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { publicHost } from "../utils/subdomain";

type ConfirmAddressChangeDialogProps = {
  open: boolean;
  from: string;
  to: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const ease = [0.23, 1, 0.32, 1] as const;

export function ConfirmAddressChangeDialog({
  open,
  from,
  to,
  onCancel,
  onConfirm,
}: ConfirmAddressChangeDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease }}
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="text-lg font-bold tracking-tight text-foreground">
              Change your page address?
            </h2>
            <div id="confirm-desc" className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                <span className="font-semibold text-foreground">{publicHost(from)}</span> will stop working.
                Links you&apos;ve already shared with guests in emails, listings or social posts will need updating.
              </p>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs">
                <span className="text-muted-foreground block mb-0.5">New address:</span>
                <span className="font-mono font-semibold text-foreground text-sm">{publicHost(to)}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                autoFocus
                className="h-10 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted cursor-pointer"
              >
                Keep current
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
              >
                Change address
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
