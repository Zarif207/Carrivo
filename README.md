# Carrivo: courier and logistics platform (frontend)

Book a parcel, pay by card, and follow it door to door. Couriers work their pickups and deliveries from
a phone; admins run zones, hubs, pricing, assignments, payments and users. This repository is the
**Next.js frontend**; it consumes the separate Carrivo API.

- **Live site:** `<https://your-frontend.vercel.app>`
- **API:** `<https://carrivo-backend.vercel.app/api/v1>`
- **Backend repository:** `<https://github.com/you/carrivo-backend>`
- **Demo video:** `<link>`

## Features

**Everyone (public site)**
- Home, About, Services, Contact (opens a pre-filled email; there is no contact endpoint)
- Live price calculator (`/pricing`) and parcel tracking by ID (`/track/CRV-…`)
- One-click demo login for each role

**Customer** (`/dashboard`)
- Overview with active / delivered / spend for today, this week, month or year
- Book a shipment in three steps with a live price; the draft survives a refresh
- Pay by card with Stripe Checkout; success page verifies with the API (refresh-safe), cancel page offers a retry
- Schedule the pickup window after paying
- Shipment detail with timeline, courier, proof-of-delivery photo, cancel (with refund when paid)
- Payment history, notifications (bell + full list), profile and password

**Courier** (`/courier`)
- Active tasks with search, status filter, sort; tap-to-call sender and receiver; open in Maps
- Only the next allowed status (picked up, delivered, failed with a reason, retry)
- Proof-of-delivery photo: camera or file, type check, compression to under 3.5 MB, upload progress, replace
- Earnings by day / month with a chart and payout status; availability on/off

**Admin** (`/admin`)
- Operations overview: revenue, shipments per day, shipments and payments by status, needs-attention panel, recent activity
- Shipments: filters (status, courier, dates), assign / reassign / unassign a courier, hub steps, return, cancel
- Users: search and filters, side sheet with courier details, activate / deactivate
- Payments: totals, status and needs-review filters, refund retry
- Reports: audit log with filters and CSV export of the rows on screen
- Settings: zones, hubs and pricing rules (create, edit, deactivate, delete as the API allows)

**Admin (view-only)** (`/admin`, role `ADMIN_VIEWER`)
- Every admin page, filter, search, sort, chart, side sheet and CSV export, with a "View-only access" banner
- No write controls at all (create, edit, delete, assign, status steps, refunds, activation); the BFF and the API refuse viewer writes as well

## Tech stack

Next.js 16 (App Router, Cache Components, `proxy.ts`), React 19, TypeScript (strict), Tailwind CSS 4,
shadcn/ui (Radix), TanStack Query, Zustand, React Hook Form + Zod, Recharts, Sonner, Lucide,
`next/image` (Cloudinary), `next-themes`, browser-image-compression.

How it fits together (Server vs Client components, the BFF and cookie auth, caching, URL state,
boundaries): see **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**. The API surface the UI uses is in
**[docs/API_CONTRACT.md](docs/API_CONTRACT.md)**.

## Getting started

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

### Environment variables

Names only; never commit real values (`.env*` files other than `.env.example` are git-ignored).

| Variable | Scope | What it is | Production note |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | public | This site's origin, no trailing slash | Your Vercel domain. Used for metadata and the Origin check on every mutating route |
| `API_BASE_URL` | server | API base including `/api/v1` | `https://carrivo-backend.vercel.app/api/v1` |
| `SESSION_SECRET` | server | Signs the role cookie (32+ random chars) | Generate a new one (`openssl rand -base64 48`); changing it signs everyone out |
| `BFF_SHARED_SECRET` | server | Sent as `x-bff-secret` with `x-client-ip` | Must equal the backend's value (the API then rate-limits per visitor) |
| `DEMO_PASSWORD` | server | Password of the seeded demo accounts | Same as the backend seed; used only by `/api/auth/demo` |
| `NEXT_PUBLIC_DEMO_VIEWER_EMAIL` | public | Read-only admin demo account (the "Admin (view-only)" button) | `viewer@carrivo.dev` |
| `NEXT_PUBLIC_DEMO_COURIER_EMAIL` | public | Demo courier email | `courier1@carrivo.dev` |
| `NEXT_PUBLIC_DEMO_CUSTOMER_EMAIL` | public | Demo customer email | `customer1@carrivo.dev` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | public | Address the contact form opens | Optional (defaults to `support@carrivo.dev`) |
| `NEXT_PUBLIC_BUSINESS_TIME_ZONE` | public | Time zone for dates, filters and pickup windows | Optional (defaults to `America/New_York`; must match the API) |

The backend must point back at this site: its `FRONTEND_URL`, `FRONTEND_SUCCESS_URL`
(`<site>/payment/success`) and `FRONTEND_CANCEL_URL` (`<site>/payment/cancel`) use your frontend domain.

### Demo accounts

| Role | Email |
|---|---|
| Admin (view-only) | `viewer@carrivo.dev` |
| Courier | `courier1@carrivo.dev` |
| Customer | `customer1@carrivo.dev` |

Use the **demo buttons on `/login`**: the password stays on the server. "Admin (view-only)" opens every
admin page with all write controls hidden; the real admin account is not a demo and signs in with the form. Stripe test card:
`4242 4242 4242 4242`, any future date, any CVC (decline: `4000 0000 0000 0002`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (Next + React Compiler rules) |
| `npm run typecheck` | Generate route types, then `tsc --noEmit` |
| `npm test` | Unit tests (`node --test`): US phone/ZIP/address rules, the business time zone (DST), admin permissions |

## Project structure

```
src/
  app/            (public) site, (auth) login/register, dashboard/ (customer), courier/, admin/,
                  payment/ (Stripe return pages), api/auth + api/bff (the BFF), error and not-found pages
  components/     ui/ (shadcn), shared/ (DataTable, StatCard, dialogs, form fields), feature folders
  lib/            api client and server fetch, auth, server data loaders, Zod schemas, formatting
  stores/         Zustand stores
  types/          API types and enums
  proxy.ts        role-based route protection
docs/
  ARCHITECTURE.md   how the app is built
  API_CONTRACT.md   the API endpoints the UI uses
```

## Deploying to Vercel

1. Import the repository; framework preset **Next.js**, build command `npm run build`.
2. Add the environment variables above for **Production** (and Preview if you use it).
3. Deploy, then set the backend's `FRONTEND_URL`, `FRONTEND_SUCCESS_URL` and `FRONTEND_CANCEL_URL` to the new domain.
4. Check: demo login for each role, a 4242 test payment, and a proof photo upload.
