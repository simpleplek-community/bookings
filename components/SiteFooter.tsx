import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-border/60 bg-card/40 py-8 text-xs text-muted-foreground backdrop-blur-xs">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <Image src="/Plek.svg" alt="Simple Plek" width={26} height={26} className="opacity-80" />
          <span>&copy; {new Date().getFullYear()} Simpleplek. All rights reserved.</span>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Link href="/faq" className="transition-colors hover:text-foreground">
            FAQ
          </Link>
          <Link href="/bookings" className="transition-colors hover:text-foreground">
            Bookings
          </Link>
          <Link href="/subscribe" className="transition-colors hover:text-foreground">
            Become Pro
          </Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms of Use
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
