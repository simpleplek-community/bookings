export type ListingPhoto = {
  id: string;
  src: string;
  alt: string;
  file?: File;
};

export type ListingDraft = {
  title: string;
  slug: string;
  location: string;
  description: string;
  photos: ListingPhoto[];
  isPro: boolean;
};

export type StepId =
  | "title"
  | "location"
  | "photos"
  | "description"
  | "visibility"
  | "review";

export type ListingStep = {
  id: StepId;
  heading: string;
  description: string;
};

export type PublishStatus = "idle" | "publishing" | "published";
