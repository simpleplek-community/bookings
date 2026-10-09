"use client";

import React, { useState, useEffect, use, useMemo, Suspense, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Lock,
  ImagePlus,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { MandatoryRule, PropertyPackage } from "@/lib/types";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PricingTab } from "@/components/pricing/PricingTab";
import { SaveBar, SaveState } from "@/components/pricing/SaveBar";
import { CreateListing } from "@/components/listing/CreateListing";

interface Property {
  id: string;
  title: string;
  slug: string;
  basePricePerNight: number;
  airbnbCalendarUrl?: string;
  googleCalendarUrl?: string;
  description?: string;
  images?: string[];
  hostId?: string;
  bookingType?: string;
  slots?: string[];
  location?: string;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
  mandatoryRules?: MandatoryRule[];
}

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

type FieldName = "title" | "slug" | "basePrice" | "slots";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/avif"];
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// 30-minute interval slots from 06:00 to 22:00
const ALL_TIME_SLOTS = Array.from({ length: 33 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 30; // 06:00 to 22:00
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `${h}:${m}`;
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Uploads a file with real progress reporting. */
function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (progress: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(10 + Math.round((event.loaded / event.total) * 85));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Storage rejected the upload (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(file);
  });
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {children}
    </div>
  );
}

const PROPERTY_TABS = [
  { id: "details" as const, label: "Listing details", description: "Title, description, photos and location for this property." },
  { id: "pricing" as const, label: "Pricing", description: "Price, discounts and required package rules." },
  { id: "availability" as const, label: "Availability", description: "Sync external calendars and export listing bookings." },
];

function EditPropertyContent({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const isNew = id === "new";

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string>>>({});
  const statusRef = useRef<HTMLDivElement | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [location, setLocation] = useState("");
  const [basePrice, setBasePrice] = useState<number>(2800);
  const [weeklyDiscount, setWeeklyDiscount] = useState<{ enabled: boolean; percent: number }>({
    enabled: true,
    percent: 10,
  });
  const [monthlyDiscount, setMonthlyDiscount] = useState<{ enabled: boolean; percent: number }>({
    enabled: true,
    percent: 20,
  });
  const [airbnbCalendarUrl, setAirbnbCalendarUrl] = useState("");
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [bookingType, setBookingType] = useState<"nightly" | "hourly">("nightly");
  const [slots, setSlots] = useState<string[]>(["09:00", "13:00"]);
  const [slotAlignment, setSlotAlignment] = useState<"hourly" | "halfHour" | "all">("hourly");
  const [isPro, setIsPro] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("standard");

  const [activeTab, setActiveTab] = useState<"details" | "pricing" | "availability">("pricing");
  const [mandatoryRules, setMandatoryRules] = useState<MandatoryRule[]>([
    { operator: "equals", nights: 1, packageIds: [] },
  ]);
  const [copiedExportUrl, setCopiedExportUrl] = useState(false);
  const [packages, setPackages] = useState<PropertyPackage[]>([]);

  const handleCopyExportUrl = useCallback(() => {
    const url = `${window.location.origin}/api/posts/${id}/export`;
    navigator.clipboard.writeText(url);
    setCopiedExportUrl(true);
    setTimeout(() => setCopiedExportUrl(false), 2000);
  }, [id]);

  const isUploading = uploadingFiles.length > 0;

  const notify = useCallback((type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
  }, []);

  const clearFieldError = useCallback((field: FieldName) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const visibleSlots = useMemo(() => {
    if (slotAlignment === "hourly") return ALL_TIME_SLOTS.filter((s) => s.endsWith(":00"));
    if (slotAlignment === "halfHour") return ALL_TIME_SLOTS.filter((s) => s.endsWith(":30"));
    return ALL_TIME_SLOTS;
  }, [slotAlignment]);

  const morningSlots = useMemo(
    () => visibleSlots.filter((s) => Number.parseInt(s.split(":")[0], 10) < 12),
    [visibleSlots]
  );

  const afternoonSlots = useMemo(
    () => visibleSlots.filter((s) => Number.parseInt(s.split(":")[0], 10) >= 12),
    [visibleSlots]
  );

  const hiddenSelectedCount = useMemo(() => {
    const visibleSet = new Set(visibleSlots);
    return slots.filter((s) => !visibleSet.has(s)).length;
  }, [slots, visibleSlots]);

  const toggleSlot = useCallback(
    (slotTime: string) => {
      setSlots((prev) => {
        const exists = prev.includes(slotTime);
        const next = exists ? prev.filter((s) => s !== slotTime) : [...prev, slotTime].sort();
        if (next.length > 0) clearFieldError("slots");
        return next;
      });
    },
    [clearFieldError]
  );

  useEffect(() => {
    if (statusMessage) {
      statusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [statusMessage]);

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (authLoading) return;

      // Fetch packages for this property (or all packages for new listings)
      try {
        const [pkgsRes, profileRes] = await Promise.all([
          fetch(isNew ? "/api/packages" : `/api/packages?propertyId=${id}`),
          user ? fetch(`/api/user/profile?userId=${user.uid}&email=${user.email || ""}`) : Promise.resolve(null)
        ]);
        const pkgsResult = await pkgsRes.json();
        if (pkgsResult.success && Array.isArray(pkgsResult.data)) {
          setPackages(pkgsResult.data);
        }
        if (profileRes) {
          const profileResult = await profileRes.json();
          if (profileResult.success && profileResult.data) {
            setUserPlan(profileResult.data.plan || "standard");
          }
        }
      } catch (pkgErr) {
        console.error("Failed to load packages or profile:", pkgErr);
      }

      if (isNew) {
        setIsLoading(false);
        return;
      }

      try {
        const queryParams = new URLSearchParams();
        if (user?.uid) queryParams.set("userId", user.uid);
        if (user?.email) queryParams.set("email", user.email);

        const propUrl = `/api/posts/${id}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
        const res = await fetch(propUrl, {
          headers: {
            ...(user?.uid ? { "x-user-id": user.uid } : {}),
            ...(user?.email ? { "x-user-email": user.email } : {}),
          },
        });
        const result = await res.json();
        if (result.success && result.data) {
          setProperty(result.data);
          setTitle(result.data.title || result.data.name || "");
          setSlug(result.data.slug || "");
          setBasePrice(result.data.basePricePerNight ? Number(result.data.basePricePerNight) : 2800);
          setIsPro(Boolean(result.data.isPro));

          const loadedWeekly =
            result.data.weeklyDiscount !== undefined && result.data.weeklyDiscount !== null
              ? Number(result.data.weeklyDiscount)
              : 0;
          setWeeklyDiscount({
            enabled: loadedWeekly > 0,
            percent: loadedWeekly > 0 ? loadedWeekly : 10,
          });

          const loadedMonthly =
            result.data.monthlyDiscount !== undefined && result.data.monthlyDiscount !== null
              ? Number(result.data.monthlyDiscount)
              : 0;
          setMonthlyDiscount({
            enabled: loadedMonthly > 0,
            percent: loadedMonthly > 0 ? loadedMonthly : 20,
          });

          setAirbnbCalendarUrl(result.data.airbnbCalendarUrl || "");
          setGoogleCalendarUrl(result.data.googleCalendarUrl || "");
          setDescription(result.data.description || "");
          setImages(result.data.images || []);
          setLocation(result.data.location || "");
          setBookingType(result.data.bookingType === "hourly" ? "hourly" : "nightly");

          const loadedSlots = result.data.slots?.length ? result.data.slots : ["09:00", "13:00"];
          setSlots(loadedSlots);
          const hasHalf = loadedSlots.some((s: string) => s.endsWith(":30"));
          const hasHourly = loadedSlots.some((s: string) => s.endsWith(":00"));
          if (hasHalf && hasHourly) {
            setSlotAlignment("all");
          } else if (hasHalf) {
            setSlotAlignment("halfHour");
          } else {
            setSlotAlignment("hourly");
          }

          const normalizedRules: MandatoryRule[] = (result.data.mandatoryRules || []).map((r: any) => ({
            ...r,
            packageIds:
              Array.isArray(r.packageIds) && r.packageIds.length > 0
                ? r.packageIds
                : r.packageId
                  ? [r.packageId]
                  : [],
            packageId: r.packageId || (Array.isArray(r.packageIds) && r.packageIds[0]) || "",
            nights: r.nights || 1,
            operator: r.operator || "equals",
          }));
          setMandatoryRules(normalizedRules);
        } else {
          notify("error", result.error || "Property not found.");
        }
      } catch (err: unknown) {
        console.error("Failed to load property details:", err);
        notify("error", "Failed to load property details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPropertyData();
  }, [id, isNew, user, authLoading, notify]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    clearFieldError("title");
    if (isNew && !slugTouched) {
      setSlug(slugify(val));
      clearFieldError("slug");
    }
  };

  const processFiles = useCallback(
    async (fileList: File[]) => {
      if (fileList.length === 0) return;

      if (!user) {
        notify("error", "You must be signed in to upload images.");
        return;
      }

      const validFiles: File[] = [];
      const rejected: string[] = [];

      for (const file of fileList) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          rejected.push(`${file.name} (unsupported format)`);
        } else if (file.size > MAX_FILE_SIZE) {
          rejected.push(`${file.name} (over 10MB)`);
        } else {
          validFiles.push(file);
        }
      }

      if (rejected.length > 0) {
        notify("error", `Skipped ${rejected.length} file(s): ${rejected.join(", ")}`);
      }

      for (const file of validFiles) {
        const uploadId = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

        setUploadingFiles((prev) => [
          ...prev,
          { id: uploadId, name: file.name, progress: 5 },
        ]);

        try {
          const presignRes = await fetch("/api/media/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              hostId: user.uid,
              filename: file.name,
              contentType: file.type,
              propertyId: isNew ? slug || "draft" : id,
            }),
          });

          if (!presignRes.ok) {
            const presignError = await presignRes.json().catch(() => ({}));
            throw new Error(presignError.error || "Could not prepare the upload.");
          }
          const { presignedUrl, publicUrl } = await presignRes.json();

          setUploadingFiles((prev) =>
            prev.map((item) =>
              item.id === uploadId ? { ...item, progress: 10 } : item
            )
          );

          await uploadWithProgress(presignedUrl, file, (progress) => {
            setUploadingFiles((prev) =>
              prev.map((item) =>
                item.id === uploadId ? { ...item, progress } : item
              )
            );
          });

          setImages((prev) => (prev.includes(publicUrl) ? prev : [...prev, publicUrl]));
        } catch (err: unknown) {
          const errorMessage =
            err instanceof Error ? err.message : "Upload error";
          console.error("Upload failed for file:", file.name, err);
          notify("error", `Upload failed for ${file.name}: ${errorMessage}`);
        } finally {
          setUploadingFiles((prev) => prev.filter((item) => item.id !== uploadId));
        }
      }
    },
    [user, isNew, slug, id, notify]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    e.target.value = "";
    await processFiles(fileList);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    await processFiles(dropped);
  };

  const handleRemoveImage = (url: string) => {
    setImages((prev) => prev.filter((img) => img !== url));
  };

  // Rule management helpers
  const handleAddRule = () => {
    setMandatoryRules((prev) => [
      ...prev,
      {
        operator: "greater_or_equal",
        nights: 2,
        packageIds: packages.length > 0 ? [packages[0].id] : [],
        packageId: packages.length > 0 ? packages[0].id : "",
      },
    ]);
  };

  const handleUpdateRule = (index: number, patch: Partial<MandatoryRule>) => {
    setMandatoryRules((prev) =>
      prev.map((rule, idx) => (idx === index ? { ...rule, ...patch } : rule))
    );
  };

  const handleRemoveRule = (index: number) => {
    setMandatoryRules((prev) => prev.filter((_, idx) => idx !== index));
  };

  /** Form validation */
  const validateForm = () => {
    const errors: Partial<Record<FieldName, string>> = {};

    if (!title.trim()) {
      errors.title = "Please add a property title.";
    }
    if (!slug.trim()) {
      errors.slug = "A slug is required.";
    } else if (!SLUG_PATTERN.test(slug)) {
      errors.slug = "Use lowercase letters, numbers and single dashes only.";
    }
    if (!basePrice || basePrice < 1) {
      errors.basePrice = "Enter a base price of at least R1.";
    }
    if (bookingType === "hourly" && slots.length === 0) {
      errors.slots = "Select at least one available time slot.";
    }

    const firstError = Object.values(errors)[0];
    const summary = isUploading
      ? "Please wait for image uploads to finish."
      : firstError;

    return { errors, summary };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const { errors, summary } = validateForm();
    setFieldErrors(errors);
    if (summary) {
      notify("error", summary);
      return;
    }

    setIsSubmitting(true);
    setSaveState("saving");
    setStatusMessage(null);

    try {
      const url = isNew ? "/api/posts" : `/api/posts/${id}`;
      const method = isNew ? "POST" : "PUT";
      const cleanTitle = title.trim();

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({
          title: cleanTitle,
          name: cleanTitle,
          slug: slug.trim().toLowerCase(),
          basePricePerNight: Number(basePrice),
          weeklyDiscount: weeklyDiscount.enabled ? Number(weeklyDiscount.percent) : 0,
          monthlyDiscount: monthlyDiscount.enabled ? Number(monthlyDiscount.percent) : 0,
          airbnbCalendarUrl: airbnbCalendarUrl.trim(),
          googleCalendarUrl: googleCalendarUrl.trim(),
          description: description.trim(),
          images,
          bookingType,
          slots: bookingType === "hourly" ? slots : [],
          location: location.trim(),
          hostId: user?.uid,
          isPro: Boolean(isPro),
          mandatoryRules: mandatoryRules.map((rule) => {
            const ids =
              Array.isArray(rule.packageIds) && rule.packageIds.length > 0
                ? rule.packageIds
                : rule.packageId
                  ? [rule.packageId]
                  : [];
            return {
              ...rule,
              packageIds: ids,
              packageId: ids[0] || "",
            };
          }),
        }),
      });

      const resJson = await response.json().catch(() => ({}));

      if (!response.ok || !resJson.success) {
        if (response.status === 409) {
          setFieldErrors({ slug: "That slug is already in use." });
          throw new Error(
            `That slug is already in use. Try a different one, e.g. ${slug}-2.`
          );
        }
        throw new Error(
          resJson.error || resJson.data || "Failed to save property."
        );
      }

      setSaveState("saved");
      notify(
        "success",
        isNew ? "Listing created successfully!" : "Listing updated successfully!"
      );
      setTimeout(() => {
        router.push("/admin/properties");
      }, 1200);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred.";
      notify("error", errorMessage);
      setIsSubmitting(false);
      setSaveState("idle");
    }
  };

  const handleDelete = async () => {
    if (isNew) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || "",
        },
      });

      const resJson = await response.json().catch(() => ({}));
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "Failed to delete property.");
      }

      notify("success", "Listing deleted successfully!");
      setTimeout(() => {
        router.push("/admin/properties");
      }, 1200);
    } catch (err: unknown) {
      const error = err as Error;
      notify("error", error.message || "An error occurred.");
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <PageShell>
        <Spinner className="size-6 text-primary" aria-label="Loading" />
      </PageShell>
    );
  }

  const hasAccess =
    isNew ||
    (user &&
      user.isAdmin &&
      (!property?.hostId ||
        property.hostId === user.uid ||
        property.hostId === "mock_admin_example_com"));

  if (!user || !user.isAdmin || !hasAccess) {
    return (
      <PageShell>
        <Empty className="w-full max-w-md rounded-2xl border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lock />
            </EmptyMedia>
            <EmptyTitle>Access Denied</EmptyTitle>
            <EmptyDescription>
              Administrative privileges or listing ownership is required to
              access this portal.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/admin/properties" />}>
              Back to Properties
            </Button>
            <Button nativeButton={false} variant="ghost" render={<Link href="/" />}>
              Back to Home
            </Button>
          </EmptyContent>
        </Empty>
      </PageShell>
    );
  }

  const activeTabMeta = PROPERTY_TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-32">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <Link
              href="/admin/properties"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to listings
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {isNew ? "Create Property Listing" : "Edit Property Configuration"}
            </h1>
          </div>
          <Badge variant="secondary" className="w-fit shrink-0 font-mono text-xs">
            {isNew ? (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" />
                New Listing
              </>
            ) : (
              `ID: ${id}`
            )}
          </Badge>
        </header>

        {/* Status Alerts */}
        <div ref={statusRef} aria-live="polite" role="status">
          {statusMessage && (
            <Alert
              variant={statusMessage.type === "success" ? "default" : "destructive"}
              className="rounded-2xl shadow-xs"
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle className="font-semibold">
                {statusMessage.type === "success" ? "Success" : "Something needs attention"}
              </AlertTitle>
              <AlertDescription className="text-pretty">
                {statusMessage.text}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Tab Navigation */}
        <div
          role="tablist"
          aria-label="Property sections"
          className="flex gap-6 sm:gap-8 border-b border-border overflow-x-auto"
        >
          {PROPERTY_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative whitespace-nowrap pb-3 text-sm sm:text-base font-semibold transition-colors duration-150 cursor-pointer",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Form */}
        <form id="property-form" onSubmit={handleSubmit} noValidate>
          <div
            id={`panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            className="mt-4"
          >
            {/* PRICING TAB (Airbnb Redesign) */}
            {activeTab === "pricing" && (
              <PricingTab
                price={basePrice}
                onPriceChange={(newPrice) => {
                  setBasePrice(newPrice);
                  clearFieldError("basePrice");
                }}
                bookingType={bookingType}
                onBookingTypeChange={setBookingType}
                weeklyDiscount={weeklyDiscount}
                onWeeklyDiscountChange={setWeeklyDiscount}
                monthlyDiscount={monthlyDiscount}
                onMonthlyDiscountChange={setMonthlyDiscount}
                rules={mandatoryRules}
                onAddRule={handleAddRule}
                onUpdateRule={handleUpdateRule}
                onRemoveRule={handleRemoveRule}
                packages={packages}
                priceError={fieldErrors.basePrice}
                slots={slots}
                onToggleSlot={toggleSlot}
                onClearSlots={() => setSlots([])}
                onSetSlots={(newSlots) => {
                  setSlots(newSlots);
                  clearFieldError("slots");
                }}
                slotAlignment={slotAlignment}
                onSlotAlignmentChange={setSlotAlignment}
                visibleSlots={visibleSlots}
                morningSlots={morningSlots}
                afternoonSlots={afternoonSlots}
                hiddenSelectedCount={hiddenSelectedCount}
                slotsError={fieldErrors.slots}
              />
            )}

            {/* LISTING DETAILS TAB */}
            {activeTab === "details" && (
              <Card className="rounded-2xl border border-border bg-card shadow-xs">
                <CardHeader>
                  <CardTitle>{activeTabMeta?.label}</CardTitle>
                  <CardDescription>{activeTabMeta?.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FieldGroup>
                    <Field data-invalid={fieldErrors.title ? true : undefined}>
                      <FieldLabel htmlFor="property-title">Property title</FieldLabel>
                      <Input
                        id="property-title"
                        placeholder="e.g. Llandudno Cliffside Villa"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        aria-invalid={fieldErrors.title ? true : undefined}
                      />
                      <FieldError
                        errors={
                          fieldErrors.title ? [{ message: fieldErrors.title }] : undefined
                        }
                      />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field data-invalid={fieldErrors.slug ? true : undefined}>
                        <FieldLabel htmlFor="property-slug">
                          Slug{isNew && !slugTouched ? " (auto-generated)" : ""}
                        </FieldLabel>
                        <Input
                          id="property-slug"
                          inputMode="url"
                          className="font-mono"
                          placeholder="llandudno-cliffside-villa"
                          value={slug}
                          onChange={(e) => {
                            setSlugTouched(true);
                            setSlug(
                              e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                            );
                            clearFieldError("slug");
                          }}
                          onBlur={() =>
                            setSlug((prev) => slugify(prev).replace(/^-|-$/g, ""))
                          }
                          aria-invalid={fieldErrors.slug ? true : undefined}
                        />
                        {fieldErrors.slug ? (
                          <FieldError errors={[{ message: fieldErrors.slug }]} />
                        ) : (
                          <FieldDescription>
                            Lowercase letters, numbers and dashes only.
                          </FieldDescription>
                        )}
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="property-location">Location</FieldLabel>
                        <Input
                          id="property-location"
                          placeholder="e.g. Llandudno, Cape Town"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="property-description">Description</FieldLabel>
                      <Textarea
                        id="property-description"
                        rows={4}
                        className="resize-y leading-relaxed"
                        placeholder="Describe your stay, amenities, views, scenery..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                      <FieldDescription>
                        This appears on the public listing page.
                      </FieldDescription>
                    </Field>

                    <Separator />

                    {/* Pro Only Property Gating Toggle */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FieldLabel className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                          Membership Tier & Visibility
                        </FieldLabel>
                        {isPro && (
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase flex items-center gap-1">
                            <Sparkles className="size-3" />
                            Pro Exclusive Listing
                          </Badge>
                        )}
                      </div>

                      {userPlan === "standard" && !user?.isAdmin ? (
                        <div className="flex items-start justify-between gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                              <Sparkles className="size-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-foreground">Pro Only Property</h4>
                                <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 font-bold uppercase">
                                  🔒 Pro Feature
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Only guests with an active Pro membership will be able to discover and book this property.
                              </p>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                                Your host account is currently on the Standard plan. Upgrade to Pro to enable Pro-only properties.
                              </p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            disabled
                            checked={false}
                            className="size-4 rounded border-border text-primary opacity-40 cursor-not-allowed mt-1 shrink-0"
                          />
                        </div>
                      ) : (
                        <label
                          htmlFor="property-ispro"
                          className={cn(
                            "flex items-start justify-between gap-4 rounded-2xl border p-4 sm:p-5 cursor-pointer transition-all",
                            isPro
                              ? "border-amber-500/50 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/20"
                              : "border-border bg-card hover:border-amber-500/30 hover:bg-muted/40"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "p-2.5 rounded-xl transition-colors shrink-0",
                              isPro ? "bg-amber-500 text-black shadow-xs" : "bg-muted text-muted-foreground"
                            )}>
                              <Sparkles className="size-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-foreground">Pro Only Property</h4>
                                <Badge className={cn(
                                  "text-[10px] font-bold uppercase",
                                  isPro
                                    ? "bg-amber-500 text-black border-transparent"
                                    : "bg-muted text-muted-foreground border-border"
                                )}>
                                  {isPro ? "⭐ Pro Only" : "Standard"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                When enabled, this property listing will only be displayed and available to guests who are active Pro members.
                              </p>
                            </div>
                          </div>
                          <input
                            id="property-ispro"
                            type="checkbox"
                            checked={isPro}
                            onChange={(e) => setIsPro(e.target.checked)}
                            className="size-4 rounded border-border text-amber-500 focus:ring-amber-500 mt-1 cursor-pointer shrink-0"
                          />
                        </label>
                      )}
                    </div>

                    <Separator />

                    <Field>
                      <FieldLabel htmlFor="property-images">Property imagery</FieldLabel>
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={cn(
                          "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
                          isDragging
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60"
                        )}
                      >
                        <input
                          id="property-images"
                          type="file"
                          multiple
                          accept={ACCEPTED_TYPES.join(",")}
                          onChange={handleFileUpload}
                          className="absolute inset-0 size-full cursor-pointer opacity-0"
                        />
                        <div className="pointer-events-none flex flex-col items-center gap-1">
                          <ImagePlus className="size-6 text-primary" />
                          <span className="text-sm font-medium">
                            {isDragging
                              ? "Drop images to upload"
                              : "Drag & drop files or click to upload"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            PNG, JPG, WEBP up to 10MB each
                          </span>
                        </div>
                      </div>

                      {uploadingFiles.length > 0 && (
                        <div className="flex flex-col gap-2 mt-3">
                          {uploadingFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex flex-col gap-1.5 rounded-xl border bg-muted/40 p-2.5"
                            >
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="truncate font-mono">{file.name}</span>
                                <span className="shrink-0 font-medium text-muted-foreground">
                                  {file.progress}%
                                </span>
                              </div>
                              <Progress value={file.progress} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      )}

                      {images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 mt-4">
                          {images.map((url, index) => (
                            <div
                              key={url}
                              className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
                            >
                              <Image
                                src={url || "/placeholder.svg"}
                                alt={`${title || "Property"} photo ${index + 1}`}
                                fill
                                unoptimized
                                sizes="(max-width: 640px) 33vw, 25vw"
                                className="object-cover"
                              />
                              {index === 0 && (
                                <Badge
                                  variant="secondary"
                                  className="absolute bottom-1.5 left-1.5 text-[10px]"
                                >
                                  Cover
                                </Badge>
                              )}
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="destructive"
                                onClick={() => handleRemoveImage(url)}
                                aria-label={`Remove image ${index + 1}`}
                                className="absolute top-1.5 right-1.5 z-10 bg-destructive text-destructive-foreground opacity-100 hover:bg-destructive/90 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Field>
                  </FieldGroup>
                </CardContent>
              </Card>
            )}

            {/* AVAILABILITY TAB */}
            {activeTab === "availability" && (
              <Card className="rounded-2xl border border-border bg-card shadow-xs">
                <CardHeader>
                  <CardTitle>{activeTabMeta?.label}</CardTitle>
                  <CardDescription>{activeTabMeta?.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <FieldGroup>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Import Calendar
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Sync reservations from external calendars to block availability on
                        this listing.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="airbnb-ical">Airbnb iCal URL</FieldLabel>
                        <Input
                          id="airbnb-ical"
                          type="url"
                          placeholder="https://www.airbnb.co.za/calendar/ical/..."
                          value={airbnbCalendarUrl}
                          onChange={(e) => setAirbnbCalendarUrl(e.target.value)}
                        />
                        <FieldDescription>Optional.</FieldDescription>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="google-ical">
                          Google Calendar iCal URL
                        </FieldLabel>
                        <Input
                          id="google-ical"
                          type="url"
                          placeholder="https://calendar.google.com/calendar/ical/..."
                          value={googleCalendarUrl}
                          onChange={(e) => setGoogleCalendarUrl(e.target.value)}
                        />
                        <FieldDescription>Optional.</FieldDescription>
                      </Field>
                    </div>
                  </FieldGroup>

                  <div className="space-y-6">
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        Export Calendar
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Sync this listing's bookings with external calendars (like Airbnb or
                        Google Calendar).
                      </p>
                    </div>

                    {isNew ? (
                      <Alert className="rounded-xl">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Export URL not available yet</AlertTitle>
                        <AlertDescription className="text-xs">
                          You will get an export link once you save and create this property
                          listing.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Field>
                        <FieldLabel htmlFor="export-ical">
                          Calendar Export URL (.ics)
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupInput
                            id="export-ical"
                            type="text"
                            readOnly
                            value={`${typeof window !== "undefined" ? window.location.origin : ""}/api/posts/${id}/export`}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="font-mono text-xs bg-muted/30 select-all"
                          />
                          <InputGroupAddon align="inline-end" className="p-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-full px-3 text-xs border-l hover:bg-muted cursor-pointer"
                              onClick={handleCopyExportUrl}
                            >
                              {copiedExportUrl ? (
                                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                  <Check className="h-3 w-3" /> Copied
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Copy className="h-3 w-3" /> Copy Link
                                </span>
                              )}
                            </Button>
                          </InputGroupAddon>
                        </InputGroup>
                        <FieldDescription>
                          Copy this URL and import it into other booking channel platforms (e.g.
                          under Airbnb's "Export Calendar" settings).
                        </FieldDescription>
                      </Field>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </form>
      </div>

      {/* Fixed Bottom Save & Delete Action Bar */}
      <SaveBar
        isNew={isNew}
        formId="property-form"
        saveState={saveState}
        disabled={isUploading || isSubmitting}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      {/* Delete Confirmation Dialog */}
      {!isNew && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {title ? `"${title}"` : "this listing"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the property, its pricing and package rules.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  handleDelete();
                }}
              >
                Delete listing
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export default function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);

  if (unwrappedParams.id === "new") {
    return <CreateListing />;
  }

  return (
    <Suspense
      fallback={
        <PageShell>
          <Spinner className="size-6 text-primary" aria-label="Loading" />
        </PageShell>
      }
    >
      <EditPropertyContent id={unwrappedParams.id} />
    </Suspense>
  );
}
