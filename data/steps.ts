import type { ListingStep } from "../types/listing";

export const steps: ListingStep[] = [
  {
    id: "title",
    heading: "Now, let's give your property a title",
    description: "Short titles work best. You can always change it later.",
  },
  {
    id: "location",
    heading: "Where's your place located?",
    description: "Guests see the area first. The exact address is shared after booking.",
  },
  {
    id: "photos",
    heading: "Add some photos of your property",
    description: "You'll need at least one photo to continue. The first photo becomes your cover.",
  },
  {
    id: "description",
    heading: "Create your description",
    description: "Share what makes your place special. This appears on the public listing page.",
  },
  {
    id: "visibility",
    heading: "Who can see this listing?",
    description: "Open it to every guest, or reserve it for your Pro members.",
  },
  {
    id: "review",
    heading: "Review your listing",
    description: "Here's what guests will see. Make sure everything looks right.",
  },
];
