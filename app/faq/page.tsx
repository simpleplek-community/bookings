import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "./faq-data";
import FaqClient from "./faq-client";
import { HelpCircle, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | Simpleplek",
  description:
    "Find direct answers about Simpleplek memberships, free trial terms, live availability calendars, booking cancellations, and hosting property packages.",
  keywords: [
    "Simpleplek FAQ",
    "Simpleplek membership free trial",
    "why subscribe to Simpleplek",
    "Simpleplek booking availability calendar",
    "Simpleplek cancellation and refund policy",
    "become a host Simpleplek",
    "Simpleplek property packages",
    "AEO Simpleplek answers",
  ],
  alternates: {
    canonical: "https://simpleplek.com/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions (FAQ) | Simpleplek",
    description:
      "Instant answers to key questions on Simpleplek membership, bookings, availability calendars, and host package management.",
    url: "https://simpleplek.com/faq",
    siteName: "Simpleplek",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions (FAQ) | Simpleplek",
    description:
      "Instant answers to key questions on Simpleplek membership, bookings, availability calendars, and host package management.",
  },
};

export default function FaqPage() {
  // Construct JSON-LD Structured Data for FAQPage and Breadcrumbs (AEO & SEO standard)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: "Simpleplek Frequently Asked Questions",
    description:
      "Frequently asked questions and direct answers concerning Simpleplek memberships, booking availability, cancellation policies, and hosting packages.",
    url: "https://simpleplek.com/faq",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://simpleplek.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: "https://simpleplek.com/faq",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background py-10 sm:py-16">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Google Preferred Sources Script */}
      <Script
        src="https://news.google.com/swg/js/v1/publisher.js"
        strategy="afterInteractive"
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <span className="font-medium text-foreground">FAQ</span>
        </nav>

        {/* Page Header */}
        <header className="mb-10 text-center sm:mb-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            <span>Answer Engine Optimized Knowledge Base</span>
          </div>

          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Quick, reliable answers regarding Simpleplek memberships, live availability
            calendars, cancellation rules, and property hosting packages.
          </p>

          {/* Quick Category Anchors */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
            {FAQ_CATEGORIES.map((cat) => {
              const anchor = `cat-${cat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
              return (
                <a
                  key={cat.title}
                  href={`#${anchor}`}
                  className="rounded-full border border-border bg-card px-3 py-1 font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {cat.title}
                </a>
              );
            })}
          </div>
        </header>

        {/* Interactive FAQ Client (Live Filter, Accordions, Deep-linking, Copy Link) */}
        <FaqClient />

        {/* Crawlable Semantic Fallback for Non-JS / Simple Bot Crawlers */}
        <noscript>
          <div className="mt-12 space-y-8 border-t pt-8">
            <h2 className="text-xl font-bold">All Questions and Answers (Text Archive)</h2>
            {FAQ_ITEMS.map((item) => (
              <details key={item.id} id={`archive-${item.id}`} className="rounded-lg border p-4">
                <summary className="font-semibold text-foreground cursor-pointer">
                  {item.question}
                </summary>
                <div className="mt-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">
                    Key takeaway: {item.directAnswer}
                  </p>
                  <p>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </noscript>
      </div>
    </div>
  );
}
