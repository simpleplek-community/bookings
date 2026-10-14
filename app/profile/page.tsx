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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
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
  const [simulatingRenewal, setSimulatingRenewal] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    fetch(`/api/user/profile?userId=${user.uid}&email=${user.email || ""}`)
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success && json.data) {
          setProfileData(json.data);
          setDisplayName(json.data.displayName || user.displayName || "");
          setBio(json.data.bio || "");
          setIsLoadingProfile(false);
        }
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

  // Test renewal or simulation helper for dev testing
  const handleQuickExtend = async (interval: "monthly" | "annual") => {
    if (!user) return;
    setSimulatingRenewal(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          renewInterval: interval,
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Refetch profile data
        const refreshRes = await fetch(`/api/user/profile?userId=${user.uid}&email=${user.email || ""}`);
        const refreshJson = await refreshRes.json();
        if (refreshJson.success && refreshJson.data) {
          setProfileData(refreshJson.data);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: unknown) {
      console.error("Renewal simulation failed:", err);
    } finally {
      setSimulatingRenewal(false);
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

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Navigation & Header */}
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
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

          <div className="flex flex-col gap-1 border-b border-border/40 pb-5">
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

        {saveSuccess && (
          <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
            <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription>Your profile information has been saved successfully.</AlertDescription>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Subscription Section (Highlighted) */}
          <section className="lg:col-span-5 flex flex-col gap-6" aria-labelledby="subscription-heading">
            <Card className="relative overflow-hidden border-border/80 shadow-sm">
              {/* Subtle top accent gradient */}
              <div
                className={`h-2 w-full ${
                  isPro && !isExpired
                    ? "bg-gradient-to-r from-primary via-emerald-500 to-teal-400"
                    : isExpired
                    ? "bg-destructive"
                    : "bg-muted"
                }`}
              />

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Membership
                    </span>
                    <CardTitle id="subscription-heading" className="text-xl font-bold mt-0.5">
                      {isPro ? "Pro Subscription" : "Standard Plan"}
                    </CardTitle>
                  </div>
                  {isPro && !isExpired ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-semibold px-2.5 py-0.5 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </Badge>
                  ) : isExpired ? (
                    <Badge variant="destructive">Expired</Badge>
                  ) : (
                    <Badge variant="secondary">Free Tier</Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-1">
                  {isPro
                    ? "You have full Pro privileges including live calendar sync and exclusive packages."
                    : "Upgrade to unlock listing capabilities and calendar integration."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Expiration Details Card */}
                <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Calendar className="size-4 text-primary" />
                    <span>SUBSCRIPTION EXPIRATION</span>
                  </div>

                  {isPro && expiresAtDate ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-foreground tracking-tight">
                          {formattedExpiryDate}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="size-3.5 text-muted-foreground" />
                        {!isExpired ? (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {daysRemaining !== null
                              ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`
                              : "Active cycle"}
                          </span>
                        ) : (
                          <span className="font-medium text-destructive">
                            Subscription expired on {formattedExpiryDate}
                          </span>
                        )}
                        <span className="text-muted-foreground/60">•</span>
                        <span className="text-muted-foreground">{billingIntervalLabel}</span>
                      </div>

                      {/* Visual cycle progress bar */}
                      {!isExpired && daysRemaining !== null && (
                        <div className="pt-2">
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    5,
                                    profileData?.billingInterval === "monthly"
                                      ? (daysRemaining / 30) * 100
                                      : (daysRemaining / 365) * 100
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isPro ? (
                    <div className="text-sm font-medium text-foreground">
                      Active membership — Continuous access
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">No active Pro subscription</p>
                      <p className="text-xs text-muted-foreground">
                        Your account is currently on the Standard tier. Subscribe to activate full Pro benefits.
                      </p>
                    </div>
                  )}
                </div>

                {/* Benefits List */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-semibold text-foreground">Included with Pro:</span>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      <span>Unlimited property listings and deals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      <span>Live 2-way Airbnb & Google Calendar sync</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      <span>Exclusive member pricing & package builder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      <span>Custom branded host address (subdomain)</span>
                    </li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-2.5 pt-2 border-t border-border/40">
                <Link href="/subscribe" className="w-full">
                  <Button
                    className="w-full"
                    variant={isPro && !isExpired ? "outline" : "default"}
                    id="manage-subscription-btn"
                  >
                    <Zap className="size-4 mr-1.5" />
                    {isPro && !isExpired ? "Manage / Renew Subscription" : "Subscribe to Pro"}
                  </Button>
                </Link>

                {profileData?.isAdmin && (
                  <Link href="/settings/profile" className="w-full">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                      <Globe className="size-3.5 mr-1.5" />
                      Public Address Settings
                    </Button>
                  </Link>
                )}

                {/* Developer / Testing shortcuts */}
                <div className="mt-2 pt-2 border-t border-dashed border-border/60 w-full text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80 block mb-2">
                    Quick Expiration Testing
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2.5"
                      disabled={simulatingRenewal}
                      onClick={() => handleQuickExtend("monthly")}
                    >
                      {simulatingRenewal ? <Loader2 className="size-3 animate-spin" /> : "+30 Days (Monthly)"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2.5"
                      disabled={simulatingRenewal}
                      onClick={() => handleQuickExtend("annual")}
                    >
                      {simulatingRenewal ? <Loader2 className="size-3 animate-spin" /> : "+1 Year (Annual)"}
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </section>

          {/* Profile Details Form (from app/settings/profile/page.tsx:L211-L237) */}
          <section className="lg:col-span-7 flex flex-col gap-6" aria-labelledby="profile-heading">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <Card className="border-border/80 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle id="profile-heading" className="text-xl font-bold">
                        Profile Details
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Shown at the top of your public listings and in the site footer.
                      </CardDescription>
                    </div>
                    <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base">
                      {displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "P"}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Host or business name (as specified in app/settings/profile/page.tsx:L211-L237) */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="displayName" className="text-sm font-semibold text-foreground">
                      Host or business name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (nameError) setNameError(null);
                      }}
                      placeholder="e.g. Llandudno Stays"
                      aria-invalid={!!nameError}
                      aria-describedby={nameError ? "displayName-error" : undefined}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    {nameError ? (
                      <p id="displayName-error" className="text-xs font-medium text-destructive">
                        {nameError}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        This name is displayed in the site footer and throughout your guest storefront.
                      </p>
                    )}
                  </div>

                  {/* Short intro / Bio */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="bio" className="text-sm font-semibold text-foreground">
                        Short intro
                      </label>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {bio.length}/{BIO_MAX}
                      </span>
                    </div>
                    <textarea
                      id="bio"
                      rows={3}
                      maxLength={BIO_MAX}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Small, characterful places a short walk from the beach..."
                      className="w-full resize-none rounded-xl border border-border bg-background p-3.5 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>

                  <Separator />

                  {/* Email & Account info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Mail className="size-3.5" /> Email Address
                      </label>
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-sm text-foreground">
                        <span className="truncate">{user.email || "No email associated"}</span>
                        <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Globe className="size-3.5" /> Host Web Address
                      </label>
                      {profileData?.subdomain ? (
                        <a
                          href={publicUrl(profileData.subdomain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2.5 text-sm text-primary hover:underline"
                        >
                          <span className="truncate">{profileData.subdomain}.simpleplek.com</span>
                          <ExternalLink className="size-3.5 shrink-0 ml-2" />
                        </a>
                      ) : (
                        <Link
                          href="/settings/profile"
                          className="flex items-center justify-between rounded-xl border border-dashed border-border/80 px-3.5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <span>Claim host address →</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between pt-3 border-t border-border/40">
                  <div className="text-xs text-muted-foreground">
                    {saveSuccess && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="size-3.5" /> Saved & synchronized
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
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
                      >
                        Discard
                      </button>
                    )}
                    <Button
                      type="submit"
                      disabled={isSaving || !displayName.trim() || !isFormDirty}
                      id="save-profile-btn"
                    >
                      {isSaving && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                      {isSaving ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
