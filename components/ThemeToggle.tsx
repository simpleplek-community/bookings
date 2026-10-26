"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  readThemePreference,
  setThemePreference,
  type ThemePreference,
} from "@/lib/theme";

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const LABEL: Record<ThemePreference, string> = {
  system: "Theme: system",
  light: "Theme: light",
  dark: "Theme: dark",
};

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === "theme") cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps = {}) {
  const pref = useSyncExternalStore(subscribe, readThemePreference, () => "system" as const);
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      aria-label={`${LABEL[pref]}. Switch to ${NEXT[pref]}`}
      title={LABEL[pref]}
      onClick={() => {
        setThemePreference(NEXT[pref]);
        listeners.forEach((l) => l());
      }}
    >
      <Icon />
    </Button>
  );
}
