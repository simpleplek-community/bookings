import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  UsersIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  SparklesIcon,
  ArrowRightIcon,
  LockIcon,
  CompassIcon,
  CheckCircle2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SyncedScheduleDemo,
  SplitCalculatorDemo,
} from "./AboutInteractiveWidgets";

export const metadata: Metadata = {
  title: "About Simpleplek | Synced Schedules, Split Payments & Members-Only Stays",
  description:
    "Host with synced calendars, share package payments with other guests, and enjoy exclusive members-only booking with zero platform commission fees.",
  keywords: [
    "About Simpleplek",
    "Host with a synced schedule",
    "Share package payments with other guests",
    "Members only booking",
    "calendar sync ical",
    "split group booking",
    "surf and yoga retreat South Africa",
  ],
  alternates: {
    canonical: "https://simpleplek.com/about",
  },
  openGraph: {
    title: "About Simpleplek | Synced Schedules, Split Payments & Members-Only Booking",
    description:
      "Three reasons to love Simpleplek: Host with a synced schedule, share package payments with other guests, and members-only booking.",
    url: "https://simpleplek.com/about",
    siteName: "Simpleplek",
    locale: "en_ZA",
    type: "website",
  },
};

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Simpleplek",
    description:
      "Simpleplek is built on three core pillars: hosting with a synced schedule, sharing package payments among guests, and curated members-only booking.",
    url: "https://simpleplek.com/about",
  };

  return (
    <div className="min-h-screen w-full bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRightIcon className="size-3.5" aria-hidden="true" />
          <span className="text-foreground">About</span>
        </nav>

        {/* Hero Section */}
        <header className="mt-6 text-center sm:text-left">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            <SparklesIcon className="mr-1.5 size-3" />
            Simpleplek Highlights
          </Badge>

          <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Hospitality,{" "}
            <span className="bg-gradient-to-r from-primary via-teal-500 to-secondary bg-clip-text text-transparent">
              Synced & Shared
            </span>
          </h1>

          <p className="mt-2.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Three simple reasons why hosts, retreat leaders, and traveling groups choose Simpleplek.
          </p>
        </header>

        {/* Big Image Showcase */}
        <section aria-label="Simpleplek Retreat Showcase" className="mt-6">
          <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg">
            <div className="relative aspect-16/9 w-full overflow-hidden">
              <Image
                src="/images/about-hero.jpg"
                alt="Simpleplek oceanfront surf and yoga retreat in Cape Town"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            </div>

            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4 sm:p-6 text-white">
              <div>
                <span className="inline-block rounded-full bg-black/40 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  Llandudno Ocean Shala &bull; Cape Town
                </span>
                <p className="mt-1.5 font-heading text-base font-bold sm:text-xl text-white drop-shadow-sm">
                  Surf, Yoga &amp; Collective Coastal Retreats
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md">
                <CheckCircle2Icon className="size-3.5 text-emerald-400" />
                Live Availability Synced
              </span>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* PILLAR 1: HOST WITH A SYNCED SCHEDULE */}
        {/* ================================================================== */}
        <section id="synced-schedule" className="mt-14 scroll-mt-20">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-5">
              <div className="inline-flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-secondary/15 text-xs font-bold text-secondary">
                  01
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                  Schedule Sync
                </span>
              </div>

              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Host with a Synced Schedule
              </h2>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Connect your Airbnb, VRBO, or Google Calendar iCal feed once. Dates lock
                automatically across every channel—guaranteeing zero double bookings for multi-night
                stays or precision hourly workshop slots.
              </p>

              <ul className="space-y-1.5 pt-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-3.5 text-secondary shrink-0" />
                  <span>Two-way iCal calendar sync with instant clash guard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-3.5 text-secondary shrink-0" />
                  <span>Support for multi-day stays and hourly sessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-3.5 text-secondary shrink-0" />
                  <span>Guests set dates once to view live pricing everywhere</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7">
              <SyncedScheduleDemo />
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* PILLAR 2: SHARE PACKAGE PAYMENTS WITH OTHER GUESTS */}
        {/* ================================================================== */}
        <section id="share-package-payments" className="mt-14 scroll-mt-20">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div className="order-2 lg:order-1 lg:col-span-7">
              <SplitCalculatorDemo />
            </div>

            <div className="order-1 space-y-3 lg:order-2 lg:col-span-5">
              <div className="inline-flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                  02
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Split Payments
                </span>
              </div>

              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Share Package Payments with Other Guests
              </h2>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Send your travel crew a single estimate link. Co-guests join the official stay
                roster, co-pay their share directly, and select personal add-on packages (surf
                gear, yoga, catering)—no awkward payment chasing.
              </p>

              <ul className="space-y-1.5 pt-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-3.5 text-primary shrink-0" />
                  <span>1-Click shareable estimate link for your group</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-3.5 text-primary shrink-0" />
                  <span>Transparent co-pay roster with live join tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-3.5 text-primary shrink-0" />
                  <span>Custom add-on selections per guest</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* PILLAR 3: MEMBERS-ONLY BOOKING */}
        {/* ================================================================== */}
        <section id="members-only-booking" className="mt-14 scroll-mt-20">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                03
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Curated Community
              </span>
            </div>

            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Members-Only Booking
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              We ditched the 15%–20% commission model for an accessible membership (R15/month or
              R150/year) that unlocks live calendars and direct rates for a verified collective.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheckIcon className="size-4" />
              </div>
              <h3 className="font-heading mt-3 text-base font-bold text-foreground">
                R0 Booking Fees
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                No hidden 20% platform markups. Members book stays at direct rates without paying
                inflated booking commissions.
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <div className="flex size-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <LockIcon className="size-4" />
              </div>
              <h3 className="font-heading mt-3 text-base font-bold text-foreground">
                Unlocked Calendars
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Members unlock full real-time calendars and access secret coastal retreats not
                listed on generic public search portals.
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <UsersIcon className="size-4" />
              </div>
              <h3 className="font-heading mt-3 text-base font-bold text-foreground">
                Verified Collective
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Hosts welcome respectful, verified surfers, yogis, and travelers. High trust,
                community values, and mutual respect.
              </p>
            </div>
          </div>
        </section>

        {/* Compact Call to Action */}
        <section aria-label="Call to Action" className="mt-14 mb-8">
          <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-secondary/10 p-6 sm:flex-row sm:p-8 text-center sm:text-left">
            <div>
              <h3 className="font-heading text-lg font-bold text-foreground sm:text-xl">
                Ready to explore Simpleplek?
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Browse available retreats or join our membership to host and book.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Button size="sm" nativeButton={false} render={<Link href="/bookings" />}>
                <CompassIcon className="size-3.5 mr-1" />
                Explore Stays
                <ArrowRightIcon className="size-3.5 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/subscribe" />}
              >
                Become a Member
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
