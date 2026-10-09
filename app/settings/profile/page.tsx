"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { ArrowLeft, ArrowUpRight, Check, Loader2, Lock } from "lucide-react";
import { SubdomainField } from "@/components/SubdomainField";
import { PublicPagePreview, type HostProfileData } from "@/components/PublicPagePreview";
import { ConfirmAddressChangeDialog } from "@/components/ConfirmAddressChangeDialog";
import { BIO_MAX, useProfileForm, type HostProfile } from "@/hooks/useProfileForm";
import { publicHost, publicUrl } from "@/utils/subdomain";
import type { Property } from "@/lib/types";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export default function ProfileSettingsPage() {
  const { user, loading } = useAuth();
  const [initialProfile, setInitialProfile] = useState<HostProfile>({
    subdomain: "",
    displayName: "",
    bio: "",
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileAndProperties = useCallback(async () => {
    if (!user) return;
    try {
      const [profileRes, propsRes] = await Promise.all([
        fetch(`/api/user/profile?userId=${user.uid}&email=${user.email || ""}`),
        fetch(`/api/posts?hostId=${user.uid}&userId=${user.uid}`, {
          headers: {
            "x-user-id": user.uid,
            "x-user-email": user.email || "",
          },
        }),
      ]);

      const profileData = await profileRes.json();
      const propsData = await propsRes.json();

      if (profileData.success && profileData.data) {
        setInitialProfile({
          subdomain: profileData.data.subdomain || "",
          displayName: profileData.data.displayName || user.displayName || "",
          bio: profileData.data.bio || "",
        });
      }
      if (propsData.success && propsData.data) {
        setProperties(propsData.data);
      }
    } catch (err) {
      console.error("Failed to load profile data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfileAndProperties();
    }
  }, [user, fetchProfileAndProperties]);

  const handleSaveToApi = async (profileToSave: HostProfile): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          subdomain: profileToSave.subdomain,
          displayName: profileToSave.displayName,
          bio: profileToSave.bio,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        form.setErrorMessage(json.error || "Failed to save profile.");
        return false;
      }
      return true;
    } catch (err: any) {
      form.setErrorMessage(err.message || "An unexpected error occurred while saving.");
      return false;
    }
  };

  const form = useProfileForm(initialProfile, handleSaveToApi);
  const { draft, profile, availability } = form;

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
        <span className="sr-only">Loading profile settings</span>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Lock />
                </EmptyMedia>
                <EmptyTitle>Access denied</EmptyTitle>
                <EmptyDescription>
                  Administrative privileges are required to access this portal. Please sign
                  in with an administrator account to continue.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="w-full">
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={<Link href="/login" />}
                >
                  Sign in as admin
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href="/" />}
                >
                  Back to home
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6faf9] dark:bg-background text-[#12302c] dark:text-foreground">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col gap-3">
          <Link
            href="/admin/properties"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            Properties dashboard
          </Link>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between border-b border-border/40 pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Public page</h1>
              <p className="text-sm text-muted-foreground">
                The page guests visit to see all your places and book directly.
              </p>
            </div>
            {profile.subdomain && (
              <a
                href={publicUrl(profile.subdomain)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400 underline-offset-4 hover:underline"
              >
                View live page
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          {/* Edit Form */}
          <form
            className="flex flex-col gap-8"
            onSubmit={(e) => {
              e.preventDefault();
              form.requestSave();
            }}
          >
            {/* Address Section */}
            <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs">
              <div>
                <h2 className="text-base font-semibold text-foreground">Address</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Share this link with guests. Pick something short and easy to say out loud.
                </p>
              </div>
              <SubdomainField
                value={draft.subdomain}
                onChange={(v) => form.setField("subdomain", v)}
                status={availability.status}
                error={availability.error}
                suggestions={availability.suggestions}
              />
            </section>

            {/* Profile Section */}
            <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xs">
              <div>
                <h2 className="text-base font-semibold text-foreground">Profile</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Shown at the top of your page.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="displayName" className="text-sm font-semibold text-foreground">
                  Host or business name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={draft.displayName}
                  onChange={(e) => form.setField("displayName", e.target.value)}
                  placeholder="e.g. Llandudno Stays"
                  aria-invalid={!!form.nameError}
                  aria-describedby={form.nameError ? "displayName-error" : undefined}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                {form.nameError && (
                  <p id="displayName-error" className="text-xs sm:text-sm font-medium text-destructive">
                    {form.nameError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="bio" className="text-sm font-semibold text-foreground">
                    Short intro
                  </label>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {draft.bio.length}/{BIO_MAX}
                  </span>
                </div>
                <textarea
                  id="bio"
                  rows={3}
                  maxLength={BIO_MAX}
                  value={draft.bio}
                  onChange={(e) => form.setField("bio", e.target.value)}
                  placeholder="Small, characterful places a short walk from the beach..."
                  className="w-full resize-none rounded-xl border border-border bg-background p-3.5 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </section>

            {/* Error feedback if any */}
            {form.errorMessage && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs sm:text-sm font-medium text-destructive">
                {form.errorMessage}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <div aria-live="polite" className="mr-auto text-xs sm:text-sm">
                {form.saveState === "saved" && (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="h-4 w-4" />
                    Saved. Your page is live at {publicHost(profile.subdomain)}
                  </span>
                )}
              </div>
              {form.isDirty && form.saveState !== "saving" && (
                <button
                  type="button"
                  onClick={form.reset}
                  className="h-10 rounded-xl px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Discard
                </button>
              )}
              <button
                type="submit"
                disabled={!form.canSave}
                className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {form.saveState === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
                {form.saveState === "saving" ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>

          {/* Live Preview Sidebar */}
          <aside className="flex flex-col gap-3 lg:sticky lg:top-8 lg:self-start">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Preview</h2>
            <PublicPagePreview profile={draft} properties={properties} />
          </aside>
        </div>

        {/* Change address confirmation modal */}
        <ConfirmAddressChangeDialog
          open={form.confirmOpen}
          from={profile.subdomain}
          to={draft.subdomain}
          onCancel={() => form.setConfirmOpen(false)}
          onConfirm={form.commit}
        />
      </main>
    </div>
  );
}
