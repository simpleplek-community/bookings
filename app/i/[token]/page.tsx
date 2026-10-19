"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth, AuthProvider } from "@/components/auth";
import Link from "next/link";
import { formatDisplayDate } from "@/lib/utils";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

interface InvitePreview {
  kind: "booking" | "estimate";
  id: string;
  propertyTitle: string;
  propertyImage: string | null;
  organiserName: string;
  fromDate: string;
  toDate: string;
  guestCount: number;
  expired: boolean;
  isOrganiser: boolean;
  alreadyJoined: boolean;
  removed: boolean;
}

function stayPath(preview: { kind: "booking" | "estimate"; id: string }) {
  return preview.kind === "booking" ? `/bookings/${preview.id}` : `/estimate/${preview.id}`;
}

function InviteLandingContent({ params }: InvitePageProps) {
  const router = useRouter();
  const { token } = use(params);
  const { user, loading: authLoading } = useAuth();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joined, setJoined] = useState(false);

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
    setIsJoining(true);
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
      setJoined(true);
      router.push(stayPath(preview));
    } catch (err: any) {
      setError(err.message || "Failed to join this stay.");
      setIsJoining(false);
    }
  };

  const isLoading = authLoading || !user || (!preview && !error);
  const cannotJoin = preview && (preview.expired || preview.removed);
  const alreadyIn = preview && (preview.alreadyJoined || preview.isOrganiser);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-950 px-4 py-16 text-white relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md p-8 rounded-3xl border border-teal-100/10 bg-white/5 backdrop-blur-md text-center space-y-4">
        <span className="text-3xl block">✉</span>

        <h2 className="text-lg font-bold">Stay invitation</h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-teal-500 border-white/15" />
            <p className="text-xs text-zinc-300 font-medium">Checking invitation...</p>
          </div>
        ) : !preview ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs font-bold text-red-400">
              ⚠️ {error}
            </div>
            <p className="text-[11px] text-zinc-400">
              Ask the organiser for a fresh invite link.
            </p>
            <Link
              href="/"
              className="inline-block w-full rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-white hover:bg-teal-600 transition-all"
            >
              Go to Home Page
            </Link>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <p className="text-center text-xs text-zinc-300">
              <strong className="text-white">{preview.organiserName}</strong> invited you to join their{" "}
              {preview.kind === "booking" ? "booking" : "stay estimate"}.
            </p>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-xs">
              {preview.propertyImage && (
                <img
                  src={preview.propertyImage}
                  alt={preview.propertyTitle}
                  className="mb-2 h-28 w-full rounded-lg object-cover"
                />
              )}
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Property</span>
                <span className="font-semibold">{preview.propertyTitle}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">From</span>
                <span className="font-semibold">{formatDisplayDate(preview.fromDate)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">To</span>
                <span className="font-semibold">{formatDisplayDate(preview.toDate)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-400">Guests joined</span>
                <span className="font-semibold">{preview.guestCount}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs font-bold text-red-400">
                ⚠️ {error}
              </div>
            )}

            {preview.expired ? (
              <p className="text-center text-xs text-zinc-400">This stay has ended, so the invitation has expired.</p>
            ) : preview.removed ? (
              <p className="text-center text-xs text-zinc-400">
                The organiser removed you from this stay. Contact them if this was a mistake.
              </p>
            ) : alreadyIn ? (
              <Link
                href={stayPath(preview)}
                className="block w-full rounded-xl bg-teal-500 py-2.5 text-center text-xs font-bold text-white hover:bg-teal-600 transition-all"
              >
                {preview.isOrganiser ? "This is your stay. Open it" : "You've already joined. Open the stay"}
              </Link>
            ) : (
              <>
                <p className="text-center text-[11px] text-zinc-400">
                  Joining shares your name and email ({user?.email}) with the organiser, who will be
                  notified.
                </p>
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={isJoining || joined || Boolean(cannotJoin)}
                  className="w-full rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-white hover:bg-teal-600 transition-all disabled:opacity-60"
                >
                  {joined ? "Joined. Opening your stay..." : isJoining ? "Joining..." : "Join this stay"}
                </button>
              </>
            )}

            <Link href="/" className="block text-center text-[11px] text-zinc-400 hover:text-white">
              Not now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvitePage({ params }: InvitePageProps) {
  return (
    <AuthProvider>
      <InviteLandingContent params={params} />
    </AuthProvider>
  );
}
