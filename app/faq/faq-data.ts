export interface FaqItem {
  id: string;
  category: "Getting Started & Membership" | "Booking & Availability" | "Hosting & Property Management";
  question: string;
  answer: string;
  directAnswer: string;
  actionUrl?: string;
  actionText?: string;
  keywords: string[];
}

export interface FaqCategory {
  title: "Getting Started & Membership" | "Booking & Availability" | "Hosting & Property Management";
  description: string;
  iconName: "ShieldCheck" | "Calendar" | "Building2";
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "Getting Started & Membership",
    description: "Trial benefits, subscription savings, and member privileges on Simpleplek.",
    iconName: "ShieldCheck",
  },
  {
    title: "Booking & Availability",
    description: "Live calendars, booking policies, cancellations, and account requirements.",
    iconName: "Calendar",
  },
  {
    title: "Hosting & Property Management",
    description: "Becoming a host, managing packages, and customizing property listings.",
    iconName: "Building2",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  // Getting Started & Membership
  {
    id: "how-do-i-try-simpleplek",
    category: "Getting Started & Membership",
    question: "How do I try Simpleplek?",
    directAnswer:
      "You can explore Simpleplek risk-free through our free trial offer—simply sign up and explore without upfront commitment, or book select properties that require no membership.",
    answer:
      "You can take advantage of our free trial offer—simply sign up and explore! If you decide not to continue, just cancel your subscription before the trial period ends to avoid being charged. Please note that some properties and packages do not require a membership to book.",
    actionUrl: "/subscribe",
    actionText: "Start Free Trial",
    keywords: ["trial", "free trial", "try", "sign up", "membership", "test", "cancel", "fee"],
  },
  {
    id: "why-do-i-need-a-subscription",
    category: "Getting Started & Membership",
    question: "Why do I need a subscription?",
    directAnswer:
      "A Simpleplek subscription saves you money by eliminating standard booking fees and unlocks exclusive member-only properties along with in-house purchases during your stay.",
    answer:
      "A Simpleplek subscription saves you money by eliminating standard booking fees. Additionally, an active subscription gives you full access to book member-only properties and make in-house purchases during your stay.",
    actionUrl: "/subscribe",
    actionText: "View Membership Plans",
    keywords: [
      "subscription",
      "why subscribe",
      "benefits",
      "fees",
      "booking fees",
      "member-only",
      "in-house purchases",
      "discount",
    ],
  },

  // Booking & Availability
  {
    id: "how-do-i-see-property-availability",
    category: "Booking & Availability",
    question: "How do I see property availability?",
    directAnswer:
      "Active subscribers gain full access to live availability calendars on property listings, while select non-member properties can be viewed and booked with a free account.",
    answer:
      "To view our live availability calendars, you must have an active subscription. Once subscribed, calendars will be unlocked on property listings. However, select properties are available to non-members—you only need to create a free account to book them.",
    actionUrl: "/bookings",
    actionText: "Explore Properties",
    keywords: [
      "availability",
      "live calendar",
      "dates",
      "schedule",
      "view calendar",
      "non-members",
      "free account",
      "unlock",
    ],
  },
  {
    id: "what-is-your-cancellation-and-refund-policy",
    category: "Booking & Availability",
    question: "What is your cancellation and refund policy?",
    directAnswer:
      "Individual cancellation and refund policies are detailed in each booking confirmation email. If you booked a Pro Package stay, your subscription must remain active until your stay to maintain package benefits.",
    answer:
      "Detailed cancellation and refund rules for every stay are included in your booking confirmation emails. Please note that if you book a Pro Package stay and your subscription expires before your booking, the package benefits become invalid.",
    actionUrl: "/terms",
    actionText: "Read Terms & Cancellation Rules",
    keywords: [
      "cancellation",
      "refund",
      "policy",
      "cancel booking",
      "money back",
      "pro package stay",
      "expired subscription",
    ],
  },

  // Hosting & Property Management
  {
    id: "how-do-i-become-a-host",
    category: "Hosting & Property Management",
    question: "How do I become a host?",
    directAnswer:
      "To become a host on Simpleplek, subscribe as a Pro Member. This unlocks the hosting tools to list and manage your properties directly on the platform.",
    answer:
      "To host on Simpleplek, subscribe as a Pro Member. Once subscribed, you will unlock the ability to list your property directly on the platform.",
    actionUrl: "/subscribe",
    actionText: "Become a Pro Host",
    keywords: ["host", "become a host", "list property", "pro member", "hosting", "owner", "landlord"],
  },
  {
    id: "how-do-property-packages-work",
    category: "Hosting & Property Management",
    question: "How do property packages work?",
    directAnswer:
      "Packages allow hosts to configure their listings with either a Standard or Pro base package, and attach customizable add-on packages to provide enhanced guest offers.",
    answer:
      "Packages allow you to define and customize your property listing. You can assign your property a Standard or Pro base package, or attach specific add-on packages to enhance your listing offer.",
    actionUrl: "/subscribe",
    actionText: "Learn About Packages",
    keywords: ["packages", "standard package", "pro package", "add-on packages", "listing packages", "custom packages"],
  },
  {
    id: "how-do-i-add-a-package-to-my-listing",
    category: "Hosting & Property Management",
    question: "How do I add a package to my listing?",
    directAnswer:
      "Manage packages by going to Dashboard > Listings in your host account, selecting your property, and configuring the package options within listing settings.",
    answer:
      "You can manage and add packages directly through your dashboard. Go to Dashboard > Listings, select your property, and add the desired package options under the listing settings.",
    actionUrl: "/admin/properties",
    actionText: "Go to Listings Dashboard",
    keywords: ["add package", "dashboard", "listings", "property settings", "manage listing", "package options"],
  },
];
