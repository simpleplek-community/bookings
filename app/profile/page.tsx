"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { publicUrl } from "@/utils/subdomain";

const BIO_MAX = 160;

interface UserProfileData {
  isAdmin: boolean;
  plan: string;
  billingInterval: "monthly" | "annual" | null;
  subscriptionExpiresAt: string | null;
  subscriptionStatus: "active" | "expired" | "inactive" | "none";
  subscriptionStartedAt: string | null;
  email: string;
  subdomain: string;
  displayName: string;
  bio: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    fetch(`/api/user/profile?userId=${user.uid}&email=${user.email || ""}`)
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        if (json.success && json.data) {
          setProfileData(json.data);
          setDisplayName(json.data.displayName || user.displayName || "");
          setBio(json.data.bio || "");
        } else {
          setDisplayName(user.displayName || "");
          setErrorMessage("Could not load profile details. Please try refreshing.");
        }
        setIsLoadingProfile(false);
      })
      .catch((err: unknown) => {
        if (active) {
          console.error("Failed to load user profile:", err);
          setErrorMessage("Could not load profile details. Please try refreshing.");
          setIsLoadingProfile(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!displayName.trim()) {
      setNameError("Please enter a host or business name.");
      return;
    }
    setNameError(null);
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          displayName: displayName.trim(),
          bio: bio.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update profile.");
      }

      setProfileData((prev) =>
        prev
          ? {
            ...prev,
            displayName: json.data.displayName,
            bio: json.data.bio,
          }
          : null
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);

      // Notify SiteFooter and header to update profile display name
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("profile-updated", {
            detail: { displayName: json.data.displayName },
          })
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred while saving.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || (user && isLoadingProfile)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner className="size-8 text-primary" />
        <span className="sr-only">Loading your profile</span>
      </div>
    );
  }

  // Unauthenticated View
  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-background">
        <Card className="w-full max-w-md border-border/70 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="size-7" />
            </div>
            <CardTitle className="text-2xl font-bold">Profile & Subscription</CardTitle>
            <CardDescription className="text-sm mt-1.5">
              Please sign in to view your profile details and check when your subscription expires.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="rounded-xl border border-border/50 bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" /> Member Benefits
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Check active subscription status & expiry date</li>
                <li>Edit your host & business public branding</li>
                <li>Manage calendar sync and exclusive packages</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full"
              id="profile-signin-btn"
              nativeButton={false}
              render={<Link href="/login?redirect=/profile" />}
            >
              Sign In to Your Account
            </Button>
            <Button
              variant="outline"
              className="w-full"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Calculate Subscription Expiration Formatting
  const isPro = profileData?.plan === "pro" || profileData?.isAdmin;
  const expiresAtDate = profileData?.subscriptionExpiresAt
    ? new Date(profileData.subscriptionExpiresAt)
    : null;

  const now = new Date();
  const isExpired = expiresAtDate ? expiresAtDate.getTime() <= now.getTime() : false;

  // Days remaining calculation
  let daysRemaining: number | null = null;
  if (expiresAtDate && !isExpired) {
    const diffTime = expiresAtDate.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  // Formatted date string
  const formattedExpiryDate = expiresAtDate
    ? new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(expiresAtDate)
    : "No active expiration date";

  const billingIntervalLabel =
    profileData?.billingInterval === "monthly" ? "Monthly (R15 / month)" : "Annual (R150 / year)";

  const isFormDirty =
    displayName.trim() !== (profileData?.displayName || user.displayName || "").trim() ||
    bio.trim() !== (profileData?.bio || "").trim();

  const proFeatures = [
    "Unlimited property listings and deals",
    "Live 2-way Airbnb & Google Calendar sync",
    "Exclusive member pricing & package builder",
    "Custom branded host address (subdomain)",
  ];

  return (
    <div className="w-full min-h-screen bg-background text-foreground text-base leading-6 font-[Geist,'Geist_Fallback',ui-sans-serif,system-ui,sans-serif]">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
        {/* Navigation & Header */}
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            {profileData?.isAdmin && (
              <Link
                href="/admin/properties"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
              >
                Host Dashboard →
              </Link>
            )}
          </div>

          <div className="flex flex-col gap-1 border-b border-border pb-5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Account & Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Review your active subscription status, expiration timeline, and update your public host profile.
            </p>
          </div>
        </header>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <section
          aria-labelledby="subscription-heading"
          className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <div className="h-1 w-full bg-primary" />
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Membership</span>
                <div id="subscription-heading" className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {isPro ? "Pro Subscription" : "Standard Plan"}
                </div>
              </div>
              {isPro && !isExpired ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Active
                </span>
              ) : isExpired ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400" />
                  Expired
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Free Tier
                </span>
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {isPro
                ? "You have full Pro privileges including live calendar sync and exclusive packages."
                : "Upgrade to unlock listing capabilities and calendar integration."}
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-wide">SUBSCRIPTION EXPIRATION</span>
              </div>
              <div className="mt-2 text-sm font-medium">
                {isPro && expiresAtDate ? (
                  <div className="space-y-1">
                    <div className="text-base font-bold text-foreground">
                      {formattedExpiryDate}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {!isExpired ? (
                        <span className="font-medium text-primary">
                          {daysRemaining !== null
                            ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`
                            : "Active cycle"}
                        </span>
                      ) : (
                        <span className="font-medium text-red-600 dark:text-red-400">
                          Expired on {formattedExpiryDate}
                        </span>
                      )}
                      <span>•</span>
                      <span>{billingIntervalLabel}</span>
                    </div>
                  </div>
                ) : isPro ? (
                  "Active membership — Continuous access"
                ) : (
                  "No active Pro subscription"
                )}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-foreground">Included with Pro:</span>
              <ul className="mt-2 space-y-2">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border bg-muted p-6 sm:flex-row">
            <Link href="/subscribe" className="flex-1">
              <button
                type="button"
                id="manage-subscription-btn"
                className="inline-flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background cursor-pointer"
              >
                <Zap className="h-4 w-4" aria-hidden="true" />
                {isPro && !isExpired ? "Manage / Renew Subscription" : "Subscribe to Pro"}
              </button>
            </Link>
            {profileData?.isAdmin && (
              <Link href="/settings/profile" className="flex-1">
                <button
                  type="button"
                  className="inline-flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background cursor-pointer"
                >
                  <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Public Address Settings
                </button>
              </Link>
            )}
          </div>
        </section>

        <section aria-labelledby="profile-heading">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="border-b border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div id="profile-heading" className="text-lg font-semibold tracking-tight text-foreground">
                    Profile Details
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Shown at the top of your public listings and in the site footer.
                  </div>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                  {displayName.trim().charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "J"}
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium text-foreground">
                  Host or business name
                </label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="e.g. Llandudno Stays"
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? "displayName-error" : undefined}
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  className="flex h-9 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {nameError ? (
                  <p id="displayName-error" className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {nameError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    This name is displayed in the site footer and throughout your guest storefront.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="bio" className="text-sm font-medium text-foreground">
                    Short intro
                  </label>
                  <span className="text-xs tabular-nums text-muted-foreground">{bio.length}/{BIO_MAX}</span>
                </div>
                <textarea
                  id="bio"
                  rows={3}
                  maxLength={BIO_MAX}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Small, characterful places a short walk from the beach..."
                  className="flex w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div role="separator" aria-orientation="horizontal" className="h-px w-full bg-border" />

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Email Address
                  </label>
                  <div className="flex h-9 items-center justify-between gap-2 rounded-md bg-muted px-3 text-sm">
                    <span className="truncate text-foreground/80">{user.email || "No email associated"}</span>
                    <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Host Web Address
                  </label>
                  {profileData?.subdomain ? (
                    <a
                      href={publicUrl(profileData.subdomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 items-center justify-between gap-2 rounded-md border border-border px-3 text-sm text-primary transition-colors duration-150 hover:bg-muted"
                    >
                      <span className="truncate font-medium">{profileData.subdomain}.simpleplek.com</span>
                      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </a>
                  ) : (
                    <Link
                      href="/settings/profile"
                      className="flex h-9 items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                    >
                      <span>Claim host address →</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border bg-muted px-6 py-4">
              <div>
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Check className="h-4 w-4" />
                    Saved & synchronized
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isFormDirty && !isSaving && (
                  <button
                    type="button"
                    onClick={() => {
                      setDisplayName(profileData?.displayName || user.displayName || "");
                      setBio(profileData?.bio || "");
                      setNameError(null);
                    }}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 cursor-pointer"
                  >
                    Discard
                  </button>
                )}
                <button
                  type="submit"
                  id="save-profile-btn"
                  disabled={!isFormDirty || isSaving || !displayName.trim()}
                  className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
