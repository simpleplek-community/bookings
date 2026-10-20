import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { FAQ_CATEGORIES, FAQ_ITEMS } from "./faq-data";
import FaqClient from "./faq-client";
import { ChevronRightIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | Simpleplek",
  description:
    "Find direct answers about Simpleplek memberships, subscription pricing, live availability calendars, booking cancellations, and hosting property packages.",
  keywords: [
    "Simpleplek FAQ",
    "Simpleplek membership pricing",
    "R15 monthly subscription",
    "R150 annual subscription",
    "why subscribe to Simpleplek",
    "Simpleplek booking availability calendar",
    "Simpleplek cancellation and refund policy",
    "become a host Simpleplek",
    "Simpleplek property packages",
    "share block fractional property off-plan",
    "alienation of land act 5 year installment",
    "ALA off-plan sectional title",
    "Section 20 deeds office recordal",
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
      "Frequently asked questions and direct answers concerning Simpleplek memberships, booking availability, cancellation policies, hosting packages, and Share Block properties.",
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
    <div className="min-h-screen w-full bg-background font-sans text-foreground antialiased">
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

      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link href="/" className="transition-colors duration-150 hover:text-foreground">
            Home
          </Link>
          <ChevronRightIcon className="size-3.5" aria-hidden="true" />
          <span className="text-foreground">FAQ</span>
        </nav>

        {/* Page Header */}
        <header className="mt-8">
          <Badge variant="outline" className="gap-1.5 text-xs font-medium border-border">
            <SparklesIcon className="size-3.5 text-primary" aria-hidden="true" />
            <span>Answer Engine Optimized Knowledge Base</span>
          </Badge>
          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Quick, reliable answers regarding Simpleplek memberships, live availability
            calendars, cancellation rules, and property hosting packages.
          </p>
        </header>

        {/* Interactive FAQ Client (Live Filter, Framer Motion Accordions, Deep-linking, Copy Link) */}
        <FaqClient />

        {/* Crawlable Semantic Fallback for Non-JS / Simple Bot Crawlers */}
        <noscript>
          <div className="mt-12 space-y-6 border-t border-border pt-8">
            <h2 className="text-xl font-bold">All Questions and Answers (Text Archive)</h2>
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.id}
                id={`archive-${item.id}`}
                className="rounded-lg border border-border p-4 bg-card"
              >
                <summary className="font-semibold text-foreground cursor-pointer">
                  {item.question}
                </summary>
                <div className="mt-3 text-sm text-muted-foreground space-y-2">
                  <p className="font-medium text-foreground">
                    Key takeaway: {item.directAnswer}
                  </p>
                  <p>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </noscript>
      </main>
    </div>
  );
}
