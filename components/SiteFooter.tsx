import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function SiteFooter() {
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
