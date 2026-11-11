import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  CalendarCheck2Icon,
  CheckCircle2Icon,
  CompassIcon,
  HeartHandshakeIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SyncedScheduleDemo,
  SplitCalculatorDemo,
} from "./AboutInteractiveWidgets";

export const metadata: Metadata = {
  title: "About Simpleplek | Better stays, shared simply",
  description:
    "Discover Simpleplek: coastal stays with synced availability, easy group payments and a low-cost membership built around a more connected way to travel.",
  keywords: [
    "About Simpleplek",
    "South Africa coastal stays",
    "synced accommodation calendar",
    "group stay payments",
    "members-only accommodation",
    "surf and yoga retreat South Africa",
  ],
  alternates: {
    canonical: "https://simpleplek.co.za/about",
  },
  openGraph: {
    title: "About Simpleplek | Better stays, shared simply",
    description:
      "A more connected way to find, host and share remarkable coastal stays.",
    url: "https://simpleplek.co.za/about",
    siteName: "Simpleplek",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "https://simpleplek.co.za/images/about-hero.jpg",
        width: 1600,
        height: 900,
        alt: "A coastal retreat in Cape Town, with surfboards and a group practising yoga by the ocean",
      },
    ],
  },
};

const chapters = [
  { number: "01", label: "Stay in sync", href: "#stay-in-sync" },
  { number: "02", label: "Go together", href: "#go-together" },
  { number: "03", label: "Belong here", href: "#belong-here" },
];

export default function AboutPage() {
  return (
    <div className="w-full bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
      <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-14 lg:px-12">
        <header className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-sm">
            A little more room to belong
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl font-heading text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            Good places bring
            <br className="hidden sm:block" />
            <span className="text-primary">good people together.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Simpleplek makes it easier to find a place that feels right, bring your people along,
            and spend less time sorting out the details.
          </p>
          <Link
            href="#our-way"
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            See how it works
            <ArrowDownIcon className="size-4" aria-hidden="true" />
          </Link>
        </header>

        <section aria-label="A coastal retreat in Cape Town" className="mt-10 sm:mt-14">
          <div className="group relative isolate overflow-hidden rounded-[1.75rem] bg-foreground shadow-xl sm:rounded-[2rem]">
            <div className="relative aspect-[4/3] sm:aspect-[2.15/1]">
              <Image
                src="/images/about-hero.jpg"
                alt="A group enjoying surf and yoga at a coastal retreat in Cape Town"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-5 text-white sm:flex-row sm:items-end sm:justify-between sm:p-9 lg:p-11">
              <div>
                <span className="inline-flex rounded-full border border-white/30 bg-black/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  Llandudno · Cape Town
                </span>
                <p className="mt-3 max-w-2xl font-heading text-2xl font-medium leading-tight tracking-tight sm:text-4xl">
                  Make space for the kind of time you remember.
                </p>
              </div>
              <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3.5 py-2 text-xs font-medium backdrop-blur-sm">
                <span className="size-2 rounded-full bg-emerald-300" />
                A stay for your whole crew
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <span>Surf, yoga and coastal stays—made to be shared.</span>
            <span>Thoughtfully simple, from first click to check-in.</span>
          </div>
        </section>

        <section id="our-way" className="scroll-mt-24 pt-20 sm:pt-28">
          <div className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                The Simpleplek way
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                Three small things. A better kind of stay.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
              Less friction for the people hosting, more ease for the people travelling.
            </p>
          </div>
          <nav aria-label="About Simpleplek" className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {chapters.map((chapter) => (
              <a
                key={chapter.number}
                href={chapter.href}
                className="group flex items-center justify-between gap-4 py-5 transition-colors hover:text-primary sm:px-6 sm:py-6 first:sm:pl-0 last:sm:pr-0"
              >
                <span className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted-foreground">{chapter.number}</span>
                  <span className="font-medium">{chapter.label}</span>
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
              </a>
            ))}
          </nav>
        </section>

        <section id="stay-in-sync" className="scroll-mt-24 border-t border-border py-16 sm:py-24">
          <div className="grid items-center gap-9 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">01 · Stay in sync</p>
              <h2 className="mt-4 max-w-lg font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                One calendar. Everyone on the same page.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
                Connect an Airbnb or Google Calendar iCal feed once. Dates update across your
                channels, so hosts can welcome guests without worrying about double bookings.
              </p>
              <ul className="mt-6 flex flex-col gap-3 text-sm text-foreground/85">
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  Two-way iCal sync with a built-in clash guard
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  Room for multi-night stays and hourly sessions
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  Guests see live availability for their dates
                </li>
              </ul>
            </div>
            <SyncedScheduleDemo />
          </div>
        </section>

        <section id="go-together" className="scroll-mt-24 border-t border-border py-16 sm:py-24">
          <div className="grid items-center gap-9 lg:grid-cols-[1.18fr_0.82fr] lg:gap-16">
            <div className="order-2 min-w-0 lg:order-1">
              <SplitCalculatorDemo />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">02 · Go together</p>
              <h2 className="mt-4 max-w-lg font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Share the plan, not the payment stress.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
                Send your group one estimate link. Everyone can join the stay, pay their share and
                choose the extras they actually want—without one person chasing the rest.
              </p>
              <ul className="mt-6 flex flex-col gap-3 text-sm text-foreground/85">
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  A single link for your whole group
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  Clear co-pay amounts for every guest
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  Personalise the stay with optional add-ons
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="belong-here" className="scroll-mt-24 border-t border-border py-16 sm:py-24">
          <div className="overflow-hidden rounded-[1.75rem] bg-foreground text-background sm:rounded-[2rem]">
            <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:p-14">
              <div className="flex flex-col items-start">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">03 · Belong here</p>
                <h2 className="mt-4 max-w-md font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  A more welcoming way to book.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-6 text-background/75 sm:text-base sm:leading-7">
                  Simpleplek is for people who care about where they stay—and who they share it
                  with. Membership keeps booking direct, calendars open and the community connected.
                </p>
                <div className="mt-7 rounded-2xl border border-background/15 bg-background/5 px-5 py-4">
                  <p className="text-xs uppercase tracking-wider text-background/65">Membership</p>
                  <p className="mt-1 font-heading text-2xl font-semibold">
                    R15 <span className="text-sm font-normal text-background/70">/ month</span>
                  </p>
                  <p className="mt-1 text-sm text-background/70">or R150 per year</p>
                </div>
                <Button
                  nativeButton={false}
                  render={<Link href="/subscribe" />}
                  className="mt-6 rounded-full px-5"
                >
                  Find your place
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
                <article className="rounded-2xl border border-background/15 bg-background/5 p-5 sm:p-6">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <ShieldCheckIcon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-semibold">No booking fees</h3>
                  <p className="mt-2 text-sm leading-6 text-background/70">
                    Skip the platform markups. Members book stays at the host&apos;s direct rate.
                  </p>
                </article>
                <article className="rounded-2xl border border-background/15 bg-background/5 p-5 sm:p-6">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <CalendarCheck2Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-semibold">Open calendars</h3>
                  <p className="mt-2 text-sm leading-6 text-background/70">
                    See live availability and discover coastal stays beyond the usual portals.
                  </p>
                </article>
                <article className="rounded-2xl border border-background/15 bg-background/5 p-5 sm:p-6">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <HeartHandshakeIcon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-semibold">A trusted circle</h3>
                  <p className="mt-2 text-sm leading-6 text-background/70">
                    A community of considerate hosts, surfers, yogis and curious travellers.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Explore Simpleplek" className="pb-5 pt-3 sm:pb-8">
          <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CompassIcon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                  Your next good place is out there.
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Explore distinctive stays or join the Simpleplek community.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 sm:shrink-0">
              <Button nativeButton={false} render={<Link href="/bookings" />} className="rounded-full px-5">
                Explore stays
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/subscribe" />}
                className="rounded-full px-5"
              >
                Become a member
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
