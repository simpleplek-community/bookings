"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckIcon, Loader2Icon, MailIcon, UsersIcon } from "lucide-react";
import { useAuth, AuthProvider } from "@/components/auth";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

interface InvitePreview {
  kind: "booking" | "estimate";
  id: string;
  propertyTitle: string;
  propertyImage: string | null;
  isHourly: boolean;
  organiserName: string;
  fromDate: string;
  toDate: string;
  guestCount: number;
  expired: boolean;
  isOrganiser: boolean;
  alreadyJoined: boolean;
  removed: boolean;
}

type JoinStatus = "idle" | "joining" | "joined" | "declined";

// Stationery palette for the invitation card. Follows the site's `.dark` class (see globals.css):
// a cream card on warm stone in light mode, a charcoal card on near-black in dark mode.
const inviteTheme = [
  "[--inv-backdrop:#ECE6DA] [--inv-paper:#F6F2EA] [--inv-edge:#E2DACB] [--inv-ink:#1C2422] [--inv-muted:#5E6865]",
  "[--inv-accent:#1F4A40] [--inv-button:#1F4A40] [--inv-button-hover:#173A32] [--inv-button-text:#F6F2EA] [--inv-error:#B42318]",
  "[--inv-shadow:0_24px_60px_-24px_rgba(28,36,34,0.35)]",
  "dark:[--inv-backdrop:#060607] dark:[--inv-paper:#1A1E1D] dark:[--inv-edge:#2E3533] dark:[--inv-ink:#EFEAE0] dark:[--inv-muted:#A3ACA8]",
  "dark:[--inv-accent:#8CC7B5] dark:[--inv-button:#2F6A5B] dark:[--inv-button-hover:#377A69] dark:[--inv-button-text:#F6F2EA] dark:[--inv-error:#F2958B]",
  "dark:[--inv-shadow:0_24px_60px_-12px_rgba(0,0,0,0.6)]",
].join(" ");
const serif: React.CSSProperties = { fontFamily: "var(--font-invite-serif), ui-serif, Georgia, serif" };
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--inv-accent)/40";

function stayPath(preview: { kind: "booking" | "estimate"; id: string }) {
  return preview.kind === "booking" ? `/bookings/${preview.id}` : `/estimate/${preview.id}`;
}

function formatInviteDate(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" });
}

function formatInviteTime(value: string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" });
}

function stayLengthLabel(preview: InvitePreview) {
  if (preview.isHourly) return "1 slot";
  const nights = Math.max(1, Math.round((new Date(preview.toDate).getTime() - new Date(preview.fromDate).getTime()) / 86_400_000));
  return `${nights} night${nights === 1 ? "" : "s"}`;
}

function InviteCard({ children, labelledBy }: { children: React.ReactNode; labelledBy?: string }) {
  return (
    <div className={`${inviteTheme} flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-(--inv-backdrop) px-4 py-12 text-base leading-6 text-(--inv-ink)`}>
      <article
        aria-labelledby={labelledBy}
        className="w-full max-w-[420px] overflow-hidden rounded-[20px] bg-(--inv-paper) shadow-(--inv-shadow) dark:ring-1 dark:ring-white/5"
      >
        {children}
      </article>
    </div>
  );
}

function InviteLandingContent({ params }: InvitePageProps) {
  const router = useRouter();
  const { token } = use(params);
  const { user, loading: authLoading } = useAuth();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<JoinStatus>("idle");

  // Load the stay summary only. Joining happens when the user clicks the button.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirect=/i/${token}`);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/invites/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const result = await res.json();
        if (cancelled) return;
        if (!res.ok || !result.success) throw new Error(result.error || "This invitation could not be loaded.");
        setPreview(result.data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "This invitation could not be loaded.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, token, router]);

  const handleJoin = async () => {
    if (!preview) return;
    setStatus("joining");
    setError(null);
    try {
      const endpoint = preview.kind === "booking" ? "/api/bookings/accept-invite" : "/api/estimates/accept-invite";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Failed to join this stay.");
      setPreview((prev) => (prev && !result.alreadyJoined ? { ...prev, guestCount: prev.guestCount + 1 } : prev));
      setStatus("joined");
      setTimeout(() => router.push(stayPath(preview)), 1500);
    } catch (err: any) {
      setError(err.message || "Failed to join this stay.");
      setStatus("idle");
    }
  };

  if (authLoading || !user || (!preview && !error)) {
    return (
      <InviteCard>
        <div role="status" className="flex flex-col items-center gap-3 px-8 py-14 text-sm text-(--inv-muted)">
          <Loader2Icon className="h-5 w-5 animate-spin text-(--inv-accent)" aria-hidden="true" />
          Checking invitation…
        </div>
      </InviteCard>
    );
  }

  if (!preview) {
    return (
      <InviteCard labelledBy="invite-title">
        <div className="px-8 py-10 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-(--inv-edge) text-(--inv-accent)">
            <MailIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <h1 id="invite-title" style={serif} className="mt-5 text-[32px] leading-[1.1]">
            Invitation unavailable
          </h1>
          <p className="mt-3 text-sm text-(--inv-muted)">{error}</p>
          <p className="mt-1 text-sm text-(--inv-muted)">Ask the organiser for a fresh invite link.</p>
          <Link
            href="/"
            className={`mt-6 block w-full rounded-xl bg-(--inv-button) px-4 py-3.5 text-[15px] font-medium text-(--inv-button-text) transition-colors hover:bg-(--inv-button-hover) ${focusRing}`}
          >
            Go to home page
          </Link>
        </div>
      </InviteCard>
    );
  }

  const alreadyIn = preview.alreadyJoined || preview.isOrganiser;

  return (
    <InviteCard labelledBy="invite-title">
      <header className="px-8 pb-6 pt-8 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-(--inv-edge) text-(--inv-accent)">
          <MailIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <p className="mt-5 text-sm text-(--inv-muted)">
          <strong className="font-medium text-(--inv-ink)">{preview.organiserName}</strong> invited you to join their{" "}
          {preview.kind === "booking" ? "booking" : "stay estimate"}
        </p>
        <h1 id="invite-title" style={serif} className="mt-2 text-[40px] leading-[1.05] tracking-[-0.01em]">
          Stay invitation
        </h1>
      </header>

      <div className="px-5">
        {preview.propertyImage && (
          <img
            alt={preview.propertyTitle}
            src={preview.propertyImage}
            className="aspect-[16/10] w-full rounded-xl object-cover"
          />
        )}
        <p style={serif} className="mt-4 text-center text-2xl italic">{preview.propertyTitle}</p>
      </div>

      <dl className="mx-8 mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <div>
          <dt className="text-xs text-(--inv-muted)">{preview.isHourly ? "Starts" : "From"}</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {formatInviteDate(preview.fromDate)}
            {preview.isHourly && <span className="block text-sm text-(--inv-muted)">{formatInviteTime(preview.fromDate)}</span>}
          </dd>
        </div>
        <div aria-hidden="true" className="flex flex-col items-center">
          <span className="h-px w-8 bg-(--inv-edge)" />
          <span className="mt-1 text-[11px] text-(--inv-muted)">{stayLengthLabel(preview)}</span>
        </div>
        <div>
          <dt className="text-xs text-(--inv-muted)">{preview.isHourly ? "Ends" : "To"}</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {formatInviteDate(preview.toDate)}
            {preview.isHourly && <span className="block text-sm text-(--inv-muted)">{formatInviteTime(preview.toDate)}</span>}
          </dd>
        </div>
      </dl>

      {/* Ticket perforation */}
      <div className="relative my-7" aria-hidden="true">
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-(--inv-backdrop)" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-(--inv-backdrop)" />
        <div className="mx-6 border-t-2 border-dashed border-(--inv-edge)" />
      </div>

      <footer className="px-8 pb-8">
        <p className="flex items-center justify-center gap-2 text-sm">
          <UsersIcon className="h-4 w-4 text-(--inv-accent)" aria-hidden="true" />
          <span>
            <span className="font-medium tabular-nums">{preview.guestCount}</span>{" "}
            {preview.guestCount === 1 ? "guest" : "guests"} joined
          </span>
        </p>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-(--inv-error)/10 px-4 py-3 text-center text-sm text-(--inv-error)">
            {error}
          </p>
        )}

        {preview.expired ? (
          <p className="mt-6 text-center text-sm text-(--inv-muted)">This stay has ended, so the invitation has expired.</p>
        ) : preview.removed ? (
          <p className="mt-6 text-center text-sm text-(--inv-muted)">
            The organiser removed you from this stay. Contact them if this was a mistake.
          </p>
        ) : status === "joined" ? (
          <div
            role="status"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-(--inv-accent)/10 px-4 py-3.5 text-sm font-medium text-(--inv-accent)"
          >
            <CheckIcon className="h-4 w-4" aria-hidden="true" />
            You&apos;ve joined this stay. Opening it…
          </div>
        ) : alreadyIn ? (
          <>
            <p className="mt-4 text-center text-sm text-(--inv-muted)">
              {preview.isOrganiser ? "This is your stay." : "You've already joined this stay."}
            </p>
            <Link
              href={stayPath(preview)}
              className={`mt-3 flex w-full items-center justify-center rounded-xl bg-(--inv-button) px-4 py-3.5 text-[15px] font-medium text-(--inv-button-text) transition-colors hover:bg-(--inv-button-hover) ${focusRing}`}
            >
              Open the stay
            </Link>
          </>
        ) : status === "declined" ? (
          <div role="status" className="mt-6 text-center">
            <p className="text-sm text-(--inv-muted)">Invitation dismissed.</p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className={`mt-2 text-sm font-medium text-(--inv-accent) underline-offset-4 transition-colors hover:underline ${focusRing}`}
            >
              Changed your mind?
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleJoin}
              disabled={status === "joining"}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-(--inv-button) px-4 py-3.5 text-[15px] font-medium text-(--inv-button-text) transition-[background-color,transform] duration-150 ease-out hover:bg-(--inv-button-hover) active:scale-[0.98] focus-visible:ring-offset-2 focus-visible:ring-offset-(--inv-paper) disabled:cursor-not-allowed disabled:opacity-80 ${focusRing}`}
            >
              {status === "joining" && <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {status === "joining" ? "Joining…" : "Join this stay"}
            </button>
            <button
              type="button"
              onClick={() => setStatus("declined")}
              className={`mt-3 block w-full rounded-lg py-2 text-center text-sm text-(--inv-muted) transition-colors hover:text-(--inv-ink) ${focusRing}`}
            >
              Not now
            </button>
          </>
        )}

        {!alreadyIn && !preview.expired && !preview.removed && status !== "joined" && (
          <p className="mt-5 text-center text-xs leading-5 text-(--inv-muted)">
            Joining shares your name and email ({user.email}) with the organiser, who will be notified.
          </p>
        )}
      </footer>
    </InviteCard>
  );
}

export default function InvitePage({ params }: InvitePageProps) {
  return (
    <AuthProvider>
      <InviteLandingContent params={params} />
    </AuthProvider>
  );
}
