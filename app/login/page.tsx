"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRoundIcon } from "lucide-react";

import { useAuth, AuthCard } from "@/components/auth";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to home page if already authenticated
  useEffect(() => {
    if (!loading && user) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("redirect_to")) {
        return; // Let AuthProvider redirection handle it
      }
      const redirectPath = searchParams.get("redirect") || "/";
      router.push(redirectPath);
    }
  }, [user, loading, router]);

  return (
    // The root layout already renders the <main> landmark, so this is a plain div.
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8 px-4 py-16">
      <div className="w-full max-w-md">
        <header className="mb-8 flex flex-col items-center gap-3 text-center">
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
          >
            <KeyRoundIcon className="size-5" />
          </span>
          <h1 className="font-heading text-2xl font-semibold text-balance">
            Exclusive packages for unique locations
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sign in to configure dates and lock bookings
          </p>
        </header>

        <AuthCard />
      </div>

      <nav
        aria-label="Legal"
        className="flex flex-wrap items-center justify-center gap-1.5 text-center text-sm text-muted-foreground"
      >
        <span>By continuing I agree to the</span>
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms of service
        </Link>
        <span aria-hidden="true">•</span>
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          Privacy policy
        </Link>
      </nav>
    </div>
  );
}
