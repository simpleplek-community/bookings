"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuth } from "@/components/auth";
import { useListingWizard } from "@/hooks/useListingWizard";
import { WizardHeader } from "./WizardHeader";
import { WizardFooter } from "./WizardFooter";
import { StepHeading } from "./StepHeading";
import { PublishedScreen } from "./PublishedScreen";
import { TitleStep } from "./steps/TitleStep";
import { LocationStep } from "./steps/LocationStep";
import { PhotosStep } from "./steps/PhotosStep";
import { DescriptionStep } from "./steps/DescriptionStep";
import { VisibilityStep } from "./steps/VisibilityStep";
import { ReviewStep } from "./steps/ReviewStep";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Lock } from "lucide-react";

export function CreateListing() {
  const { user, loading: authLoading } = useAuth();
  const [userPlan, setUserPlan] = useState<string>("standard");
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/user/profile?userId=${user.uid}&email=${user.email || ""}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setUserPlan(data.data.plan || "standard");
        }
      } catch (e) {
        console.error("Failed to load user profile:", e);
      } finally {
        setProfileLoading(false);
      }
    }
    if (!authLoading) {
      fetchUserProfile();
    }
  }, [user, authLoading]);

  const wizard = useListingWizard(user, userPlan);
  const reduceMotion = useReducedMotion();
  const offset = reduceMotion ? 0 : 24;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: offset * d }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: -offset * d }),
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <Spinner className="size-6 text-brand" aria-label="Loading..." />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
        <Empty className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lock className="text-muted" />
            </EmptyMedia>
            <EmptyTitle>Access Denied</EmptyTitle>
            <EmptyDescription>
              Administrative privileges or host authorization is required to create new property listings.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex flex-col gap-2 pt-4">
            <Button nativeButton={false} render={<Link href="/login" />}>
              Sign In as Host / Admin
            </Button>
            <Button nativeButton={false} variant="outline" render={<Link href="/" />}>
              Back to Home
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const renderStep = () => {
    const { draft } = wizard;
    switch (wizard.step.id) {
      case "title":
        return (
          <TitleStep
            title={draft.title}
            slug={draft.slug}
            slugIsValid={wizard.slugIsValid}
            onTitleChange={wizard.setTitle}
            onSlugChange={wizard.setSlug}
          />
        );
      case "location":
        return (
          <LocationStep
            location={draft.location}
            onChange={wizard.setLocation}
          />
        );
      case "photos":
        return (
          <PhotosStep
            photos={draft.photos}
            error={wizard.photoError}
            onAdd={wizard.addPhotos}
            onRemove={wizard.removePhoto}
            onMakeCover={wizard.makeCover}
            onLoadSample={wizard.loadSample}
          />
        );
      case "description":
        return (
          <DescriptionStep
            description={draft.description}
            onChange={wizard.setDescription}
          />
        );
      case "visibility":
        return (
          <VisibilityStep
            isPro={draft.isPro}
            userPlan={userPlan}
            isAdmin={user?.isAdmin}
            onChange={wizard.setIsPro}
          />
        );
      case "review":
        return (
          <ReviewStep
            draft={draft}
            errorMessage={wizard.errorMessage}
            onEdit={wizard.goToStep}
          />
        );
      default:
        return null;
    }
  };

  if (wizard.publishStatus === "published") {
    return (
      <div className="min-h-screen w-full bg-canvas font-sans text-ink">
        <WizardHeader onSave={wizard.saveDraftToStorage} />
        <main className="py-8">
          <PublishedScreen
            draft={wizard.draft}
            createdPropertyId={wizard.createdPropertyId}
            onCreateAnother={wizard.startOver}
          />
        </main>
      </div>
    );
  }

  const isWide = wizard.step.id === "review";

  return (
    <div className="min-h-screen w-full bg-canvas font-sans text-ink flex flex-col justify-between">
      <div>
        <WizardHeader onSave={wizard.saveDraftToStorage} />
        <main className="px-6 pb-40 pt-8 md:pt-12">
          <form
            id="property-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              wizard.next();
            }}
            className={`mx-auto w-full transition-all duration-300 ${
              isWide ? "max-w-[880px]" : "max-w-[640px]"
            }`}
          >
            <AnimatePresence mode="wait" custom={wizard.direction} initial={false}>
              <motion.div
                key={wizard.step.id}
                custom={wizard.direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }}
              >
                <StepHeading
                  heading={wizard.step.heading}
                  description={wizard.step.description}
                />
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </form>
        </main>
      </div>

      <WizardFooter
        stepIndex={wizard.stepIndex}
        totalSteps={wizard.totalSteps}
        isFirst={wizard.isFirst}
        isLast={wizard.isLast}
        canContinue={wizard.canContinue}
        isPublishing={
          wizard.publishStatus === "publishing" || wizard.isUploadingPhotos
        }
        onBack={wizard.back}
        onNext={wizard.next}
      />
    </div>
  );
}
