# Carrivo

![Carrivo home page in light mode: the headline "Door-to-door delivery, tracked at every stop", the Send a parcel and Get a price buttons, a tracking ID form and an illustrated delivery route with a courier on a scooter](docs/screenshots/home-hero-light.webp)

![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Stripe test mode](https://img.shields.io/badge/Stripe-test_mode-635BFF?logo=stripe&logoColor=white)
![License: all rights reserved](https://img.shields.io/badge/license-all_rights_reserved-lightgrey)

Carrivo is a door-to-door parcel delivery platform for the United States. Customers book a parcel online, see the price before they pay, pay by card on Stripe Checkout, choose a pickup window and follow the parcel from the sender's door through two sorting hubs to the receiver, with a photo at hand-over. Couriers work from a phone-first task list, and operations staff run zones, hubs, prices, assignments, payments and users from an admin console, with a read-only variant for observers. This repository is the web app (Next.js App Router); it consumes the separate Carrivo API through a thin backend-for-frontend, so the browser never holds an API token.

- **Live demo:** https://carrivo-frontend.vercel.app (sign in with the one-click demo buttons on the login page)
- **Backend repository:** https://github.com/Zarif207/carrivo-backend

## Table of contents

1. [At a glance](#at-a-glance)
2. [Feature walkthrough](#feature-walkthrough)
   - [Public site](#public-site)
   - [Customer](#customer)
   - [Courier](#courier)
   - [Admin](#admin)
   - [Admin Viewer](#admin-viewer)
   - [Mobile and dark mode](#mobile-and-dark-mode)
3. [Route map](#route-map)
4. [Architecture](#architecture)
5. [Authentication and sessions](#authentication-and-sessions)
6. [Permission matrix](#permission-matrix)
7. [Data fetching and caching](#data-fetching-and-caching)
8. [Forms and validation](#forms-and-validation)
9. [Payments](#payments)
10. [Design system](#design-system)
11. [Performance](#performance)
12. [Tech stack](#tech-stack)
13. [Folder structure](#folder-structure)
14. [Getting started](#getting-started)
15. [Environment variables](#environment-variables)
16. [Scripts](#scripts)
17. [Testing](#testing)
18. [Deployment on Vercel](#deployment-on-vercel)
19. [Troubleshooting](#troubleshooting)
20. [Contributing and commit convention](#contributing-and-commit-convention)
21. [Roadmap](#roadmap)
22. [License](#license)

## At a glance

| Role | Who | Home | What they do |
|---|---|---|---|
| Customer | People and small businesses sending parcels | `/dashboard` | Book, pay, schedule pickups, track, cancel before pickup |
| Courier | Drivers who collect and deliver | `/courier` | Work through assigned pickups and deliveries, add proof photos, see earnings |
| Admin | Operations staff | `/admin` | Assign couriers, move parcels through hubs, refunds, users, zones, hubs and pricing |
| Admin Viewer | Observers, reviewers, auditors | `/admin` | See every admin page and export data; cannot change anything |

The platform is US-only: prices in US dollars, weights in pounds, US street addresses and phone numbers, and business dates shown in one configurable time zone (America/New_York by default) as MM/DD/YYYY with 12-hour times.

**Demo access.** The login page has three one-click buttons: Customer, Courier and Admin (view-only). Each signs in to a seeded demo account on the server; the browser never receives any credential. The admin demo is the read-only viewer, so the public demo cannot change data. The full admin account is not part of the demo.

## Feature walkthrough

All screenshots below come from a local production build running against a local copy of the API with the seeded US demo data (Los Angeles Metro and New York Metro zones, four hubs, sample shipments and payments). Names, phone numbers (555-01xx range) and addresses are fictional demo data.

### Public site

![Services section of the home page: three cards for Standard, Express and Same day, each with an illustrated van, rider or same-day scene](docs/screenshots/home-services-light.webp)

- **Home page** with a static, server-rendered hero (it paints before any JavaScript runs), a tracking ID form, original illustrations for each service, a five-step "How it works" walkthrough, live tracking explained on a phone mockup built from the real timeline component, live coverage and live example prices, honest promises and limits, security notes, a tour of the three role views, an FAQ and a closing call to action.
- **Track a parcel** (`/track`, `/track/[trackingId]`): anyone with a tracking ID sees the stops and times. The public page never shows names, phone numbers or addresses.
- **Pricing** (`/pricing`): a live quote calculator that asks the API for a real estimate (zones, weight in pounds, service).
- **Services, About and Contact.** The contact form prepares an email in the visitor's mail app and says so; there is no contact endpoint.
- **Account menu in the header.** Signed-in visitors see an avatar button with Dashboard, Profile and Log out; signed-out visitors see Log in and Send a parcel.

![How it works section: five numbered steps from booking and paying to delivery with proof, next to a dark booking preview](docs/screenshots/home-how-it-works-light.webp)

![Tracking section of the home page: a phone mockup showing a delivered parcel with a drawn hand-over photo and its timeline, beside three explanation cards](docs/screenshots/home-tracking-light.webp)

![Coverage section on a dark band: a stylised US map with pins for Los Angeles Metro and New York Metro, next to live counts of zones, hubs, service levels and delivery attempts](docs/screenshots/home-coverage-light.webp)

![Pricing teaser: four live quotes for a 2 lb parcel, Standard within and between zones, Express between zones and Same day within a zone](docs/screenshots/home-pricing-light.webp)

![Role tabs section: the Customers tab with six capability points and a framed mini screen of the customer dashboard](docs/screenshots/home-roles-light.webp)

![Login page with email and password fields, Continue with Google, and three one-click demo buttons for Customer, Courier and Admin (view-only)](docs/screenshots/login-demo-buttons-light.webp)

### Customer

![Customer overview: greeting, a Today, Week, Month and Year switcher, cards for active shipments, delivered and total spend, and a recent shipments table](docs/screenshots/customer-overview-light.webp)

- **Overview** with active shipments, deliveries and spend for today, this week, this month or this year, plus recent shipments with the next action (pay, schedule pickup).
- **Three-step booking wizard**: sender and receiver (street, city, state and ZIP inputs), parcel and service with a live price, then review and book. The draft survives a page refresh (session storage) and is cleared on logout.
- **Payments** through Stripe Checkout (test mode), with success and cancel pages that confirm the result with the API.
- **Pickup scheduling**: a window of up to 12 hours on any day in the next 30.
- **Shipment detail** with the full status timeline, the assigned courier, pickup details, parcel details, the proof-of-delivery photo when there is one, and cancellation with an automatic refund before pickup.
- **Payment history, notifications** (bell plus full list, with read and unread) and **profile** (name, US phone, address used as the default pickup address, photo link, password).

![Booking wizard step 1, Sender and receiver: progress bar, sender name and phone, and a pickup address split into street, city, state and ZIP](docs/screenshots/customer-new-shipment-step1-light.webp)

![Booking wizard step 2, Parcel and service: zones and hubs, a weight of 4.5 lb, the Express service selected and a live price of $31.50 with its breakdown](docs/screenshots/customer-new-shipment-step2-light.webp)

![Shipment detail for an out-for-delivery parcel: status badges, the journey timeline from booking to out for delivery with hubs and times, the courier card and pickup details](docs/screenshots/customer-shipment-detail-light.webp)

![Payment success page: Payment received, with the shipment tracking ID, the amount of $17.00, the payment time and links to the shipment and payment history](docs/screenshots/customer-payment-success-light.webp)

### Courier

![Courier active tasks: cards for active tasks, delivered, total earned and unread notifications, and a searchable table of tasks with status, pickup and delivery contacts](docs/screenshots/courier-active-tasks-light.webp)

- **Active tasks** (pickups and deliveries that are not finished), most recently updated first, with search, status filter and sort. The home page shows active tasks, never "today's tasks", because the API has no date filter for them.
- **Task detail** with tap-to-call for sender and receiver, the address opened in a maps app, and only the next allowed status step (picked up, out for delivery, delivered, failed with a reason).
- **Proof of delivery**: take a photo with the phone camera or choose a file; it is checked (JPEG, PNG or WebP, up to 4 MB after compression) and compressed on the device, then uploaded with a progress bar.
- **Earnings** by day or month with payout status, an **availability** switch (unavailable couriers keep their tasks but get no new ones), **notifications** and **profile** (vehicle, number plate, zone and hub are shown read-only).

![Courier notifications: one unread notification, New task, with the tracking ID and the pickup address, plus Mark read and Mark all as read](docs/screenshots/courier-notifications-light.webp)

![Proof of delivery on a courier task: a selected photo preview with the size it was compressed to, Choose another and Upload photo buttons, beside the shipment journey](docs/screenshots/courier-proof-upload-light.webp)

### Admin

![Admin overview: net revenue, shipments, active couriers and failed delivery rate, an orange area chart of shipments booked per day with a 7, 14 and 30 day switcher, and a Needs attention list](docs/screenshots/admin-overview-light.webp)

- **Operations overview**: net revenue, shipments, active couriers, failed delivery rate, shipments booked per day (7, 14 or 30 days), shipments by status, payments by status, a "needs attention" list, recent activity and top couriers.
- **Shipments**: search, status, courier and date filters; assign, reassign and unassign couriers (only active, available couriers in the origin zone are offered); move parcels through the hubs step by step; return to sender; cancel.
- **Users**: search, role and status filters, a side sheet with courier details, activate and deactivate.
- **Payments**: totals and status filters, with refund and refund retry.
- **Reports**: the audit log with filters and a CSV export of the rows on screen.
- **Settings**: zones, hubs and pricing rules, each with create, edit, deactivate and delete as the API allows.
- **Profile**: name, phone, photo link and password.

![Admin shipments table: search, status and courier filters, a date range, and rows with tracking ID, customer and route, courier, status and payment badges and price](docs/screenshots/admin-shipments-light.webp)

![Admin users: search, role and status filters and a table of demo accounts with role badges, status, hub and vehicle, and join date](docs/screenshots/admin-users-light.webp)

![Admin settings, Zones tab: Los Angeles Metro and New York Metro with code, description, status and Edit, Deactivate and Delete actions](docs/screenshots/admin-settings-zones-light.webp)

![Admin settings, Pricing rules tab: rules per service and route with base price, per-pound fee and status](docs/screenshots/admin-settings-pricing-light.webp)

![Admin profile: the account summary, editable full name, phone and photo link, and a change password form](docs/screenshots/admin-profile-light.webp)

### Admin Viewer

![Admin shipments seen by the Admin Viewer: a View-only access banner above the same table, filters and search, with no write controls](docs/screenshots/admin-viewer-banner-light.webp)

- Every admin page, filter, search, sort, chart, side sheet and CSV export.
- A "View-only access" banner on every admin page. Create, edit, delete, assign, status, refund and activation controls are not rendered.
- The profile page is read-only: name, email, phone and role, with a view-only note and no edit or password form.
- Writes are refused three times over: the UI hides them, the BFF answers 403 before calling the API, and the API refuses them too.

![Admin Viewer profile: account summary and a read-only details panel with a View-only access note](docs/screenshots/admin-viewer-profile-light.webp)

### Mobile and dark mode

Every page is built mobile-first and checked at 375, 768 and 1280 pixels. Dashboards switch to a bottom navigation bar with a "More" sheet on small screens. Light and dark themes follow the device by default and can be switched from the header.

| Mobile home | Mobile dashboard |
|---|---|
| ![Home page on a 390 pixel wide phone: headline, buttons, tracking form and the start of the route illustration](docs/screenshots/mobile-home-light.webp) | ![Customer dashboard on a phone: greeting, time range switcher, stat cards and the bottom navigation bar](docs/screenshots/mobile-customer-dashboard-light.webp) |

![Home page hero in dark mode](docs/screenshots/home-hero-dark.webp)

![Customer overview in dark mode with stat cards and the recent shipments table](docs/screenshots/customer-overview-dark.webp)

![Admin overview in dark mode with the shipments per day chart and the Needs attention list](docs/screenshots/admin-overview-dark.webp)

## Route map

| Route | Purpose | Required role |
|---|---|---|
| `/` | Home page | Public |
| `/services` | Service levels compared | Public |
| `/pricing` | Live quote calculator | Public |
| `/track` | Tracking ID form | Public |
| `/track/[trackingId]` | Public tracking timeline (no personal details) | Public |
| `/about` | About Carrivo | Public |
| `/contact` | Support hours and a prepared email | Public |
| `/login` | Login form, Google sign-in, one-click demo buttons | Signed out (signed-in users are sent to their home) |
| `/register` | Create a customer account | Signed out |
| `/dashboard` | Customer overview | Customer |
| `/dashboard/shipments` | Shipment list with filters, sort and pagination | Customer |
| `/dashboard/shipments/new` | Three-step booking wizard | Customer |
| `/dashboard/shipments/[id]` | Shipment detail, timeline, pay, schedule pickup, cancel | Customer (own shipments only) |
| `/dashboard/payments` | Payment history | Customer |
| `/dashboard/notifications` | Notifications | Customer |
| `/dashboard/profile` | Profile and password | Customer |
| `/payment/success` | Stripe return page, verified with the API | Customer |
| `/payment/cancel` | Stripe cancel page | Customer |
| `/courier` | Active tasks | Courier |
| `/courier/tasks` | All tasks with filters | Courier |
| `/courier/tasks/[id]` | Task detail, status steps, proof upload | Courier (assigned tasks only) |
| `/courier/earnings` | Earnings and payouts | Courier |
| `/courier/notifications` | Notifications | Courier |
| `/courier/profile` | Availability, vehicle and area, profile and password | Courier |
| `/admin` | Operations overview with charts | Admin, Admin Viewer |
| `/admin/shipments` | All shipments | Admin, Admin Viewer |
| `/admin/shipments/[id]` | Shipment detail with assignment and status actions | Admin (actions), Admin Viewer (read-only) |
| `/admin/users` | Users and courier details | Admin, Admin Viewer |
| `/admin/payments` | Payments and refunds | Admin, Admin Viewer |
| `/admin/reports` | Audit log and CSV export | Admin, Admin Viewer |
| `/admin/settings` | Zones, hubs and pricing rules (`?tab=zones`, `hubs`, `pricing`) | Admin, Admin Viewer |
| `/admin/profile` | Admin profile (read-only for the viewer) | Admin, Admin Viewer |
| `/shipments/[id]` | Link target in emails: redirects each role to its own view of the shipment, or to login | Any (redirect) |

Route handlers (not pages): `/api/auth/login`, `/api/auth/register`, `/api/auth/demo`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/refresh`, `/api/auth/change-password`, `/api/auth/session-expired`, `/api/auth/google/start`, `/auth/google/callback` and the BFF proxy `/api/bff/[...path]`.

Every data page has a `loading.tsx` skeleton and every route group has an `error.tsx`; there are also a root `not-found.tsx` and `global-error.tsx`.

## Architecture

```mermaid
flowchart LR
  B["Browser"]

  subgraph Next["Next.js 16 app (Vercel)"]
    P["proxy.ts<br/>role routing from the signed cookie"]
    SC["Server Components<br/>pages, layouts, data loaders"]
    AUTH["Auth route handlers<br/>login, register, demo, Google, refresh, logout"]
    BFF["BFF proxy /api/bff/*<br/>allow-listed method and path pairs"]
    CACHE[("'use cache'<br/>zones, hubs, example prices")]
  end

  API[("Carrivo API<br/>separate backend")]
  STRIPE["Stripe Checkout<br/>(hosted, test mode)"]

  B -->|"page request"| P --> SC
  B -->|"same-origin fetch from client components"| BFF
  B -->|"sign in, sign out"| AUTH
  SC -->|"Bearer token from the httpOnly cookie"| API
  SC --> CACHE -->|"public reads, no token"| API
  AUTH --> API
  BFF -->|"Bearer token, visitor IP, shared header"| API
  B -->|"redirect to pay"| STRIPE -->|"return with session_id"| B
```

- **Server Components by default.** Pages, layouts and data loading run on the server and call the API directly with the token from the cookie. A file becomes a client component only for interactivity (forms, charts, filters, dialogs), and each one says why in its first comment.
- **Client components never see the token.** They call the same-origin BFF (`/api/bff/<api path>`), which attaches the token, forwards the visitor's IP and a shared header so the API rate-limits per visitor, streams bodies through (including multipart photo uploads) and returns the API's status unchanged. Only allow-listed method and path pairs are forwarded.
- **Auth route handlers** set and clear the cookies for login, registration, the demo buttons, Google sign-in, refresh and logout. Mutating handlers check the request's Origin.
- **One response envelope.** Success is `{ success: true, message, data, meta? }` and failure is `{ success: false, message, errors? }`; a single typed `ApiResponse<T>` and one `ApiError` class are used everywhere.

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The API surface the UI depends on: [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

## Authentication and sessions

```mermaid
sequenceDiagram
  autonumber
  actor U as Browser
  participant PX as proxy.ts
  participant RH as Auth route handler
  participant BFF as BFF /api/bff/*
  participant API as Carrivo API

  U->>RH: POST /api/auth/login (or /api/auth/demo with a role)
  RH->>API: Sign in
  API-->>RH: Bearer token, expiry, user
  RH-->>U: Set-Cookie carrivo_session (token) and carrivo_role (ROLE.EXP.signature), both httpOnly
  U->>PX: GET /dashboard
  PX->>PX: Verify the role cookie signature and expiry (no API call)
  PX-->>U: Page, or a redirect to /login or to the role's home
  Note over PX,API: The dashboard layout re-checks the user with GET /users/me
  U->>BFF: Client request (cookies sent automatically)
  alt Token expires in less than 24 hours
    BFF->>API: Rotate the token (single-flight: parallel requests share one rotation)
    API-->>BFF: New token
    BFF-->>U: Rewritten cookies
  end
  BFF->>API: Request with Bearer token
  API-->>BFF: 401 (session ended elsewhere)
  BFF-->>U: 401 SESSION_EXPIRED
  U->>RH: One shared POST /api/auth/refresh, then one retry
  RH-->>U: Still 401: cookies cleared, redirect to /login with a notice
```

- **Two cookies, both httpOnly, SameSite=Lax and Secure in production.** `carrivo_session` holds the API's bearer token. `carrivo_role` holds `ROLE.EXPIRY.SIGNATURE`, where the signature is an HMAC-SHA256 (keyed with `SESSION_SECRET`) over the role, the expiry and a hash of the token. Editing the role, or moving the cookie to another session, invalidates it.
- **proxy.ts is optimistic and cookie-only.** It routes `/dashboard`, `/courier`, `/admin` and `/payment` by the signed role, sends signed-in users away from `/login` and `/register`, and marks protected responses `Cache-Control: no-store` so Back after logout can't show a cached page. It never calls the API.
- **Layouts verify for real.** Each area layout calls `requireRole()`, which loads the user from `GET /users/me` (cached per request). A dead or changed session goes through `/api/auth/session-expired`, which clears the cookies and lands on `/login`.
- **Proactive, single-flight refresh.** The API only rotates a still-valid token and revokes the old one, so the BFF rotates when less than 24 hours remain, once per token even when many requests arrive together.
- **A 401 means logged out after one retry.** Parallel 401s share one `/api/auth/refresh` attempt, the request is retried once, and then the cookies are cleared and the visitor is sent to `/login` with a toast.
- **Demo login.** `POST /api/auth/demo` accepts only the Customer, Courier and Admin Viewer roles; the demo credential lives in a server-only variable and never reaches the browser.
- **Google sign-in** uses PKCE: `/api/auth/google/start` keeps the verifier in a short-lived httpOnly cookie and sends only the S256 challenge to the API; `/auth/google/callback` finishes the exchange and sets the session cookies.

## Permission matrix

| Capability | Customer | Courier | Admin | Admin Viewer |
|---|---|---|---|---|
| Track a parcel by tracking ID (public page) | Yes | Yes | Yes | Yes |
| Book, pay for and schedule pickups for own shipments | Yes | No | No | No |
| Cancel own shipment before pickup (refund if paid) | Yes | No | Yes (any shipment) | No |
| See own shipments and payment history | Yes | No | No | No |
| See assigned tasks, call contacts, open maps | No | Yes | No | No |
| Move a task to its next status, upload proof of delivery | No | Yes (assigned tasks) | No | No |
| Earnings, availability switch | No | Yes | No | No |
| Read every admin page, chart and filter; export CSV | No | No | Yes | Yes |
| Assign, reassign and unassign couriers; hub status steps; return to sender | No | No | Yes | No |
| Refunds and refund retry | No | No | Yes | No |
| Activate and deactivate users | No | No | Yes | No |
| Create, edit, deactivate and delete zones, hubs and pricing rules | No | No | Yes | No |
| Edit own profile, change password | Yes | Yes | Yes | No |
| Read notifications | Yes | Yes | Yes (bell) | Yes (bell) |
| Mark notifications read | Yes | Yes | Yes | No |

The rules live in one plain module, `src/lib/auth/permissions.ts` (`isStaff`, `isReadOnly`, `canMutate`), shared by the proxy, Server Components, the BFF and client components. Admin write controls are wrapped in `<CanMutate>` or checked with `canMutate()` on the server. Presentation is never the only guard: the API enforces roles and ownership on every request, and answers "not found" for another user's shipment.

## Data fetching and caching

**Server Components** load data with `serverFetch`, which adds the bearer token, the visitor's IP and the shared header, applies a 15 second timeout and turns failures into `ApiError`. Admin overview stats, lists and details all load on the server; independent requests run in parallel.

**Cache Components** (`cacheComponents: true`, with partial prefetching) shape every page:

- Public, rarely changing data (zones, hubs and the example quotes) is read without a token inside `"use cache"` functions with `cacheLife("hours")` and cache tags. Errors are never cached: a failed call throws and the section shows a fallback.
- Anything that reads cookies or headers, awaits `params` or `searchParams`, or uses the clock renders inside `<Suspense>` with a skeleton. Time and randomness only run after `await connection()`.
- The result is a static shell (the home page hero, headers and footers) with request-time parts streamed in. The public header's account menu is one of those parts, so the shell stays static for everyone.

**TanStack Query** handles the client-side server state that needs it: the unread notification count (polled every 60 seconds), notification lists and mark-read mutations, live price estimates in the wizard and the calculator, starting a checkout, verifying a payment on the success page (every 2 seconds for up to 15 seconds), refunds and status changes with optimistic updates and rollback. Defaults: 30 second stale time, one retry for network and server errors only, no retries for mutations.

**URL state.** Filters, search, sort and pagination live in the URL (`useUrlState`), so every list is bookmarkable and Back and Forward work as expected.

**Zustand** holds UI-only state: the signed-in user for client components, the collapsed sidebar and the booking wizard's draft (session storage).

## Forms and validation

Forms use React Hook Form with one Zod schema each, and the schemas mirror the API's own validation:

| Field | Rule |
|---|---|
| Name | 2 to 100 characters |
| US phone | A US number with a valid area code, optional +1 prefix, for example (212) 555-0142 |
| US address | Street, city, state (a select of US states) and ZIP (12345 or 12345-6789), sent to the API as one line under 300 characters |
| Weight | Pounds, more than 0 and at most 2,000 |
| Pickup window | Up to 12 hours long, any day in the next 30, in the business time zone |
| Change of credentials | At least 8 characters, confirmed, different from the current one |
| Photo link | Empty or a full https URL |

Field errors appear inline under the field and focus moves to the first one; API errors also map back onto fields when the API names them, and every mutation shows a toast. Server errors such as rate limits, conflicts and read-only refusals get plain-language messages.

## Payments

```mermaid
sequenceDiagram
  autonumber
  actor C as Customer
  participant APP as Carrivo web app
  participant API as Carrivo API
  participant S as Stripe Checkout (test mode)

  C->>APP: Pay (shipment detail, list or overview)
  APP->>API: Start checkout for the shipment (through the BFF)
  API->>S: Create a Checkout session for the locked price
  API-->>APP: checkoutUrl
  APP-->>C: Redirect to Stripe
  C->>S: Pay with a card
  S-->>C: Redirect to /payment/success?session_id=...
  APP->>API: Verify the session server-side
  API->>S: Look up the session (also reconciles a missed webhook)
  API-->>APP: Payment status
  APP-->>C: "Payment received", with the shipment and amount
```

- The price is calculated by the API and locked when the customer pays; editing weight or service before payment re-prices the shipment.
- The redirect alone proves nothing: the success page asks the API to verify the Stripe session and polls briefly while a webhook settles. The cancel page explains that nothing was charged.
- Card details go to Stripe's hosted page and never reach Carrivo. Stripe runs in test mode, so Stripe's documented test cards work.
- Cancelling before pickup refunds a paid shipment; admins can retry a refund that is stuck.

## Design system

**Direction:** orange on black and white, with light and dark themes. Tokens are defined once in `src/app/globals.css`; components never hard-code colours.

| Token | Light | Dark | Use |
|---|---|---|---|
| Brand | `#F05A16` | `#F05A16` | Primary actions, active states, key numbers, chart lines, unread badges. Never a status colour |
| Ink | `#191817` | `#191817` | Text on orange, sidebar, dark bands |
| Page | `#F7F7F6` | `#121110` | Background |
| Card | `#FFFFFF` | `#1C1B19` | Surfaces |
| Brand text | `#B8400B` | `#FF8A52` | Orange text that meets AA contrast |

- **Contrast.** Text on orange is ink (5.2:1), because white on this orange is only 3.4:1. Small orange text uses the darker or lighter brand-text token. Control borders meet 3:1.
- **Status colours.** Each shipment and payment status has its own tone (green success, blue information, amber warning, red danger, plus neutral and accent hues), and badges always pair an icon with words, so colour is never the only signal.
- **Typography.** Open Sans (variable, 400 to 800) everywhere, with tighter tracking on headings; tabular figures for numbers; JetBrains Mono only for tracking IDs and phone numbers.
- **Shapes.** Pill buttons, segmented controls and search fields; 20 pixel rounded cards with a very soft shadow; a near-black sidebar with the content in an inset rounded panel on desktop.
- **Illustrations.** Original inline SVG drawn with the theme tokens (the hero route and courier, service scenes, the tracking phone, the US coverage map, the role mini screens and the closing van), so they follow light and dark mode. Decorative drawings are hidden from screen readers; meaningful ones carry a label.
- **Motion.** The hero headline rises with CSS only and is never invisible. GSAP (with ScrollTrigger) loads after the first interaction or when the browser is idle, then moves the courier along the route, pulses the map pins and reveals cards; Lenis smooth scrolling runs on public pages only. Under `prefers-reduced-motion` there is no smooth scrolling, pinning, scroll reveal or decorative animation.
- **Accessibility.** Keyboard operable dialogs, menus, tabs, accordions and segmented controls with visible focus rings; focus returns to the control that opened a dialog; a skip link; semantic landmarks and headings; form errors announced inline.

## Performance

Measured locally with Lighthouse 12.8 (mobile preset, simulated throttling) on a local production build of the home page, five runs on 11/10/2026. These are local measurements, not the deployed site.

| Metric | Result |
|---|---|
| Performance | Median 89 (88 to 90 in four runs; one run at 81 where the deferred animation bundle loaded during the measurement) |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| Largest Contentful Paint | 3.6 s (simulated slow 4G) |
| Total Blocking Time | 70 to 120 ms |
| Cumulative Layout Shift | 0 |

What keeps it there:

- The hero, including its illustration, is server-rendered SVG and HTML in the static shell.
- Animation libraries never block first paint and never ship to the dashboards; the two hidden role-tab mini screens load on demand when their tab opens.
- Charts are loaded with `next/dynamic`; every streamed section has a skeleton of the same size, so nothing shifts.
- Images use `next/image`; proof photos are compressed on the device before upload.

## Tech stack

| Area | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Cache Components, partial prefetching) | Server Components for data pages, route handlers for the BFF, a static shell with streamed parts |
| UI runtime | React 19 | Server Components, Suspense streaming, transitions |
| Language | TypeScript (strict, no `any`) | Types for every API shape, checked on every build |
| Styling | Tailwind CSS 4 | Design tokens in one CSS file, light and dark themes |
| Components | shadcn/ui on Radix | Accessible primitives styled locally |
| Server state | TanStack Query | Polling, invalidation and optimistic updates |
| Client state | Zustand | UI state and the booking draft |
| Forms | React Hook Form and Zod | One schema per form that mirrors the API |
| Charts | Recharts | Composable charts, loaded lazily |
| Motion | GSAP with ScrollTrigger, Motion, Lenis | Public pages only, after first paint |
| Feedback | Sonner | A toast for every mutation |
| Icons | Lucide | One consistent icon set |
| Images | `next/image`, browser-image-compression | Optimised images; proof photos shrunk on the device |
| Dates | date-fns and `Intl` | Formatting in the business time zone so server and browser agree |

## Folder structure

```text
src/
  app/                 Routes and route handlers
    (public)/          Public site: home, services, pricing, tracking, about, contact
    (auth)/            Login and register
    dashboard/         Customer area
    courier/           Courier area
    admin/             Admin and Admin Viewer area
    payment/           Stripe return pages (success, cancel)
    shipments/         Role-aware redirect for links in emails
    api/auth/          Login, register, demo, Google start, refresh, logout, change of credentials, session expiry
    api/bff/           Same-origin proxy to the API for client components
    auth/google/       Google sign-in callback
  components/
    admin/             Admin tables, filters, side sheets, shipment actions, settings dialogs
    auth/              Login and register forms, demo buttons, role gates
    charts/            Area and bar chart wrappers
    courier/           Task list, status panel, proof uploader, earnings
    home/              Home page sections, motion and illustrations
    layout/            Site header and footer, dashboard shell, user and account menus, logout dialog
    motion/            Smooth scrolling (public pages)
    notifications/     Bell, list and filters
    payments/          Pay button, payment verifier and history
    profile/           Profile and change-of-credentials forms, page sections
    providers/         App providers (TanStack Query, theme, toasts)
    public/            Public building blocks: sections, live data, calculator, tracking form, dashboard preview
    shared/            Reusable UI: DataTable, StatCard, StatusBadge, SearchInput, EmptyState, PageHeader, ConfirmDialog, timeline
    shipments/         Shipment lists, detail parts, booking wizard, pickup scheduling
    ui/                shadcn/ui primitives
  config/              Navigation per role and site facts
  content/             Sample data for the illustrative previews
  hooks/               useAuth, useUrlState, useDebounce, usePagination, scroll behaviour
  lib/
    api/               Server and client fetch, endpoints, errors, BFF allow-list, client IP headers
    auth/              Session cookies, refresh, permissions, redirects, current user
    data/              Server data loaders per area, including cached public reads
    queries/           TanStack Query hooks
    validation/        Zod schemas, including the US rules
    geo/               Projection and hub placement for the coverage map
    admin/, courier/, payments/, motion/   Feature helpers
    (files)            Formatting, status metadata, time zone, US data, tracking IDs, weights
  stores/              Zustand stores
  types/               API types and enums
  proxy.ts             Role-based routing
docs/
  ARCHITECTURE.md      How the app is put together
  API_CONTRACT.md      The API surface the UI uses
  backend/             Copy of the backend's README and Postman collection
  screenshots/         README screenshots
public/                Static assets and app icons
tests/                 Unit tests (node --test)
```

## Getting started

**Prerequisites:** Node.js 20.9 or newer, npm, and a running Carrivo API (local or deployed; see the backend repository for setting one up with the seeded demo data).

```bash
npm install
cp .env.example .env.local   # fill in the values described below
npm run dev                  # http://localhost:3000
```

To check a production build locally:

```bash
npm run build
npm start
```

## Environment variables

Names only; never commit values. Locally they go in `.env.local` (copied from `.env.example`); on Vercel they go under Project Settings, Environment Variables.

| Variable | Purpose | Required | Exposed to the browser |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | This site's origin, without a trailing slash; used for metadata and the Origin check on writes | Yes | Yes |
| `API_BASE_URL` | Base URL of the Carrivo API, including `/api/v1` | Yes | No |
| `SESSION_SECRET` | Key that signs the role cookie (32 or more random characters) | Yes | No |
| `BFF_SHARED_SECRET` | Sent to the API with the visitor's IP so rate limits apply per visitor; must equal the API's value | Yes in production | No |
| `DEMO_PASSWORD` | Credential of the seeded demo accounts, used only by the demo route handler | Only for the demo buttons | No |
| `NEXT_PUBLIC_DEMO_CUSTOMER_EMAIL` | Account behind the Customer demo button | Only for the demo buttons | Yes |
| `NEXT_PUBLIC_DEMO_COURIER_EMAIL` | Account behind the Courier demo button | Only for the demo buttons | Yes |
| `NEXT_PUBLIC_DEMO_VIEWER_EMAIL` | Account behind the Admin (view-only) demo button | Only for the demo buttons | Yes |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Address the contact page prepares a message for | Optional | Yes |
| `NEXT_PUBLIC_BUSINESS_TIME_ZONE` | Business time zone (default America/New_York); must match the API | Optional | Yes |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint with the Next.js configuration |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm test` | Unit tests with the built-in `node --test` runner |

## Testing

- `npm test` runs 16 unit tests: US phone, ZIP and address rules; the business time zone, including daylight-saving changes; and the permission rules for all four roles.
- `npm run lint`, `npm run typecheck` and `npm run build` must all pass before a change is considered done. Pages are also checked in `npm run dev`, because some Cache Components errors only appear there.
- Role flows are checked by hand in development and in a production build for every role: sign-in and sign-out, every route on direct load, hard refresh and Back and Forward, refused writes for the Admin Viewer (including direct calls to the BFF), a tampered role cookie, light and dark mode, 375, 768 and 1280 pixel widths, reduced motion and JavaScript turned off on public pages. These checks are not automated yet.

## Deployment on Vercel

1. Import the repository into Vercel. The framework preset is Next.js and the build command is `npm run build`.
2. Add the environment variables for Production: `NEXT_PUBLIC_APP_URL`, `API_BASE_URL`, `SESSION_SECRET` and `BFF_SHARED_SECRET`; for the demo buttons, `DEMO_PASSWORD` and the three `NEXT_PUBLIC_DEMO_*_EMAIL` variables; optionally `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_BUSINESS_TIME_ZONE`.
3. Deploy, then configure the API for the new domain: its frontend URL, the payment success URL (`/payment/success`) and cancel URL (`/payment/cancel`), and its allowed CORS origins. Set the same shared header value on both projects.
4. Check each demo button, a test payment and a proof-of-delivery upload on the deployed site.

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `API_BASE_URL is not set` | Add it to `.env.local` (copy `.env.example`) and restart the server |
| Requests fail with 429 during development or `next build` | The API allows 300 requests per 15 minutes per visitor (20 failed sign-ins). Dev, the build's prerendering and browser test runs share one budget locally; wait for the window to pass |
| Sign-in or logout answers 403 "This request must come from the Carrivo site" | `NEXT_PUBLIC_APP_URL` doesn't match the address you opened; use the same origin, including the port |
| A demo button says the sign-in failed | `DEMO_PASSWORD` doesn't match the seeded demo accounts, or a `NEXT_PUBLIC_DEMO_*_EMAIL` variable is missing |
| `next build` fails in prerendering with "Cannot read properties of null (reading 'useContext')" | `NODE_ENV` is set to `development` in the shell; unset it before building |
| The dev overlay reports a blocking route or "uncached data was accessed outside of Suspense" | Something reads cookies, headers, `params`, `searchParams` or the clock outside `<Suspense>`; move it into a child component under a Suspense boundary |
| "encountered the unstable value Date.now() while prerendering" | Call `await connection()` before reading the clock in a Server Component |
| Every page bounces to `/login?reason=expired` | The session ended on the API or `SESSION_SECRET` changed; sign in again |
| Payment success page keeps saying it is confirming | The API could not verify the Stripe session yet; check the API's Stripe settings and success URL |

## Contributing and commit convention

- Read `docs/API_CONTRACT.md` before adding anything that talks to the API, and never invent endpoints, fields or response shapes; if the UI needs something the API doesn't offer, raise it first.
- Server Components by default; a client component states why in its first comment. Request-time data renders under `<Suspense>` with a skeleton.
- Reuse the shared building blocks (`DataTable`, `StatCard`, `StatusBadge`, `SearchInput`, `EmptyState`, `PageHeader`, `ConfirmDialog`) instead of copying UI. Every list has an empty state, every mutation a toast.
- Colours come from the tokens in `globals.css`; check contrast in both themes.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`, with an optional scope such as `feat(auth):`. Keep each commit small and focused on one change.
- Before opening a pull request, run `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`.

**Security reports.** Please report security issues privately through GitHub's private vulnerability reporting on this repository, not in a public issue. Include steps to reproduce, and don't access other people's data while testing.

## Roadmap

- Security headers and a Content Security Policy set by the frontend itself.
- Automated end-to-end tests for the four roles, run in CI against a seeded test API.
- An admin screen to create courier and admin accounts (the API supports it; the UI doesn't yet).
- Structured address fields in the API (today addresses travel as one validated line).
- Courier payout marking once the API exposes it.
- Lighthouse checks in CI with a performance budget.

## License

No license has been chosen yet; until a license file is added, all rights are reserved.

Author: Zarif Hasan
