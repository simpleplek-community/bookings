import type { ListingDraft } from "../types/listing";

const baseUrl =
  "https://pub-62b3d61e820a424983412732dac4ef9f.r2.dev/hosts/cE63u7tstuREl9Kjy9YPhTnEI513/properties/simple-plek-development";

export const initialDraft: ListingDraft = {
  title: "",
  slug: "",
  location: "",
  description: "",
  isPro: false,
  photos: [],
};

export const sampleDraft: ListingDraft = {
  title: "Simple Plek off plan",
  slug: "simple-plek-off-plan",
  location: "Llandudno, Cape Town",
  description:
    "Stay at your own off plan investment property during its development",
  isPro: true,
  photos: [
    { id: "photo-1", src: `${baseUrl}/1790940423189_Right.jpg`, alt: "Simple Plek off plan photo 1" },
    { id: "photo-2", src: `${baseUrl}/1790957076861_Left.jpg`, alt: "Simple Plek off plan photo 2" },
    { id: "photo-3", src: `${baseUrl}/1790957092259_C.jpg`, alt: "Simple Plek off plan photo 3" },
    { id: "photo-4", src: `${baseUrl}/1790957094300_B.jpg`, alt: "Simple Plek off plan photo 4" },
    { id: "photo-5", src: `${baseUrl}/1790957099182_KV1.png`, alt: "Simple Plek off plan photo 5" },
  ],
};

export const emptyDraft: ListingDraft = {
  title: "",
  slug: "",
  location: "",
  description: "",
  isPro: false,
  photos: [],
};
