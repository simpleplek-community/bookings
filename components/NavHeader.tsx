"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { User } from "lucide-react";

export default function NavHeader() {
  const { user, loading, logOut } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail?.displayName) {
        setDisplayName(e.detail.displayName);
      }
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  const effectiveName = displayName || user?.displayName || user?.email?.split("@")[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-3 sm:px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md transition-opacity hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none shrink-0"
        >
          <Image src="/Plek.svg" alt="Simple Plek" width={50} height={50} />
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        </Link>

        {/* Nav Links */}
        <nav aria-label="Main" className="flex items-center gap-2.5 sm:gap-6">
          <Link
            href="/bookings"
            className="text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Bookings
          </Link>
          {!user?.isAdmin && (
            <Link
              href="/subscribe"
              className="text-xs sm:text-sm font-medium text-primary transition-colors hover:text-primary/80 whitespace-nowrap"
            >
              Become Pro
            </Link>
          )}
          {(user?.isAdmin || user?.plan === "pro" || user?.plan === "standard") && (
            <Link
              href="/admin/properties"
              id="nav-dashboard-link"
              className="text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          )}

          <Separator orientation="vertical" className="h-5 sm:h-6" />

          {/* Auth State Button */}
          {loading ? (
            <Spinner className="size-4 text-muted-foreground" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 sm:flex-col sm:items-end sm:gap-0.5 group transition-opacity hover:opacity-80"
                title="View Profile & Subscription"
              >
                <User className="size-3.5 text-muted-foreground sm:hidden shrink-0" />
                <span className="text-xs sm:text-sm font-medium leading-none group-hover:underline truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">
                  {effectiveName}
                </span>
                <span className="hidden sm:inline text-xs leading-none text-muted-foreground">{user.email}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={logOut} className="h-8 px-2.5 sm:h-9 sm:px-3 text-xs sm:text-sm">
                Sign out
              </Button>
            </div>
          ) : (
            <Button size="sm" nativeButton={false} render={<Link href="/login" />} className="h-8 px-3 sm:h-9 sm:px-4 text-xs sm:text-sm">
              Sign in
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
