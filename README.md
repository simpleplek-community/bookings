# SimplePlek Bookings

[![GitHub Issues](https://img.shields.io/github/issues/simpleplek-community/bookings)](https://github.com/simpleplek-community/bookings/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/simpleplek-community/bookings)](https://github.com/simpleplek-community/bookings/pulls)
[![GitHub Discussions](https://img.shields.io/github/discussions/simpleplek-community/bookings)](https://github.com/simpleplek-community/bookings/discussions)

**SimplePlek Bookings** is the booking application at the centre of the SimplePlek ecosystem.

It provides the foundations for publishing bookable resources, managing availability, creating estimates and reservations, handling booking status, and integrating external calendars.

The current implementation is focused on **short-term accommodation and time-based bookings**, while the broader project is being developed to support other bookable resources such as **workspaces, offices and meeting rooms**.

> 🚧 **This project is actively evolving.**
>
> The repository is part of the [SimplePlek Community](https://github.com/simpleplek-community). Architecture, APIs and data models may change as the project develops.

---

## What is SimplePlek?

SimplePlek is exploring a flexible booking platform for real-world resources.

The same underlying booking concepts can apply to:

* 🏠 Short-term accommodation
* 💼 Workspace hire
* 🏢 Offices and meeting rooms
* 📅 Other time-based reservations

The goal is to avoid building a completely different booking system for every type of resource.

Instead, SimplePlek is exploring a model where a **bookable resource** has availability, pricing, booking rules and reservations.

---

## What this repository does

The `bookings` repository currently provides a web application built around several core concepts.

### Properties

Properties are the primary bookable resources in the current implementation.

A property can contain:

* Title/name
* Slug
* Description
* Location
* Images
* Base nightly price
* Host/owner
* Booking type
* Time slots
* Weekly discounts
* Monthly discounts
* Booking rules
* External calendar URLs

The application currently uses the `properties` collection in Firestore, with a local JSON representation available when running in mock mode.

### Packages

Properties can have packages attached to them.

A package can contain:

* Name
* Description
* Price
* Category
* Property
* Enabled/disabled state
* Pro entitlement

Package creation is restricted to the property owner and package entitlements are checked against the user's plan.

### Bookings

The booking API supports:

* Creating bookings
* Listing bookings
* Updating booking payment status
* Retrieving bookings
* Booking validation
* Date-range validation
* Conflict detection
* Confirmation email handling

Before a booking is created, the application checks existing bookings and imported external calendar events for overlapping dates.

### Estimates

The application also supports an estimate stage before a booking is confirmed.

Estimates contain:

* Property
* Package
* Customer
* Customer email
* Customer ID
* Start date
* End date
* Total

Estimates can subsequently be updated before the booking flow is completed.

### Availability and scheduling

The current UI supports both:

**Overnight bookings**

```text
Check-in → Check-out
```

and time-based bookings where the start and end occur on the same day.

The application stores a user's selected dates and can preserve the time window for hourly-style bookings.

### External calendars

The booking API can read external iCalendar feeds and use their events when determining availability.

The current implementation supports calendar feeds from:

* Google Calendar
* Airbnb

External events are cached for five minutes and are treated as blocking events during conflict checking.

This allows a property to coordinate availability with external booking platforms rather than relying exclusively on bookings created inside SimplePlek.

### Host subdomains

The application supports host-specific subdomains.

A request can resolve a host profile from a subdomain and use that host context when displaying listings.

This provides the foundation for experiences such as:

```text
host.simpleplek.co.za
```

where visitors can see listings associated with a particular host.

### Authentication

Authentication is implemented with Firebase Authentication.

The current application supports:

* Email/password sign-in
* Email/password registration
* Google sign-in
* Firebase custom-token session exchange
* Sign-out
* User profile lookup
* Admin status lookup

There is also a development-only authentication fallback for local development environments. It is restricted to local/private development hosts unless explicitly enabled.

---

## Architecture

The current application is a Next.js App Router application.

```text
┌─────────────────────────────────────┐
│             Next.js App             │
│                                     │
│  ┌─────────────┐  ┌──────────────┐ │
│  │   Web UI    │  │  API Routes  │ │
│  │             │  │              │ │
│  │ Listings    │  │ Bookings     │ │
│  │ Estimates   │  │ Properties   │ │
│  │ Dates       │  │ Packages     │ │
│  │ Auth        │  │ Estimates    │ │
│  └─────────────┘  └──────┬───────┘ │
│                          │         │
└──────────────────────────┼─────────┘
                           │
                  ┌────────▼────────┐
                  │ Firebase Admin  │
                  │                 │
                  │ Firestore       │
                  │ Firebase Auth   │
                  └─────────────────┘
```

The application uses Firebase Admin SDK on the server and the Firebase client SDK in the browser.

### Development fallback

When `FIREBASE_SERVICE_ACCOUNT_JSON` is unavailable or cannot be parsed, the server-side data layer falls back to a local `db-mock.json` data store.

This makes it possible to develop the application without immediately connecting it to a live Firebase project.

---

## Technology

The current stack includes:

| Layer                            | Technology                         |
| -------------------------------- | ---------------------------------- |
| Framework                        | Next.js 16                         |
| Language                         | TypeScript                         |
| UI                               | React 19                           |
| Styling                          | Tailwind CSS 4                     |
| Components                       | Base UI / custom UI components     |
| Icons                            | Lucide React                       |
| Authentication                   | Firebase Authentication            |
| Database                         | Firebase Firestore                 |
| Local development database       | `db-mock.json`                     |
| Object/image storage integration | AWS S3 SDK / S3-compatible storage |
| Package manager                  | pnpm                               |

The repository currently uses Next.js `16.2.9`, React `19.2.4`, Firebase `12.14.0`, Firebase Admin `14.0.0`, Tailwind CSS 4 and TypeScript 5.

---

## Repository structure

The main application areas are organised approximately as:

```text
bookings/
├── app/
│   ├── api/
│   │   ├── bookings/
│   │   ├── estimates/
│   │   ├── packages/
│   │   ├── posts/
│   │   ├── host/
│   │   └── user/
│   │
│   ├── admin/
│   ├── estimate/
│   ├── i/
│   ├── posts/
│   └── page.tsx
│
├── components/
│   ├── auth
│   └── ui/
│
├── lib/
│   ├── firebase
│   ├── clientApp
│   ├── email
│   ├── utils
│   └── types
│
├── public/
├── scripts/
├── db-mock.json
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

The repository currently contains 122 commits and uses the Next.js App Router structure with `app`, `components`, `lib`, `public` and `scripts` directories.

---

## Getting started

### Requirements

You'll need:

* Node.js
* pnpm
* A Firebase project for production-style development

### Clone

```bash
git clone https://github.com/simpleplek-community/bookings.git
cd bookings
```

### Install dependencies

```bash
pnpm install
```

### Start development

```bash
pnpm dev
```

The application will normally be available at:

```text
http://localhost:3000
```

The available npm scripts are currently:

```text
pnpm dev
pnpm build
pnpm start
pnpm lint
```

These map directly to the scripts defined in `package.json`.

---

## Firebase configuration

The server can connect to Firebase using:

```text
FIREBASE_SERVICE_ACCOUNT_JSON
```

The Firebase Admin SDK uses this credential to initialise Firestore and server-side authentication services. If it is not configured, the application can fall back to mock mode.

The browser Firebase configuration uses:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

These values are used to initialise the Firebase client application and Firebase Authentication.

### Never commit credentials

Do not commit:

* Firebase service-account JSON
* Private keys
* API secrets
* Production credentials
* `.env` files containing secrets

Use your deployment provider's encrypted environment-variable store for production credentials.

---

## Booking flow

The current booking flow broadly follows:

```text
Browse listings
      │
      ▼
Select dates / time
      │
      ▼
Check availability
      │
      ▼
Select package
      │
      ▼
Create estimate
      │
      ▼
Review / share estimate
      │
      ▼
Payment / confirmation
      │
      ▼
Booking
      │
      ▼
Confirmation email
```

The application also supports synchronising booking/payment state from the client flow and sending a booking confirmation email when a booking transitions to paid.

---

## Preventing conflicting bookings

Before creating a booking, the API:

1. Validates the requested property and dates.
2. Retrieves existing bookings.
3. Retrieves relevant external calendar events.
4. Checks for overlapping date ranges.
5. Rejects the request if an active booking conflicts.
6. Creates the booking with an initial `pending` payment status.

Failed and refunded bookings are excluded from the conflict check.

The current overlap rule is effectively:

```text
requested.start < existing.end
AND
requested.end > existing.start
```

---

## Multi-tenant direction

The application already contains foundations for host/property isolation.

Properties have an associated `hostId`, and package creation verifies that the requesting user owns the property associated with the package.

Host subdomains provide another part of this model:

```text
host-a.example.com
host-b.example.com
host-c.example.com
```

Each can resolve to a corresponding host profile and listing set.

The multi-tenant model is still evolving and should be treated as an area for community discussion rather than a finished architectural contract.

---

## Development principles

As the project develops, we're interested in keeping the booking model:

### Resource-oriented

A booking should ultimately represent a reservation against a defined bookable resource.

### Time-aware

The system should support different booking patterns, including:

* overnight stays
* hourly bookings
* fixed packages
* future recurring or scheduled use cases

### Extensible

Accommodation and workspace hire should be different applications of the same underlying booking concepts wherever practical.

### Integration-friendly

External calendars and other services should be able to participate without making the core booking model dependent on one provider.

### Community-driven

Important architectural changes should be discussed before they become implementation decisions.

---

## Community

SimplePlek is being developed as a community project.

Use **[GitHub Discussions](https://github.com/simpleplek-community/bookings/discussions)** for conversations that don't necessarily need to become code immediately.

Current discussion areas include:

* 💬 General
* 💡 Ideas
* 🧭 Roadmap
* 🛠️ Development
* 🐛 Help & Troubleshooting
* 📣 Show & Tell
* 📋 RFCs
* 🔌 Integrations

### Discussions → Issues → Pull Requests

A useful workflow is:

```text
Discussion
    │
    ▼
Idea / question / RFC
    │
    ▼
Agreed work
    │
    ▼
GitHub Issue
    │
    ▼
Pull Request
    │
    ▼
Review
    │
    ▼
Merge
```

Not every discussion needs to become an issue.

---

## Contributing

Contributions are welcome.

You can contribute without writing code.

Examples include:

* describing a real booking use case
* identifying a problem
* proposing an API change
* discussing the data model
* testing the application
* improving documentation
* reporting bugs
* building integrations
* submitting code

For larger architectural changes, start with a **Discussion or RFC** before opening a pull request.

---

## Roadmap

The roadmap is intentionally evolving.

Areas currently relevant to the project include:

* [ ] Generalise the bookable-resource model
* [ ] Continue accommodation booking support
* [ ] Expand workspace booking support
* [ ] Improve availability modelling
* [ ] Strengthen multi-tenant isolation
* [ ] Formalise booking and cancellation policies
* [ ] Improve external calendar integrations
* [ ] Define stable API contracts
* [ ] Improve automated testing
* [ ] Improve developer documentation
* [ ] Establish contribution and release processes

The roadmap should be treated as a conversation with the community rather than a fixed commitment.

---

## Project status

**Early development**

The repository is functional in several areas, but APIs, data structures and architecture are still subject to change.

If you're evaluating the project for production use, review the current implementation and deployment configuration rather than assuming that every capability described in the roadmap is already complete.

---

## License

The repository should contain the project's current `LICENSE` file before a license badge or specific licensing terms are advertised here.

If you're deciding on the project's license, that decision should be made before presenting the repository as a fully licensed open-source project.

---

## Links

* **Organization:** https://github.com/simpleplek-community
* **Discussions:** https://github.com/simpleplek-community/bookings/discussions
* **Issues:** https://github.com/simpleplek-community/bookings/issues
* **Pull Requests:** https://github.com/simpleplek-community/bookings/pulls
