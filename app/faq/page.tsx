"use client";

import Link from "next/link";
import { Search, Sparkles, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const topics = [
  { id: "membership", label: "Getting Started & Membership" },
  { id: "booking", label: "Booking & Availability" },
  { id: "hosting", label: "Hosting & Property Management" },
] as const;

const sections = [
  {
    id: "membership",
    title: "Getting Started & Membership",
    description: "Trial benefits, subscription savings, and member privileges on Simpleplek.",
    items: [
      {
        question: "How do I try Simpleplek?",
        takeaway: "Simpleplek offers flexible membership plans at R15 per month or R150 per year, while select properties can be booked for free without a membership.",
        answer: "Join with a monthly or annual subscription to unlock full platform access and member pricing. Alternatively, browse and book select non-member properties by creating a free account.",
        link: "/subscribe",
        linkLabel: "Choose a Membership Plan",
      },
      {
        question: "Why do I need a subscription?",
        takeaway: "A Simpleplek subscription saves you money by eliminating standard booking fees and unlocks exclusive member-only properties.",
        answer: "An active subscription also gives you access to in-house purchases during your stay and the full range of member benefits.",
        link: "/subscribe",
        linkLabel: "View Membership Plans",
      },
    ],
  },
  {
    id: "booking",
    title: "Booking & Availability",
    description: "Live calendars, booking policies, cancellations, and account requirements.",
    items: [
      {
        question: "How do I see property availability?",
        takeaway: "Active subscribers gain access to live availability calendars on property listings, while select non-member properties can be booked with a free account.",
        answer: "Subscribe to unlock calendars across the platform. Select properties are available to non-members once you have created a free account.",
        link: "/bookings",
        linkLabel: "Explore Properties",
      },
      {
        question: "What is your cancellation and refund policy?",
        takeaway: "Individual cancellation and refund policies are detailed in each booking confirmation email.",
        answer: "If you booked a Pro Package stay, your subscription must remain active until your stay to maintain package benefits.",
        link: "/terms",
        linkLabel: "Read Terms & Cancellation Rules",
      },
    ],
  },
  {
    id: "hosting",
    title: "Hosting & Property Management",
    description: "Becoming a host, managing packages, and customizing property listings.",
    items: [
      {
        question: "How do I become a host?",
        takeaway: "Subscribe as a Pro Member to unlock the tools to list and manage your properties directly on Simpleplek.",
        answer: "Once subscribed, you can list your property directly on the platform and manage its guest-facing details.",
        link: "/subscribe",
        linkLabel: "Become a Pro Host",
      },
      {
        question: "How do property packages work?",
        takeaway: "Packages let hosts configure listings with a Standard or Pro base package and attach customizable add-ons.",
        answer: "Assign your property a base package, then add specific options to enhance the offer for guests.",
        link: "/subscribe",
        linkLabel: "Learn About Packages",
      },
      {
        question: "How do I add a package to my listing?",
        takeaway: "Manage packages through your dashboard by selecting a property and configuring its listing settings.",
        answer: "Go to Dashboard > Listings, select your property, and add the desired package options under the listing settings.",
        link: "/admin/properties",
        linkLabel: "Go to Listings Dashboard",
      },
      {
        question: "How do I buy off-plan into a Share Block or fractional property?",
        takeaway: "Make a standard booking and select the Pro Plan add-on package to pay monthly contributions toward long-term equity.",
        answer: "Your monthly payment covers operational costs and capital contributions toward acquiring your share. You can also select an add-on to call or host a member meeting during your booking dates.",
        link: "/terms",
        linkLabel: "Read Share Block Terms",
      },
    ],
  },
] as const;

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("all");
  const [openItems, setOpenItems] = useState<string[]>(["membership-0"]);

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sections
      .filter((section) => activeTopic === "all" || section.id === activeTopic)
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          !normalizedQuery || `${item.question} ${item.takeaway} ${item.answer}`.toLowerCase().includes(normalizedQuery),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [activeTopic, query]);

  const allItemIds = sections.flatMap((section) => section.items.map((_, index) => `${section.id}-${index}`));
  const toggleAll = () => setOpenItems(openItems.length === allItemIds.length ? [] : allItemIds);

  return (
    <div className="min-h-full bg-[#f7fbfa] text-[#102c2b] dark:bg-background dark:text-foreground">
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
        <nav aria-label="Breadcrumb" className="mb-14 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-primary">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">FAQ</span>
        </nav>

        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-teal-700 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300">
            <Sparkles data-icon="inline-start" /> Answer Engine Optimized Knowledge Base
          </Badge>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Frequently Asked Questions</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Quick, reliable answers regarding Simpleplek memberships, live availability calendars, cancellation rules, and property hosting packages.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2">
            {topics.map((topic) => (
              <a key={topic.id} href={`#${topic.id}`} className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                {topic.label}
              </a>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-3xl" aria-label="FAQ search and filters">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions (e.g. trial, cancel, packages, host, availability)..." aria-label="Search FAQs" className="h-14 rounded-2xl border-border bg-background pl-12 shadow-sm" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm" variant={activeTopic === "all" ? "default" : "secondary"} onClick={() => setActiveTopic("all")} className="rounded-full">All Topics ({sections.reduce((count, section) => count + section.items.length, 0)})</Button>
            {topics.map((topic) => {
              const count = sections.find((section) => section.id === topic.id)?.items.length ?? 0;
              return <Button key={topic.id} size="sm" variant={activeTopic === topic.id ? "default" : "secondary"} onClick={() => setActiveTopic(topic.id)} className="rounded-full">{topic.label} ({count})</Button>;
            })}
            <Button variant="link" size="sm" onClick={toggleAll} className="ml-auto">{openItems.length === allItemIds.length ? "Collapse all" : "Expand all"}</Button>
          </div>
        </section>

        <div className="mx-auto mt-12 max-w-3xl space-y-12">
          {filteredSections.length === 0 ? <p className="rounded-2xl border bg-background p-8 text-center text-muted-foreground">No questions match your search.</p> : filteredSections.map((section) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}>
              <div className="mb-4 flex items-start gap-3 border-b pb-4">
                <div className="mt-1 rounded-xl bg-teal-50 p-2 text-teal-600 dark:bg-teal-950 dark:text-teal-300"><ShieldCheck aria-hidden="true" /></div>
                <div><h2 id={`${section.id}-heading`} className="text-xl font-semibold tracking-tight">{section.title}</h2><p className="mt-1 text-sm text-muted-foreground">{section.description}</p></div>
              </div>
              <Accordion multiple value={openItems} onValueChange={setOpenItems}>
                {section.items.map((item, index) => { const itemId = `${section.id}-${index}`; return <AccordionItem key={itemId} value={itemId} className="border-b border-border/70 py-1"><AccordionTrigger className="py-4 text-base hover:no-underline">{item.question}</AccordionTrigger><AccordionContent className="pb-5 text-muted-foreground"><p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-600">Key takeaway</p><p className="text-sm leading-6 text-foreground/80">{item.takeaway}</p><p className="mt-3 text-sm leading-6">{item.answer}</p><Link href={item.link} className="mt-4 inline-flex text-sm font-semibold text-teal-700 underline-offset-4 hover:underline dark:text-teal-300">{item.linkLabel} <span aria-hidden="true" className="ml-1">→</span></Link></AccordionContent></AccordionItem>; })}
              </Accordion>
            </section>
          ))}
        </div>

        <section className="mx-auto mt-20 max-w-3xl rounded-3xl border bg-background p-8 text-center sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Need more information?</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Can&apos;t find the answer you&apos;re looking for?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Browse our properties or become a Pro Member to get the most out of your Simpleplek stays and listings.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/bookings" className={buttonVariants()}>Browse Properties</Link><Link href="/subscribe" className={buttonVariants({ variant: "outline" })}>Become a Pro Member</Link></div>
        </section>
      </main>
    </div>
  );
}
