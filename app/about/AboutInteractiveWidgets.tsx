"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CalendarSyncIcon,
  CheckIcon,
  CopyIcon,
  Share2Icon,
  UsersIcon,
  ClockIcon,
  SparklesIcon,
  CheckCircle2Icon,
  CompassIcon,
  PauseIcon,
  PlayIcon,
  WavesIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Interactive Estimate Split Calculator demonstration
 * Proves Pillar #2: "Share package payments with other guests"
 */
export function SplitCalculatorDemo() {
  const [guestCount, setGuestCount] = useState<number>(4);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(["surf"]);
  const [copied, setCopied] = useState<boolean>(false);

  const baseStayPerNight = 2400; // Total stay cost for the package
  const nights = 2;
  const staySubtotal = baseStayPerNight * nights; // 4800

  const addonPrices: Record<string, { label: string; price: number }> = {
    surf: { label: "Guided Surf Coaching & Boards", price: 600 },
    yoga: { label: "Morning Flow Yoga Pass", price: 350 },
    braai: { label: "Coastal Seafood Braai Pack", price: 450 },
  };

  const totalAddons = selectedAddons.reduce(
    (sum, id) => sum + (addonPrices[id]?.price || 0) * guestCount,
    0
  );
  const grandTotal = staySubtotal + totalAddons;
  const perGuestShare = Math.round(grandTotal / guestCount);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="overflow-hidden border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl transition-all duration-300">
      <CardContent className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-inner">
              <Share2Icon className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Live Interactive Demo
              </p>
              <h4 className="font-heading text-base font-bold text-foreground">
                Group Estimate & Split Co-Pay
              </h4>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            <SparklesIcon className="mr-1 size-3" />
            Transparent Roster
          </Badge>
        </div>

        {/* Guest selector */}
        <div className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Traveling Crew Size</span>
              <span className="font-bold text-foreground">{guestCount} Guests Sharing</span>
            </div>
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              {[2, 4, 6, 8].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setGuestCount(count)}
                  className={`rounded-lg border py-2 text-xs font-semibold transition-all ${
                    guestCount === count
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border/70 bg-muted/40 text-muted-foreground hover:border-foreground/30 hover:bg-muted/70"
                  }`}
                >
                  {count} Guests
                </button>
              ))}
            </div>
          </div>

          {/* Add-on selection */}
          <div>
            <p className="text-xs font-medium text-muted-foreground">Select Package Add-ons</p>
            <div className="mt-2 flex flex-col gap-2">
              {Object.entries(addonPrices).map(([id, info]) => {
                const isSelected = selectedAddons.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleAddon(id)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                      isSelected
                        ? "border-primary/50 bg-primary/5 text-foreground"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`flex size-4 items-center justify-center rounded border ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-background"
                        }`}
                      >
                        {isSelected && <CheckIcon className="size-3" />}
                      </span>
                      <span>{info.label}</span>
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      +R{info.price}/guest
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Calculation Summary Box */}
          <div className="rounded-xl border border-primary/20 bg-background/90 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-baseline justify-between border-b border-border/50 pb-3">
              <div>
                <span className="text-xs text-muted-foreground">Total Group Stay</span>
                <p className="text-sm font-semibold text-foreground">
                  Weekend Package ({nights} nights)
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono text-lg font-bold text-foreground">
                  R{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/10 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Each Guest&apos;s Split Share:
                </span>
              </div>
              <span className="font-mono text-base font-extrabold text-primary">
                R{perGuestShare.toLocaleString()}
              </span>
            </div>

            {/* Share Link Simulator */}
            <div className="mt-3.5 flex items-center gap-2 pt-2">
              <div className="flex-1 truncate rounded-md border border-border/70 bg-muted/40 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                simpleplek.com/estimate/est_9x7a2...
              </div>
              <Button
                size="sm"
                variant={copied ? "default" : "outline"}
                onClick={handleCopy}
                className="shrink-0 text-xs gap-1.5"
              >
                {copied ? (
                  <>
                    <CheckIcon className="size-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="size-3.5" />
                    Share Link
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Calendar Synced Schedule Demonstration
 * Proves Pillar #1: "Host with a synced schedule"
 */
export function SyncedScheduleDemo() {
  const [scheduleMode, setScheduleMode] = useState<"overnight" | "hourly">("overnight");

  return (
    <Card className="overflow-hidden border border-border/80 bg-gradient-to-br from-card via-card to-secondary/5 shadow-xl transition-all duration-300">
      <CardContent className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary/15 text-secondary shadow-inner">
              <CalendarSyncIcon className="size-4.5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
                Two-Way Live Feed
              </p>
              <h4 className="font-heading text-base font-bold text-foreground">
                Synced Calendar Schedule
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            iCal Sync Active
          </div>
        </div>

        {/* Schedule Mode Switcher */}
        <div className="mt-4 flex rounded-lg border border-border/70 p-0.5 bg-muted/40">
          <button
            type="button"
            onClick={() => setScheduleMode("overnight")}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              scheduleMode === "overnight"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Multi-Night Retreats
          </button>
          <button
            type="button"
            onClick={() => setScheduleMode("hourly")}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
              scheduleMode === "hourly"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hourly Workshops & Sessions
          </button>
        </div>

        {/* Mock Calendar Feed Timeline */}
        <div className="mt-4 space-y-2.5">
          {scheduleMode === "overnight" ? (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                    BUSY
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Thu 12 - Sun 15</p>
                    <p className="text-[11px] text-muted-foreground">
                      Locked via Airbnb iCal feed
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-border text-[10px]">
                  Protected Clash Guard
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    OPEN
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Mon 16 - Fri 20</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Simpleplek Live Member Window
                    </p>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground text-[10px]">
                  Instant Book
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-[10px]">
                    SYNC
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Sat 21 - Tue 24</p>
                    <p className="text-[11px] text-muted-foreground">Google Calendar Owner Block</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-border text-[10px]">
                  Auto Synced
                </Badge>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <ClockIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-medium text-foreground">07:00 - 09:30 • Sunrise Surf Coaching</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Available for Member Booking</p>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground text-[10px]">R450/slot</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <ClockIcon className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">10:00 - 12:00 • Private Studio Session</p>
                    <p className="text-[11px] text-muted-foreground">Reserved via Synced Feed</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">Locked</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <ClockIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-medium text-foreground">16:00 - 18:30 • Sunset Yoga Shala</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Available for Member Booking</p>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground text-[10px]">R350/slot</Badge>
              </div>
            </>
          )}
        </div>

        {/* Status Callout Footer */}
        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span>Schedule status:</span>
          <span className="font-medium text-foreground flex items-center gap-1">
            <CheckCircle2Icon className="size-3.5 text-emerald-500" />
            0 Overlaps • 100% Guaranteed Availability
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Interactive Path Switcher: "How It Works"
 * Lets guests and hosts explore their journey in 3 clear steps
 */
export function PersonaWorkflowTabs() {
  const [activeTab, setActiveTab] = useState<"guests" | "hosts">("guests");

  return (
    <div className="rounded-2xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-md shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <Badge variant="outline" className="border-primary/30 text-primary mb-2">
            Dual Ecosystem
          </Badge>
          <h3 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            How Simpleplek Works
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Engineered for mutual trust, effortless coordination, and maximum enjoyment.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl border border-border/80 p-1 bg-muted/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("guests")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "guests"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CompassIcon className="size-3.5" />
            For Guests & Groups
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hosts")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === "hosts"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <WavesIcon className="size-3.5" />
            For Hosts & Curators
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeTab === "guests" ? (
          <>
            <div className="group relative rounded-xl border border-border/70 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                01
              </span>
              <h4 className="font-heading mt-4 text-base font-bold text-foreground">
                Sync Your Dates
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Set your travel dates once at the top of the directory. View live availability
                calendars and real-time stay pricing across every unique retreat.
              </p>
            </div>

            <div className="group relative rounded-xl border border-border/70 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                02
              </span>
              <h4 className="font-heading mt-4 text-base font-bold text-foreground">
                Share & Split With Crew
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Generate an instant estimate link. Invite co-travelers to the guest roster,
                select customized add-on packages, and split payments without hassle.
              </p>
            </div>

            <div className="group relative rounded-xl border border-border/70 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                03
              </span>
              <h4 className="font-heading mt-4 text-base font-bold text-foreground">
                Unlock Member Perks
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Enjoy R0 booking commission fees, access secret member-only spaces, and experience
                mindful retreats curated with local character.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="group relative rounded-xl border border-border/70 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
              <span className="flex size-8 items-center justify-center rounded-lg bg-secondary/10 text-xs font-bold text-secondary">
                01
              </span>
              <h4 className="font-heading mt-4 text-base font-bold text-foreground">
                Connect Synced Feeds
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Add your Airbnb or iCal calendar link. Simpleplek automatically synchronizes
                blocks and availability, completely eliminating double bookings.
              </p>
            </div>

            <div className="group relative rounded-xl border border-border/70 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
              <span className="flex size-8 items-center justify-center rounded-lg bg-secondary/10 text-xs font-bold text-secondary">
                02
              </span>
              <h4 className="font-heading mt-4 text-base font-bold text-foreground">
                Craft Custom Packages
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Design Standard or Pro packages, offer hourly studio sessions or multi-night
                stays, and add experience extras like surf gear, yoga, or private dining.
              </p>
            </div>

            <div className="group relative rounded-xl border border-border/70 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md">
              <span className="flex size-8 items-center justify-center rounded-lg bg-secondary/10 text-xs font-bold text-secondary">
                03
              </span>
              <h4 className="font-heading mt-4 text-base font-bold text-foreground">
                Host Verified Members
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Welcome respectful, community-minded guests with verified profiles. Maintain
                direct relationships without paying punishing 15–20% middleman fees.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function AboutHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isMounted = true;

    const syncPlayback = async (shouldPlay: boolean) => {
      if (!shouldPlay) {
        video.pause();
        if (isMounted) setIsPlaying(false);
        return;
      }

      try {
        await video.play();
        if (isMounted) setIsPlaying(true);
      } catch {
        if (isMounted) setIsPlaying(false);
      }
    };

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      void syncPlayback(!event.matches);
    };

    void syncPlayback(!motionPreference.matches);
    motionPreference.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      isMounted = false;
      motionPreference.removeEventListener("change", handleMotionPreferenceChange);
      video.pause();
    };
  }, []);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  return (
    <>
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="metadata"
        poster="/images/about-hero.jpg"
        aria-hidden="true"
        tabIndex={-1}
        className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
      >
        <source
          src="https://pub-62b3d61e820a424983412732dac4ef9f.r2.dev/yogasurfcommunity.mp4"
          type="video/mp4"
        />
      </video>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        aria-label={isPlaying ? "Pause hero video" : "Play hero video"}
        onClick={togglePlayback}
        className="absolute right-4 top-4 z-10 rounded-full shadow-lg sm:right-6 sm:top-6"
      >
        {isPlaying ? <PauseIcon data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
      </Button>
    </>
  );
}
