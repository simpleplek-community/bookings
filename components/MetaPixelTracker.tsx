"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPixelEvent } from "@/lib/client-pixel";

function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Re-track PageView on route changes within Next.js SPA
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      trackPixelEvent("PageView");
    }
  }, [pathname, searchParams]);

  return null;
}

export default function MetaPixelTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
