"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth";

export default function SiteFooter() {
  const { user } = useAuth();
  const [fetchedName, setFetchedName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    fetch(`/api/user/profile?userId=${user.uid}&email=${user.email || ""}`)
      .then((res) => res.json())
      .then((result) => {
        if (active && result.success && result.data?.displayName) {
          setFetchedName(result.data.displayName);
        }
      })
      .catch(() => {});

    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ displayName?: string }>;
      if (customEvent.detail?.displayName) {
        setFetchedName(customEvent.detail.displayName);
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      active = false;
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [user]);

  const profileDisplayName = user
    ? fetchedName || user.displayName || user.email?.split("@")[0] || "Profile"
    : "Profile";

  return (
    <footer className="w-full border-t border-border/50 py-6 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center opacity-70 transition-opacity hover:opacity-100"
          aria-label="Home"
        >
          <Image src="/Plek.svg" alt="Simple Plek" width={22} height={22} />
        </Link>

        <nav aria-label="Footer" className="flex items-center gap-5 sm:gap-6">
          <Link href="/faq" className="transition-colors hover:text-foreground">
            FAQ
          </Link>
          <Link
            href={user ? "/profile" : "/login"}
            id="footer-profile-link"
            className="transition-colors hover:text-foreground font-medium"
            title={user ? `Profile: ${profileDisplayName}` : "Sign in to profile"}
          >
            {profileDisplayName}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
