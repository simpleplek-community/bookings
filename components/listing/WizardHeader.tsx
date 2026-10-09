"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, HelpCircle } from "lucide-react";

type WizardHeaderProps = {
  onSave?: () => void;
};

export function WizardHeader({ onSave }: WizardHeaderProps) {
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    if (onSave) onSave();
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      router.push("/admin/properties");
    }, 800);
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-line bg-canvas px-6 md:px-12 sticky top-0 z-20">
      <Link
        href="/admin/properties"
        className="text-xl font-bold tracking-tight text-brand transition-opacity hover:opacity-80"
      >
        simpleplek
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/admin/properties"
          className="whitespace-nowrap rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink hover:bg-surface"
        >
          Properties dashboard
        </Link>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex min-w-[112px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:border-ink hover:bg-surface cursor-pointer"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4 text-success" aria-hidden="true" />
              Saved
            </>
          ) : (
            "Save & exit"
          )}
        </button>
      </div>
    </header>
  );
}
