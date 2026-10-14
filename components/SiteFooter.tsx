import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} Simple Plek</p>
        <nav aria-label="Footer" className="flex items-center gap-4">
          <Link className="transition-colors hover:text-foreground" href="/privacy">
            Privacy
          </Link>
          <Link className="transition-colors hover:text-foreground" href="/terms">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
