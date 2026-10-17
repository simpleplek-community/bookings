"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth, AuthProvider } from "@/components/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { ProTermsCheckoutModal } from "@/components/subscribe/ProTermsCheckoutModal";

function SubscribeContent() {
  const { user, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal checkout flow states
  const [checkoutModalPlan, setCheckoutModalPlan] = useState<"monthly" | "annual" | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isMockBypassMode, setIsMockBypassMode] = useState(false);

  const initiateSubscribe = (plan: "monthly" | "annual", isMock = false) => {
    if (!user) {
      setStatusMessage({ type: "error", text: "Please sign in or sign up to subscribe." });
      return;
    }
    setCheckoutModalPlan(plan);
    setIsMockBypassMode(isMock);
    setIsCheckoutModalOpen(true);
    setStatusMessage(null);
  };

  const handleConfirmSubscription = async (plan: "monthly" | "annual") => {
    if (!user) {
      setStatusMessage({ type: "error", text: "Please sign in or sign up to subscribe." });
      return;
    }

    setIsRedirecting(true);
    setStatusMessage(null);

    try {
      if (isMockBypassMode) {
        const res = await fetch("/api/subscribe/mock-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            plan: "pro",
            billingInterval: plan,
            consentAcknowledged: true,
          }),
        });
        const result = await res.json();
        if (res.ok && result.success) {
          setIsCheckoutModalOpen(false);
          setStatusMessage({
            type: "success",
            text: `Success! Audit log recorded (${result.consentAuditId || "saved"}). Promoted to Pro (${plan === "monthly" ? "Monthly Plan" : "Annual Plan"}). Reloading session...`,
          });
          setTimeout(() => {
            window.location.href = "/admin/properties";
          }, 1500);
        } else {
          throw new Error(result.error || "Mock promotion failed");
        }
      } else {
        const res = await fetch("/api/subscribe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            plan,
            consentAcknowledged: true,
          }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || "Failed to create checkout transaction.");
        }

        // Redirect to Yoco Checkout page
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "An error occurred.";
      setStatusMessage({ type: "error", text: message });
      setIsRedirecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <Link href="/" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Become a Pro
          </h1>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Choose a plan, unlock listing capabilities, and access exclusive Pro-only package deals.
          </p>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mb-8 max-w-md mx-auto">
            <Alert variant={statusMessage.type === "success" ? "default" : "destructive"}>
              <AlertDescription>{statusMessage.text}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Pro User View */}
        {user && user.isAdmin ? (
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader className="text-center">
                <div className="mb-4 text-5xl">🎉</div>
                <CardTitle>You are a Pro User!</CardTitle>
                <CardDescription className="mt-2">
                  Your account has full listing capabilities, high-resolution imagery, calendar sync, and exclusive Pro-only package access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-xs text-primary flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Share Block / Leasehold Terms explicit consent verified on audit record.</span>
                </div>
                <Link
                  href="/admin/properties"
                  className="block"
                >
                  <Button className="w-full">Go to Pro Dashboard</Button>
                </Link>
                <Link
                  href="/"
                  className="block"
                >
                  <Button variant="outline" className="w-full">Storefront Home</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
              {/* Monthly Plan */}
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-3">Monthly Plan</Badge>
                      <CardTitle>Pro Monthly</CardTitle>
                    </div>
                  </div>
                  <CardDescription>Flexible month-to-month access to all Pro features with 25-yr capital accrual.</CardDescription>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">R 15</span>
                    <span className="text-sm text-muted-foreground">/ month</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <Separator className="mb-6" />
                  <ul className="space-y-3">
                    {[
                      "Discounted booking fee (R25 vs R50 standard)",
                      "Access & create exclusive Pro-only packages",
                      "Airbnb / Google Calendar sync",
                      "Unlimited property listings & custom deals",
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-3">
                  {user ? (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Scale className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Subject to Share Block &amp; Capital Terms</span>
                      </div>
                      <Button
                        onClick={() => initiateSubscribe("monthly")}
                        disabled={isRedirecting}
                        className="w-full cursor-pointer"
                      >
                        {isRedirecting && checkoutModalPlan === "monthly"
                          ? "Connecting..."
                          : "Review Terms & Subscribe"}
                      </Button>
                    </>
                  ) : (
                    <Link href="/login" className="w-full">
                      <Button variant="outline" className="w-full">Sign In to Subscribe</Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>

              {/* Annual Plan (Recommended) */}
              <Card className="flex flex-col relative border-primary/50 md:ring-1 md:ring-primary/20">
                <div className="absolute top-3 right-4">
                  <Badge className="bg-primary text-primary-foreground font-semibold">Save R30 + Free Bookings</Badge>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="mb-3">Annual Plan</Badge>
                      <CardTitle>Pro Annual</CardTitle>
                    </div>
                  </div>
                  <CardDescription>Best value plan with zero booking fees (Free R0) and full Pro capabilities.</CardDescription>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">R 150</span>
                    <span className="text-sm text-muted-foreground">/ year</span>
                    <span className="ml-2 text-xs text-primary font-medium">(R 12.50/mo)</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <Separator className="mb-6" />
                  <ul className="space-y-3">
                    {[
                      "100% Free booking fees (R0 on all stays & estimates)",
                      "Access & create exclusive Pro-only packages",
                      "Airbnb / Google Calendar sync",
                      "Unlimited property listings & custom deals",
                      "Priority features & promotional packages",
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-3">
                  {user ? (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Scale className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Subject to Share Block &amp; Capital Terms</span>
                      </div>
                      <Button
                        onClick={() => initiateSubscribe("annual")}
                        disabled={isRedirecting}
                        className="w-full cursor-pointer"
                      >
                        {isRedirecting && checkoutModalPlan === "annual"
                          ? "Connecting..."
                          : "Review Terms & Subscribe"}
                      </Button>
                    </>
                  ) : (
                    <Link href="/login" className="w-full">
                      <Button variant="outline" className="w-full">Sign In to Subscribe</Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            </div>

            {/* Booking Fee Differentiation Comparison Banner */}
            <div className="mx-auto max-w-4xl rounded-2xl border bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" />
                    <h3 className="font-heading text-lg font-semibold tracking-tight">Booking Fee Comparison</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Save on every stay or estimate. Pro Annual members pay zero booking fees.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center sm:gap-4 shrink-0">
                  <div className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xs font-medium text-muted-foreground">Standard</div>
                    <div className="mt-1 font-heading text-lg font-bold">R 50</div>
                    <div className="text-[11px] text-muted-foreground">per booking</div>
                  </div>
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Pro Monthly</div>
                    <div className="mt-1 font-heading text-lg font-bold text-blue-600 dark:text-blue-400">R 25</div>
                    <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80">50% discount</div>
                  </div>
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
                    <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Pro Annual</div>
                    <div className="mt-1 font-heading text-lg font-bold text-emerald-600 dark:text-emerald-400">R 0</div>
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">100% Free</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Local Developer Bypass block */}
            {process.env.NODE_ENV !== "production" && user && (
              <Card className="mx-auto max-w-md">
                <CardHeader className="text-center">
                  <CardTitle className="text-base">🛠 Local Dev Control</CardTitle>
                  <CardDescription>
                    Test the checkout modal, review statutory terms, and log an audit record with instant promotion.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => initiateSubscribe("monthly", true)}
                    disabled={isRedirecting}
                  >
                    Bypass as Pro Monthly
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => initiateSubscribe("annual", true)}
                    disabled={isRedirecting}
                  >
                    Bypass as Pro Annual
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Dedicated Checkout / Terms Review Modal */}
        <ProTermsCheckoutModal
          key={checkoutModalPlan || "none"}
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          plan={checkoutModalPlan}
          isProcessing={isRedirecting}
          isMockBypass={isMockBypassMode}
          onConfirm={handleConfirmSubscription}
        />
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <AuthProvider>
      <SubscribeContent />
    </AuthProvider>
  );
}
