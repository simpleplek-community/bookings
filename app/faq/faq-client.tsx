"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  Link2Icon,
  CheckIcon,
  SearchIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CalendarIcon,
  Building2Icon,
  HelpCircleIcon,
} from "lucide-react";
import { FAQ_CATEGORIES, FAQ_ITEMS, FaqItem, FaqCategory } from "./faq-data";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "./google-icon";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Getting Started & Membership": ShieldCheckIcon,
  "Booking & Availability": CalendarIcon,
  "Hosting & Property Management": Building2Icon,
};

function FaqAccordionItem({
  item,
  open,
  onToggle,
  copied,
  onCopy,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
  copied: boolean;
  onCopy: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const answerId = `answer-${item.id}`;

  return (
    <article id={item.id} className="border-b border-border/80 last:border-b-0">
      <h3 className="flex items-center gap-2 pr-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={answerId}
          onClick={onToggle}
          className="flex flex-1 items-center justify-between gap-4 rounded-md px-5 py-4 text-left text-[15px] font-medium text-foreground transition-colors duration-150 hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span>{item.question}</span>
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180 text-primary"
            )}
          />
        </button>

        <Button
          variant="ghost"
          size="icon"
          title={copied ? "Link copied!" : "Copy link to this answer"}
          aria-label={`Copy permanent link for ${item.question}`}
          onClick={onCopy}
          className={cn(
            "size-8 text-muted-foreground transition-colors hover:text-foreground",
            copied && "text-emerald-500 hover:text-emerald-600"
          )}
        >
          {copied ? (
            <CheckIcon className="size-3.5 text-emerald-500" />
          ) : (
            <Link2Icon className="size-3.5" />
          )}
        </Button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={answerId}
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-5 pb-5 pt-1">
              {/* Highlighted Key Takeaway box for AEO */}
              <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <SparklesIcon className="size-3.5" aria-hidden="true" />
                  Key Takeaway
                </div>
                <p className="text-sm font-medium leading-6 text-foreground">
                  {item.directAnswer}
                </p>
              </div>

              {/* Full Answer Context */}
              <p className="text-sm leading-6 text-muted-foreground">{item.answer}</p>

              {/* Action Button */}
              {item.actionUrl && item.actionText && (
                <div className="pt-1">
                  <Link
                    href={item.actionUrl}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                  >
                    <span>{item.actionText}</span>
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

function FaqCategorySection({
  category,
  items,
  openIds,
  onToggle,
  copiedId,
  onCopy,
}: {
  category: FaqCategory;
  items: FaqItem[];
  openIds: Set<string>;
  onToggle: (id: string) => void;
  copiedId: string | null;
  onCopy: (id: string) => void;
}) {
  const Icon = CATEGORY_ICONS[category.title] || ShieldCheckIcon;
  const categoryAnchor = `cat-${category.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section aria-labelledby={categoryAnchor} className="scroll-mt-8">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary shadow-xs">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div>
          <h2
            id={categoryAnchor}
            className="font-heading text-lg font-semibold tracking-tight text-foreground"
          >
            {category.title}
          </h2>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>
      </div>

      <Card className="divide-y divide-border/80 overflow-hidden shadow-xs">
        {items.map((item) => (
          <FaqAccordionItem
            key={item.id}
            item={item}
            open={openIds.has(item.id)}
            onToggle={() => onToggle(item.id)}
            copied={copiedId === item.id}
            onCopy={() => onCopy(item.id)}
          />
        ))}
      </Card>
    </section>
  );
}

export default function FaqClient() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(FAQ_ITEMS.map((item) => item.id))
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deep linking: check URL hash on mount or hashchange
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setOpenIds((prev) => new Set([...prev, hash]));
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

  const handleCopyLink = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const total = FAQ_ITEMS.length;
  const q = query.trim().toLowerCase();

  // Filter categories and items
  const visible = useMemo(
    () =>
      FAQ_CATEGORIES.filter((c) => !activeCategory || c.title === activeCategory)
        .map((c) => ({
          category: c,
          items: FAQ_ITEMS.filter((i) => {
            if (i.category !== c.title) return false;
            if (!q) return true;
            return (
              i.question.toLowerCase().includes(q) ||
              i.directAnswer.toLowerCase().includes(q) ||
              i.answer.toLowerCase().includes(q) ||
              i.keywords.some((k) => k.toLowerCase().includes(q))
            );
          }),
        }))
        .filter((g) => g.items.length > 0),
    [activeCategory, q]
  );

  const anyOpen = visible.some((g) => g.items.some((i) => openIds.has(i.id)));

  const toggleAll = () => {
    if (anyOpen) {
      setOpenIds(new Set());
    } else {
      setOpenIds(new Set(visible.flatMap((g) => g.items.map((i) => i.id))));
    }
  };

  const filters = [
    { id: null, label: "All Topics", count: total },
    ...FAQ_CATEGORIES.map((c) => ({
      id: c.title,
      label: c.title,
      count: FAQ_ITEMS.filter((i) => i.category === c.title).length,
    })),
  ];

  return (
    <div className="w-full">
      {/* Search Bar & Filter Button Controls */}
      <div className="mt-8 space-y-3">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="faq-search-input"
            type="search"
            placeholder="Search questions (e.g. R15, share block, availability, host, packages)..."
            aria-label="Search FAQs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-card text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
            {filters.map((f) => {
              const active = activeCategory === f.id;
              return (
                <Button
                  key={f.label}
                  size="sm"
                  variant={active ? "default" : "outline"}
                  aria-pressed={active}
                  onClick={() => setActiveCategory(f.id)}
                  className="rounded-md"
                >
                  {f.label}
                  <span
                    className={cn(
                      "ml-1.5 tabular-nums text-xs",
                      active ? "text-primary-foreground/80 font-semibold" : "text-muted-foreground"
                    )}
                  >
                    {f.count}
                  </span>
                </Button>
              );
            })}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleAll}
            disabled={visible.length === 0}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {anyOpen ? "Collapse all" : "Expand all"}
          </Button>
        </div>
      </div>

      {/* Accordion Categories */}
      <div className="mt-10 space-y-10">
        {visible.length > 0 ? (
          visible.map(({ category, items }) => (
            <FaqCategorySection
              key={category.title}
              category={category}
              items={items}
              openIds={openIds}
              onToggle={toggle}
              copiedId={copiedId}
              onCopy={handleCopyLink}
            />
          ))
        ) : (
          <Card className="flex flex-col items-center px-6 py-12 text-center shadow-xs">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchIcon className="size-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              No questions match &ldquo;{query}&rdquo;
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different keyword or browse all topics.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => {
                setQuery("");
                setActiveCategory(null);
              }}
            >
              Clear search
            </Button>
          </Card>
        )}
      </div>

      {/* Google Preferred Source Card */}
      <Card className="mt-12 flex flex-col gap-6 p-6 shadow-xs md:flex-row md:items-center md:justify-between border-primary/20 bg-card">
        <div className="max-w-lg">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <SparklesIcon className="size-3.5" aria-hidden="true" />
            Google Search & AI Overviews
          </div>
          <h3 className="mt-2 font-heading text-lg font-semibold tracking-tight text-foreground">
            Set Simpleplek as a Preferred Source
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Add Simpleplek to your Google preferences to see our live availability, verified host
            answers, and accommodation packages prioritized with a &ldquo;Preferred&rdquo; badge in Google
            AI Overviews.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          {/* Google Publisher Script Button Container */}
          <div
            {...({ "google-add-preferred-source-btn": "" } as Record<string, unknown>)}
            data-theme="light"
            className="flex min-h-[36px] items-center"
          >
            {/* Fallback button linking directly to Google source preferences */}
            <a
              href="https://www.google.com/preferences/source?q=simpleplek.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
            >
              <GoogleIcon className="size-4" />
              <span>Add on Google</span>
              <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
            </a>
          </div>
          <span className="text-xs text-muted-foreground">
            Personalizes your Google AI answers
          </span>
        </div>
      </Card>

      {/* Need More Information Card */}
      <section className="mt-6 flex flex-col gap-6 rounded-lg bg-muted p-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-lg">
          <p className="text-xs font-medium text-muted-foreground">Need More Information?</p>
          <h3 className="mt-2 font-heading text-lg font-semibold tracking-tight text-foreground">
            Can&apos;t find the answer you&apos;re looking for?
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Our team and community are here to help you get the most out of your Simpleplek stays,
            subscription packages, and property listings.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/bookings"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Browse Properties
          </Link>
          <Link
            href="/subscribe"
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}
          >
            <span>Become a Pro Member</span>
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
