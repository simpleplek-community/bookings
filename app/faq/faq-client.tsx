"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ChevronDown,
  ShieldCheck,
  Calendar,
  Building2,
  Sparkles,
  Link2,
  Check,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { FAQ_CATEGORIES, FAQ_ITEMS, FaqItem } from "./faq-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Getting Started & Membership": <ShieldCheck className="size-5 text-primary" />,
  "Booking & Availability": <Calendar className="size-5 text-primary" />,
  "Hosting & Property Management": <Building2 className="size-5 text-primary" />,
};

export default function FaqClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    // Default all items to open for immediate visibility and quick scanning
    const initial: Record<string, boolean> = {};
    FAQ_ITEMS.forEach((item) => {
      initial[item.id] = true;
    });
    return initial;
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check URL hash on mount or hashchange to scroll to & expand targeted question
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setOpenItems((prev) => ({ ...prev, [hash]: true }));
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    FAQ_ITEMS.forEach((item) => {
      next[item.id] = true;
    });
    setOpenItems(next);
  };

  const collapseAll = () => {
    setOpenItems({});
  };

  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/faq#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Filter items based on category and query
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!query) return true;

      const inQuestion = item.question.toLowerCase().includes(query);
      const inAnswer = item.answer.toLowerCase().includes(query);
      const inDirect = item.directAnswer.toLowerCase().includes(query);
      const inKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(query));

      return inQuestion || inAnswer || inDirect || inKeywords;
    });
  }, [searchQuery, selectedCategory]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: FaqItem[] } = {};

    FAQ_CATEGORIES.forEach((cat) => {
      groups[cat.title] = [];
    });

    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    return groups;
  }, [filteredItems]);

  const allOpen = Object.values(openItems).filter(Boolean).length === FAQ_ITEMS.length;

  return (
    <div className="w-full">
      {/* Search and Filter Controls */}
      <div className="mb-10 space-y-4">
        {/* Search Bar */}
        <div className="relative mx-auto max-w-2xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground">
            <Search className="size-5" />
          </div>
          <input
            id="faq-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. trial, cancel, packages, host, availability)..."
            className="w-full rounded-2xl border border-border/80 bg-card py-3.5 pl-12 pr-12 text-sm text-foreground shadow-xs transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Search FAQs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear search query"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Category Pills & Bulk Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === "All"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              All Topics ({FAQ_ITEMS.length})
            </button>
            {FAQ_CATEGORIES.map((cat) => {
              const count = FAQ_ITEMS.filter((i) => i.category === cat.title).length;
              const isSelected = selectedCategory === cat.title;
              return (
                <button
                  key={cat.title}
                  onClick={() => setSelectedCategory(cat.title)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  }`}
                >
                  {cat.title} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <button
              onClick={allOpen ? collapseAll : expandAll}
              className="cursor-pointer font-medium text-primary hover:underline"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>
        </div>
      </div>

      {/* Zero State */}
      {filteredItems.length === 0 && (
        <div className="mx-auto my-12 max-w-md rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center backdrop-blur-xs">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <HelpCircle className="size-6" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            No matching questions found
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            We couldn&apos;t find answers matching &ldquo;{searchQuery}&rdquo;. Try another keyword
            or reset the search filters.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              Reset Search
            </Button>
            <Button size="sm" render={<Link href="/subscribe" />}>
              Explore Membership
            </Button>
          </div>
        </div>
      )}

      {/* FAQ Groups */}
      <div className="space-y-12">
        {FAQ_CATEGORIES.map((cat) => {
          const items = groupedItems[cat.title] || [];
          if (items.length === 0) return null;

          return (
            <section
              key={cat.title}
              aria-labelledby={`cat-${cat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="scroll-mt-24 space-y-4"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 border-b border-border/80 pb-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  {CATEGORY_ICONS[cat.title] || <BookOpen className="size-5 text-primary" />}
                </div>
                <div>
                  <h2
                    id={`cat-${cat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className="font-heading text-xl font-bold tracking-tight text-foreground"
                  >
                    {cat.title}
                  </h2>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {cat.description}
                  </p>
                </div>
              </div>

              {/* Accordion List */}
              <div className="space-y-3">
                {items.map((item) => {
                  const isOpen = Boolean(openItems[item.id]);
                  const isCopied = copiedId === item.id;

                  return (
                    <article
                      key={item.id}
                      id={item.id}
                      className={`group rounded-xl border transition-all duration-200 ${
                        isOpen
                          ? "border-primary/40 bg-card shadow-xs ring-1 ring-primary/20"
                          : "border-border/80 bg-card/60 hover:border-border hover:bg-card"
                      }`}
                    >
                      {/* Question Toggle Header */}
                      <button
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        aria-expanded={isOpen}
                        aria-controls={`answer-${item.id}`}
                        className="flex w-full items-start justify-between gap-4 p-4 text-left sm:p-5"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className={`mt-1 size-2 shrink-0 rounded-full transition-colors ${
                              isOpen ? "bg-primary" : "bg-muted-foreground/30 group-hover:bg-primary/50"
                            }`}
                          />
                          <h3 className="font-heading text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg">
                            {item.question}
                          </h3>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                          {/* Copy Link Button */}
                          <span
                            role="button"
                            tabIndex={0}
                            title="Copy link to this answer"
                            onClick={(e) => handleCopyLink(item.id, e)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handleCopyLink(item.id, e as unknown as React.MouseEvent);
                              }
                            }}
                            className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Copy permanent link for ${item.question}`}
                          >
                            {isCopied ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Link2 className="size-3.5 opacity-60 group-hover:opacity-100" />
                            )}
                          </span>

                          <span
                            className={`inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-transform duration-200 ${
                              isOpen ? "rotate-180 text-primary" : ""
                            }`}
                            aria-hidden="true"
                          >
                            <ChevronDown className="size-4" />
                          </span>
                        </div>
                      </button>

                      {/* Answer Body */}
                      {isOpen && (
                        <div
                          id={`answer-${item.id}`}
                          className="border-t border-border/50 px-4 pb-5 pt-4 text-sm sm:px-5 sm:text-base"
                        >
                          {/* Direct Answer Box for Answer Engine Optimization (AEO) */}
                          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-sm text-foreground">
                            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                              <Sparkles className="size-3.5" />
                              <span>Key Takeaway</span>
                            </div>
                            <p className="leading-relaxed font-medium text-foreground">
                              {item.directAnswer}
                            </p>
                          </div>

                          {/* Full Context Answer */}
                          <p className="leading-relaxed text-muted-foreground">
                            {item.answer}
                          </p>

                          {/* Contextual Action Link */}
                          {item.actionUrl && item.actionText && (
                            <div className="mt-4 flex items-center pt-2">
                              <Link
                                href={item.actionUrl}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-85"
                              >
                                <span>{item.actionText}</span>
                                <ArrowRight className="size-3.5" />
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Google Preferred Source (AEO & AI Search Personalization) */}
      <section className="mt-14 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="size-3.5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Google Search & AI Overviews
              </span>
            </div>
            <h3 className="font-heading text-base font-bold text-foreground sm:text-lg">
              Set Simpleplek as a Preferred Source
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Add Simpleplek to your Google preferences to see our live availability, verified host
              answers, and accommodation packages prioritized with a &ldquo;Preferred&rdquo; badge in Google
              AI Overviews.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {/* Google's official Preferred Source button container */}
            <div
              {...({ "google-add-preferred-source-btn": "" } as Record<string, unknown>)}
              data-theme="light"
              className="flex min-h-[40px] items-center"
            >
              {/* Fallback button in case script hasn't rendered or is blocked */}
              <a
                href="https://www.google.com/preferences/source?q=simpleplek.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-xs transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Add on Google</span>
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            </div>
            <span className="text-[11px] text-muted-foreground/80">
              Personalizes your Google AI answers
            </span>
          </div>
        </div>
      </section>

      {/* Bottom Help and Support Card */}
      <section className="mt-8 rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                Need More Information?
              </Badge>
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground sm:text-xl">
              Can&apos;t find the answer you&apos;re looking for?
            </h3>
            <p className="max-w-xl text-sm text-muted-foreground">
              Our team and community are here to help you get the most out of your Simpleplek
              stays, subscription packages, and property listings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" render={<Link href="/bookings" />}>
              Browse Properties
            </Button>
            <Button size="sm" render={<Link href="/subscribe" />}>
              Become a Pro Member
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
