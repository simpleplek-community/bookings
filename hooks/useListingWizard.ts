import { useState, useCallback, useEffect } from "react";
import { emptyDraft, initialDraft } from "../data/listing";
import { steps } from "../data/steps";
import { isValidSlug, slugify } from "../utils/slug";
import type {
  ListingDraft,
  ListingPhoto,
  PublishStatus,
  StepId,
} from "../types/listing";
import type { AuthUser } from "@/components/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/avif",
];

const DRAFT_STORAGE_KEY = "simpleplek_new_property_draft";

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

export function useListingWizard(user?: AuthUser | null, userPlan: string = "standard") {
  const [draft, setDraft] = useState<ListingDraft>(emptyDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [slugEdited, setSlugEdited] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  // Restore draft from localStorage on mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && parsed.title) {
          setDraft(parsed);
          setSlugEdited(Boolean(parsed.slugEdited));
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const step = steps[stepIndex] || steps[0];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const slugIsValid = isValidSlug(draft.slug);

  const canContinue = (() => {
    switch (step.id) {
      case "title":
        return draft.title.trim().length > 0 && slugIsValid;
      case "location":
        return draft.location.trim().length > 0;
      case "photos":
        return draft.photos.length > 0;
      case "description":
        return draft.description.trim().length > 0;
      default:
        return true;
    }
  })();

  const setTitle = (title: string) =>
    setDraft((d) => ({
      ...d,
      title,
      slug: slugEdited ? d.slug : slugify(title),
    }));

  const setSlug = (slug: string) => {
    setSlugEdited(true);
    setDraft((d) => ({ ...d, slug: slug.toLowerCase() }));
  };

  const setLocation = (location: string) =>
    setDraft((d) => ({ ...d, location }));

  const setDescription = (description: string) =>
    setDraft((d) => ({ ...d, description }));

  const setIsPro = (isPro: boolean) => setDraft((d) => ({ ...d, isPro }));

  const addPhotos = (files: FileList | File[]) => {
    const list = Array.from(files);
    const valid = list.filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE
    );
    const rejected = list.length - valid.length;
    setPhotoError(
      rejected > 0
        ? `${rejected} file${rejected > 1 ? "s were" : " was"} skipped. Use PNG, JPG, WEBP or AVIF up to 10MB.`
        : null
    );
    if (valid.length === 0) return;
    const added: ListingPhoto[] = valid.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      src: URL.createObjectURL(f),
      alt: f.name,
      file: f,
    }));
    setDraft((d) => ({ ...d, photos: [...d.photos, ...added] }));
  };

  const removePhoto = (id: string) =>
    setDraft((d) => {
      const target = d.photos.find((p) => p.id === id);
      if (target?.src.startsWith("blob:")) URL.revokeObjectURL(target.src);
      return { ...d, photos: d.photos.filter((p) => p.id !== id) };
    });

  const makeCover = (id: string) =>
    setDraft((d) => {
      const target = d.photos.find((p) => p.id === id);
      if (!target) return d;
      return { ...d, photos: [target, ...d.photos.filter((p) => p.id !== id)] };
    });

  const goTo = (index: number) => {
    setDirection(index >= stepIndex ? 1 : -1);
    setStepIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (id: StepId) => goTo(steps.findIndex((s) => s.id === id));

  const saveDraftToStorage = useCallback(() => {
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ ...draft, slugEdited })
      );
    } catch {
      // Ignore
    }
  }, [draft, slugEdited]);

  const uploadPhotosToServer = async (): Promise<string[]> => {
    if (!user) return draft.photos.map((p) => p.src);

    setIsUploadingPhotos(true);
    const uploadedUrls: string[] = [];

    try {
      for (const photo of draft.photos) {
        // If it's already a hosted URL (not a local blob URL)
        if (!photo.src.startsWith("blob:") || !photo.file) {
          uploadedUrls.push(photo.src);
          continue;
        }

        const file = photo.file;
        const presignRes = await fetch("/api/media/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostId: user.uid,
            filename: file.name,
            contentType: file.type,
            propertyId: draft.slug || "draft",
          }),
        });

        if (!presignRes.ok) {
          const presignError = await presignRes.json().catch(() => ({}));
          throw new Error(presignError.error || `Could not upload ${file.name}`);
        }

        const { presignedUrl, publicUrl } = await presignRes.json();
        await uploadWithProgress(presignedUrl, file, () => {});
        uploadedUrls.push(publicUrl);
      }
      return uploadedUrls;
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const publish = async () => {
    setPublishStatus("publishing");
    setErrorMessage(null);

    try {
      // Upload pending photos
      const photoUrls = await uploadPhotosToServer();

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.uid || "",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({
          title: draft.title.trim(),
          name: draft.title.trim(),
          slug: draft.slug.trim().toLowerCase(),
          basePricePerNight: 2800,
          location: draft.location.trim(),
          description: draft.description.trim(),
          images: photoUrls,
          isPro: Boolean(draft.isPro),
          hostId: user?.uid,
          bookingType: "nightly",
          slots: [],
          weeklyDiscount: 10,
          monthlyDiscount: 20,
          mandatoryRules: [],
        }),
      });

      const resJson = await response.json().catch(() => ({}));

      if (!response.ok || !resJson.success) {
        if (response.status === 409) {
          throw new Error("That slug is already in use. Please go back to title and choose a different slug.");
        }
        throw new Error(resJson.error || resJson.data || "Failed to publish listing.");
      }

      setCreatedPropertyId(resJson.id || resJson.data?.id || null);
      setPublishStatus("published");
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while publishing.";
      setErrorMessage(msg);
      setPublishStatus("idle");
    }
  };

  const next = () => {
    if (!canContinue || publishStatus === "publishing" || isUploadingPhotos) return;
    if (isLast) publish();
    else goTo(stepIndex + 1);
  };

  const back = () => {
    if (!isFirst) goTo(stepIndex - 1);
  };

  const startOver = () => {
    setDraft(emptyDraft);
    setSlugEdited(false);
    setPhotoError(null);
    setErrorMessage(null);
    setPublishStatus("idle");
    setDirection(1);
    setStepIndex(0);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadSample = () => {
    setDraft(initialDraft);
    setSlugEdited(true);
    setPhotoError(null);
    setErrorMessage(null);
  };

  return {
    draft,
    step,
    stepIndex,
    totalSteps: steps.length,
    direction,
    isFirst,
    isLast,
    canContinue,
    slugIsValid,
    photoError,
    errorMessage,
    publishStatus,
    isUploadingPhotos,
    createdPropertyId,
    setTitle,
    setSlug,
    setLocation,
    setDescription,
    setIsPro,
    addPhotos,
    removePhoto,
    makeCover,
    next,
    back,
    goToStep,
    startOver,
    loadSample,
    saveDraftToStorage,
  };
}
