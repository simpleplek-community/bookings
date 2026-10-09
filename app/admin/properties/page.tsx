"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth";
import { PropertyCard } from "@/components/property-card";
import { PackageSheet } from "@/components/package-sheet";
import { SuggestedPackages } from "@/components/orphaned-package";
import { type Property, type PropertyPackage } from "@/lib/types";
import { type PackageDraft } from "@/components/package-form";
import {
  ArrowUpRight,
  ChevronRight,
  Globe,
  House,
  Lock,
  Plus,
  Sparkles,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { publicHost, publicUrl } from "@/utils/subdomain";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export default function AdminPropertiesPage() {
  const { user, loading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [packages, setPackages] = useState<PropertyPackage[]>([]);
  const [userPlan, setUserPlan] = useState<string>("standard");
  const [subdomain, setSubdomain] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showSuggested, setShowSuggested] = useState(false);

  // Side sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const fetchPropertiesAndPackages = useCallback(async () => {
    if (!user) return;
    try {
      const [propsRes, pkgsRes, profileRes] = await Promise.all([
        fetch(`/api/posts?hostId=${user.uid}&userId=${user.uid}`, {
          headers: {
            "x-user-id": user.uid,
            "x-user-email": user.email || "",
          },
        }),
        fetch(`/api/packages`),
        fetch(`/api/user/profile?userId=${user.uid}&email=${user.email || ""}`),
      ]);

      const propsResult = await propsRes.json();
      const pkgsResult = await pkgsRes.json();
      const profileResult = await profileRes.json();

      if (propsResult.success && propsResult.data) {
        setProperties(propsResult.data);
      }
      if (pkgsResult.success && pkgsResult.data) {
        setPackages(pkgsResult.data);
      }
      if (profileResult.success && profileResult.data) {
        setUserPlan(profileResult.data.plan || "standard");
        setSubdomain(profileResult.data.subdomain || "");
      }
    } catch (err: unknown) {
      console.error("Failed to load properties and packages:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPropertiesAndPackages();
    }
  }, [user, fetchPropertiesAndPackages]);

  // bucket packages
  const byProperty = useMemo(() => {
    const byProp: Record<string, PropertyPackage[]> = {};
    const propertyIds = new Set(properties.map((p) => p.id));

    packages.forEach((pkg) => {
      const pId = pkg.propertyId;
      if (propertyIds.has(pId)) {
        if (!byProp[pId]) byProp[pId] = [];
        byProp[pId].push(pkg);
      }
    });

    return byProp;
  }, [properties, packages]);

  // Suggested packages templates from other listings
  const suggestedPackages = useMemo(() => {
    const myPropertyIds = new Set(properties.map((p) => p.id));
    const otherPkgs = packages.filter((pkg) => !myPropertyIds.has(pkg.propertyId));

    const seen = new Set<string>();
    const uniqueTemplates: PropertyPackage[] = [];

    otherPkgs.forEach((pkg) => {
      const key = `${pkg.name.toLowerCase()}-${pkg.price}-${pkg.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTemplates.push(pkg);
      }
    });

    return uniqueTemplates;
  }, [properties, packages]);

  const activeProperty = properties.find((p) => p.id === selectedPropertyId) ?? null;
  const activePackages = selectedPropertyId ? (byProperty[selectedPropertyId] ?? []) : [];

  const openPackagesSheet = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setIsSheetOpen(true);
  };

  const handleCreatePackage = async (propertyId: string, draft: PackageDraft) => {
    setActionError(null);
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({
          ...draft,
          propertyId,
        }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.data || resJson.error || "Failed to create package.");
      }

      const pkgsRes = await fetch(`/api/packages`);
      const pkgsData = await pkgsRes.json();
      if (pkgsData.success) {
        setPackages(pkgsData.data || []);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setActionError(error.message || "An error occurred while creating the package.");
    }
  };

  const handleUpdatePackage = async (packageId: string, draft: PackageDraft) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;

    setActionError(null);
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({
          ...pkg,
          ...draft,
          id: packageId,
        }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.data || resJson.error || "Failed to update package.");
      }

      const pkgsRes = await fetch(`/api/packages`);
      const pkgsData = await pkgsRes.json();
      if (pkgsData.success) {
        setPackages(pkgsData.data || []);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setActionError(error.message || "An error occurred while updating the package.");
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    setActionError(null);
    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || "",
        },
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "Failed to delete package.");
      }

      const pkgsRes = await fetch(`/api/packages`);
      const pkgsData = await pkgsRes.json();
      if (pkgsData.success) {
        setPackages(pkgsData.data || []);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setActionError(error.message || "An error occurred while deleting the package.");
    }
  };

  const handleTogglePackage = async (packageId: string, isEnabled: boolean) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;

    setActionError(null);
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({
          ...pkg,
          isEnabled,
        }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.data || resJson.error || "Failed to toggle package.");
      }

      const pkgsRes = await fetch(`/api/packages`);
      const pkgsData = await pkgsRes.json();
      if (pkgsData.success) {
        setPackages(pkgsData.data || []);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setActionError(error.message || "An error occurred while toggling the package.");
    }
  };

  const handleCopyPackage = async (propertyId: string, pkg: PropertyPackage) => {
    const newId = `${pkg.id.split("_")[0]}_${propertyId}`;
    setActionError(null);
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({
          id: newId,
          propertyId,
          name: pkg.name,
          price: pkg.price,
          description: pkg.description,
          category: pkg.category,
          isEnabled: true,
        }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.data || resJson.error || "Failed to copy package.");
      }

      const pkgsRes = await fetch(`/api/packages`);
      const pkgsData = await pkgsRes.json();
      if (pkgsData.success) {
        setPackages(pkgsData.data || []);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setActionError(error.message || "An error occurred while copying the package.");
    }
  };

  const handleReassignPackage = async (packageId: string, propertyId: string) => {
    const pkg = packages.find((p) => p.id === packageId);
    if (!pkg) return;

    setActionError(null);
    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({
          ...pkg,
          propertyId,
        }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.data || resJson.error || "Failed to reassign package.");
      }

      const pkgsRes = await fetch(`/api/packages`);
      const pkgsData = await pkgsRes.json();
      if (pkgsData.success) {
        setPackages(pkgsData.data || []);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setActionError(error.message || "An error occurred while reassigning the package.");
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
        <span className="sr-only">Loading properties</span>
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Lock />
                </EmptyMedia>
                <EmptyTitle>Access denied</EmptyTitle>
                <EmptyDescription>
                  Administrative privileges are required to access this portal. Please sign
                  in with an administrator account to continue.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="w-full">
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={<Link href="/login" />}
                >
                  Sign in as admin
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href="/" />}
                >
                  Back to home
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6faf9] dark:bg-background text-[#12302c] dark:text-foreground">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header matching prototype */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/40 pb-6">
          <div className="flex flex-col gap-1.5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Properties dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage listings and their package entitlements</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm pt-1">
              <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">Your page</span>
              {subdomain ? (
                <>
                  <a
                    href={publicUrl(subdomain)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {publicHost(subdomain)}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                  <span aria-hidden="true" className="text-muted-foreground/40">·</span>
                  <Link
                    href="/settings/profile"
                    className="rounded font-medium text-emerald-700 dark:text-emerald-400 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Edit
                  </Link>
                </>
              ) : (
                <>
                  <span className="text-xs italic text-amber-600 dark:text-amber-400">Not configured</span>
                  <span aria-hidden="true" className="text-muted-foreground/40">·</span>
                  <Link
                    href="/settings/profile"
                    className="rounded font-medium text-emerald-700 dark:text-emerald-400 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Set up public page
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground shadow-2xs">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Plan: {userPlan === "pro" ? "Professional" : "Standard Pro"}
            </span>
            <Link
              href="/admin/properties/new"
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-2xs transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" />
              New property
            </Link>
          </div>
        </header>

        {actionError && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        {/* Suggested Package Templates Banner */}
        {suggestedPackages.length > 0 && (
          <section className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowSuggested((v) => !v)}
              className="flex w-full items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 text-left transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Sparkles className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {suggestedPackages.length} Suggested Package Template{suggestedPackages.length === 1 ? "" : "s"} Available
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Reuse popular package configurations from other listings in the community.
                </p>
              </div>
              <ChevronRight
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${showSuggested ? "rotate-90" : ""
                  }`}
              />
            </button>

            {showSuggested && (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
                <SuggestedPackages
                  suggested={suggestedPackages}
                  properties={properties}
                  onCopy={handleCopyPackage}
                />
              </div>
            )}
          </section>
        )}

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <Card className="mx-auto w-full max-w-lg">
            <CardContent>
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <House />
                  </EmptyMedia>
                  <EmptyTitle>No properties yet</EmptyTitle>
                  <EmptyDescription>
                    No properties published yet. Create one to get started.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    nativeButton={false}
                    render={<Link href="/admin/properties/new" />}
                  >
                    <Plus data-icon="inline-start" />
                    Create first property
                  </Button>
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.map((property) => (
              <PropertyCard
                key={property.id || property.slug}
                property={property}
                packages={byProperty[property.id] ?? []}
                onOpenPackages={() => openPackagesSheet(property.id)}
              />
            ))}
          </div>
        )}
      </main>

      <PackageSheet
        property={activeProperty}
        packages={activePackages}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        onCreate={handleCreatePackage}
        onUpdate={handleUpdatePackage}
        onDelete={handleDeletePackage}
        onToggle={handleTogglePackage}
        onReassign={handleReassignPackage}
        userPlan={userPlan}
      />
    </div>
  );
}
