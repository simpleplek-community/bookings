"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Search, Sparkles } from "lucide-react";
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
import { cn } from "@/lib/utils";

const sections = [
  {
    id: "membership",
    title: "Getting Started & Membership",
    description: "Trial benefits, subscription savings, and member privileges on Simpleplek.",
    items: [
      { question: "How do I try Simpleplek?", takeaway: "Simpleplek offers flexible membership plans at R15 per month or R150 per year, while select properties can be booked for free without a membership.", answer: "Join with a monthly or annual subscription to unlock full platform access and member pricing. Alternatively, browse and book select non-member properties by creating a free account.", href: "/subscribe", label: "Choose a Membership Plan" },
      { question: "Why do I need a subscription?", takeaway: "A Simpleplek subscription saves you money by eliminating standard booking fees and unlocks exclusive member-only properties.", answer: "An active subscription also gives you access to in-house purchases during your stay and the full range of member benefits.", href: "/subscribe", label: "View Membership Plans" },
    ],
  },
  {
    id: "booking",
    title: "Booking & Availability",
    description: "Live calendars, booking policies, cancellations, and account requirements.",
    items: [
      { question: "How do I see property availability?", takeaway: "Active subscribers gain access to live availability calendars on property listings, while select non-member properties can be booked with a free account.", answer: "Subscribe to unlock calendars across the platform. Select properties are available to non-members once you have created a free account.", href: "/bookings", label: "Explore Properties" },
      { question: "What is your cancellation and refund policy?", takeaway: "Individual cancellation and refund policies are detailed in each booking confirmation email.", answer: "If you booked a Pro Package stay, your subscription must remain active until your stay to maintain package benefits.", href: "/terms", label: "Read Terms & Cancellation Rules" },
    ],
  },
  {
    id: "hosting",
    title: "Hosting & Property Management",
    description: "Becoming a host, managing packages, and customizing property listings.",
    items: [
      { question: "How do I become a host?", takeaway: "Subscribe as a Pro Member to unlock the tools to list and manage your properties directly on Simpleplek.", answer: "Once subscribed, you can list your property directly on the platform and manage its guest-facing details.", href: "/subscribe", label: "Become a Pro Host" },
      { question: "How do property packages work?", takeaway: "Packages let hosts configure listings with a Standard or Pro base package and attach customizable add-ons.", answer: "Assign your property a base package, then add specific options to enhance the offer for guests.", href: "/subscribe", label: "Learn About Packages" },
      { question: "How do I add a package to my listing?", takeaway: "Manage packages through your dashboard by selecting a property and configuring its listing settings.", answer: "Go to Dashboard > Listings, select your property, and add the desired package options under the listing settings.", href: "/admin/properties", label: "Go to Listings Dashboard" },
      { question: "How do I buy off-plan into a Share Block or fractional property?", takeaway: "Make a standard booking and select the Pro Plan add-on package to pay monthly contributions toward long-term equity.", answer: "Your monthly payment covers operational costs and capital contributions toward acquiring your share. You can also select an add-on to call or host a member meeting during your booking dates.", href: "/terms", label: "Read Share Block Terms" },
    ],
  },
] as const;

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState("all");
  const [openItems, setOpenItems] = useState<string[]>([]);
  const total = sections.reduce((count, section) => count + section.items.length, 0);
  const allIds = sections.flatMap((section) => section.items.map((_, index) => `${section.id}-${index}`));
  const filteredSections = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sections.filter((section) => activeTopic === "all" || section.id === activeTopic).map((section) => ({
      ...section,
      items: section.items.filter((item) => !term || `${item.question} ${item.takeaway} ${item.answer}`.toLowerCase().includes(term)),
    })).filter((section) => section.items.length > 0);
  }, [activeTopic, query]);
  const anyOpen = openItems.some((id) => allIds.includes(id));

  return (
    <main className="min-h-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-6 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <ChevronRight aria-hidden="true" className="size-3.5" />
          <span className="text-foreground">FAQ</span>
        </nav>

        <header className="mt-10">
          <Badge variant="outline"><Sparkles data-icon="inline-start" /> Answer Engine Optimized Knowledge Base</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Frequently Asked Questions</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Quick, reliable answers regarding Simpleplek memberships, live availability calendars, cancellation rules, and property hosting packages.</p>
        </header>

        <section aria-label="FAQ search and filters" className="mt-8 flex flex-col gap-3">
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions (e.g. trial, cancel, packages, host, availability)..." aria-label="Search FAQs" className="pl-9" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
              <Button size="sm" variant={activeTopic === "all" ? "default" : "outline"} aria-pressed={activeTopic === "all"} onClick={() => setActiveTopic("all")}>All Topics <span className={cn("tabular-nums", activeTopic === "all" ? "text-primary-foreground/70" : "text-muted-foreground")}>{total}</span></Button>
              {sections.map((section) => <Button key={section.id} size="sm" variant={activeTopic === section.id ? "default" : "outline"} aria-pressed={activeTopic === section.id} onClick={() => setActiveTopic(section.id)}>{section.title} <span className={cn("tabular-nums", activeTopic === section.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{section.items.length}</span></Button>)}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setOpenItems(anyOpen ? [] : allIds)} disabled={filteredSections.length === 0}>{anyOpen ? "Collapse all" : "Expand all"}</Button>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-10">
          {filteredSections.length === 0 ? <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-12 text-center"><Search className="size-5 text-muted-foreground" aria-hidden="true" /><p className="text-sm font-medium">No questions match “{query}”</p><Button size="sm" variant="outline" onClick={() => { setQuery(""); setActiveTopic("all"); }}>Clear search</Button></div> : filteredSections.map((section) => <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`}><div className="mb-3 border-b pb-3"><h2 id={`${section.id}-heading`} className="text-lg font-semibold tracking-tight">{section.title}</h2><p className="mt-1 text-sm text-muted-foreground">{section.description}</p></div><Accordion multiple value={openItems} onValueChange={setOpenItems}>{section.items.map((item, index) => { const id = `${section.id}-${index}`; return <AccordionItem key={id} value={id}><AccordionTrigger className="py-4 text-base hover:no-underline">{item.question}</AccordionTrigger><AccordionContent className="pb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Key takeaway</p><p className="mt-2 text-sm leading-6">{item.takeaway}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p><Link href={item.href} className="mt-4 inline-flex items-center text-sm font-semibold text-primary underline-offset-4 hover:underline">{item.label}<ArrowRight data-icon="inline-end" /></Link></AccordionContent></AccordionItem>; })}</Accordion></section>)}
        </div>

        <section className="mt-12 flex flex-col gap-6 rounded-lg bg-muted p-6 md:flex-row md:items-center md:justify-between"><div className="max-w-lg"><p className="text-xs font-medium text-muted-foreground">Need More Information?</p><h2 className="mt-2 text-lg font-semibold tracking-tight">Can&apos;t find the answer you&apos;re looking for?</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Browse our properties or become a Pro Member to get the most out of your Simpleplek stays and listings.</p></div><div className="flex shrink-0 gap-2"><Link href="/bookings" className={buttonVariants({ variant: "outline" })}>Browse Properties</Link><Link href="/subscribe" className={buttonVariants()}>Become a Pro Member<ArrowRight data-icon="inline-end" /></Link></div></section>
      </div>
    </main>
  );
}
