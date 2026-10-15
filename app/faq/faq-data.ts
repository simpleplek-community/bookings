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
      "Simpleplek offers flexible membership plans at R15 per month or R150 per year, while select properties can be booked for free without a membership.",
    answer:
      "You can join Simpleplek by choosing either a monthly subscription for R15 or an annual subscription for R150 to unlock full platform access and member pricing. Alternatively, you can browse and book select non-member properties simply by creating a free account.",
    actionUrl: "/subscribe",
    actionText: "Choose a Membership Plan",
    keywords: ["subscription", "R15", "R150", "monthly", "annual", "pricing", "sign up", "membership", "fee"],
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
  {
    id: "can-invited-guests-copay-and-buy-addons",
    category: "Booking & Availability",
    question: "Can invited guests co-pay for bookings and add-on purchases?",
    directAnswer:
      "Yes, invited guests will appear on the booking, can purchase standard host add-ons, and can contribute to Pro Share Block add-ons if they have an active membership.",
    answer:
      "Yes! Invited guests added to a reservation will officially appear on the booking details. Guests can purchase standard add-ons provided by the host. To contribute toward Pro Share Block add-ons or fractional investment packages, invited guests must hold an active Simpleplek membership.",
    actionUrl: "/bookings",
    actionText: "Learn About Split Bookings",
    keywords: ["copay", "guest", "invite", "add-on", "share block", "split payment", "pro plan", "membership", "contribution"],
  },
  {
    id: "how-to-buy-offplan-share-block",
    category: "Hosting & Property Management",
    question: "How do I buy off-plan into a Share Block or fractional property?",
    directAnswer:
      "You can buy off-plan into a Share Block by making a standard booking on the platform and selecting the Pro Plan add-on package to pay monthly contributions toward long-term equity.",
    answer:
      "To participate in a Pro Plan Share Block or Leasehold acquisition, simply make a standard booking for the property and select the corresponding Pro Plan add-on package during checkout. Your monthly payment covers both operational costs and capital contributions toward acquiring your share. Additionally, you can select an add-on package to formally call or host a Share Block member meeting during your booking dates.",
    actionUrl: "/terms#section-11",
    actionText: "Read Share Block Terms",
    keywords: ["share block", "pro plan", "offplan", "fractional ownership", "leasehold", "add-on", "meeting", "equity", "investment"],
  },
];
