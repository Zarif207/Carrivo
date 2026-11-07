# Carrivo Frontend Plan (B7A7)

Feed these to Claude Code **one phase at a time**. Do not start a phase until the previous one's "Done when" is true.
Claude Code never commits; you commit using the list it gives you after each phase.

## Schedule (today is Sat 7 Nov; submit by Sun 15 Nov)

| Day | Date | Phases |
|---|---|---|
| 1 | Sun 8 Nov | 0 setup + 1 design system |
| 2 | Mon 9 Nov | 2 public pages + 3 auth |
| 3 | Tue 10 Nov | 4 customer |
| 4 | Wed 11 Nov | 5 payments + 6 courier |
| 5 | Thu 12 Nov | 7 admin |
| 6 | Fri 13 Nov | 8 polish + deploy |
| 7 | Sat 14 Nov | production test, video, fixes |
| 8 | Sun 15 Nov | submit early, do not wait for the last hour |

NOTE: the assignment README says the deadline is 10 October 2026. Confirm 15 November with your instructor or portal.

## Pages (21)

| Group | Route | Notes |
|---|---|---|
| Public (6) | `/`, `/about`, `/services`, `/contact`, `/pricing`, `/track` (+ `/track/[trackingId]`) | pricing and tracking use real API data |
| Auth (2) | `/login` (demo buttons), `/register` | Google sign-in on both |
| Customer (5) | `/dashboard`, `/dashboard/shipments`, `/dashboard/shipments/new`, `/dashboard/shipments/[id]`, `/dashboard/payments`, `/dashboard/profile` | new = 3-step wizard |
| Courier (4) | `/courier`, `/courier/tasks/[id]`, `/courier/earnings`, `/courier/profile` | proof upload on task page |
| Admin (5) | `/admin`, `/admin/shipments`, `/admin/users`, `/admin/payments`, `/admin/reports` (+ zones/hubs/pricing under `/admin/settings`) | charts on `/admin` |
| Utility (4) | `not-found`, `error`, `/payment/success`, `/payment/cancel` | |

The roles use `/dashboard` (customer) and `/courier` (provider). The assignment's route list is an example, so this is fine.

---

## Phase 0: Setup and API contract

```
Read CLAUDE.md fully. Then:
1. Create the Next.js app in this folder (App Router, TypeScript, Tailwind, ESLint, src dir, npm). Do not commit.
2. Install: @tanstack/react-query zustand react-hook-form @hookform/resolvers zod recharts sonner lucide-react next-themes browser-image-compression date-fns clsx. Init shadcn/ui and add: button card input label form select dialog sheet dropdown-menu table tabs badge skeleton avatar separator tooltip sonner calendar popover checkbox switch textarea.
3. Create .env.example and .env.local from the env section of CLAUDE.md (leave DEMO_PASSWORD empty; I will fill it).
4. I have copied the backend docs into docs/backend/. Read postman_collection.json and README.md and write docs/API_CONTRACT.md: every endpoint the UI will use, grouped by role (public, auth, customer, courier, admin), with method, path, who may call it, request body, response shape, and enum values (shipment statuses, payment statuses, roles). Also document exactly how login, logout, token refresh and Google sign-in work.
5. Create src/lib/api (typed ApiResponse<T>, ApiError, server fetch helper, query keys) and src/types (generated from the contract).
6. Do not build any pages yet.
Report: anything in the docs that was unclear or missing, and the commit list.
```
**Done when:** `npm run build` passes, `docs/API_CONTRACT.md` exists and matches the Postman collection, and the auth flow is written down.

## Phase 1: Design system and layouts

```
Build the design system. Bold and modern, light + dark.
1. Tokens in globals.css (brand, accent, surface, border, success/warning/danger, radius, shadow) for both themes. Pick a strong, memorable palette for a logistics brand (not default blue/grey) and a display + body font pair via next/font. Explain the choices in 3 lines.
2. ThemeProvider with a toggle (system default), QueryClientProvider, Sonner Toaster.
3. Shared components: Logo, ThemeToggle, StatCard, StatusBadge (one colour per shipment/payment status from the contract), DataTable (sort, loading skeleton, empty state), SearchInput (debounced, URL-synced), Pagination (URL-synced), EmptyState, PageHeader, ConfirmDialog, FormField wrappers, Timeline (for shipment events).
4. Layouts: public layout (sticky navbar + footer, mobile sheet menu), and one DashboardShell used by customer, courier and admin (collapsible sidebar on desktop, bottom or sheet navigation on mobile, role-specific nav items, user menu).
5. Create a temporary /dev/ui page that shows every component in both themes, for checking only. Add it to the commit notes as removable.
Use the frontend-design skill if available. Check 375/768/1280 widths.
```
**Done when:** every component works in light and dark, the shells collapse correctly on mobile, and the build passes.

## Phase 2: Public pages

```
Build the public pages with real content about Carrivo (courier and logistics in Bangladesh-style zones/hubs as the API describes them; no lorem ipsum, no placeholder images):
/ (hero with a tracking input, how it works, services, stats, pricing teaser, CTA), /about, /services, /contact (validated form; if the API has no contact endpoint, show a success state without pretending to email, and say so in your report), /pricing (reads real pricing rules from the public/authorised endpoint in the contract; if it needs auth, explain and propose), /track and /track/[trackingId] (public tracking timeline, never showing private data).
Add not-found.tsx, error.tsx, global-error.tsx, loading.tsx where data is fetched, and metadata (title, description, Open Graph) for each public page. Use next/image for all imagery (use generated SVG or CSS illustrations; no stock placeholders).
```
**Done when:** all public pages render from the server, tracking works with a real tracking id from the seed data, and Lighthouse SEO is 90+.

## Phase 3: Auth, middleware and demo login

```
Implement authentication exactly as docs/API_CONTRACT.md describes.
1. Route handlers: /api/auth/login, /register, /logout, /demo, /me, and the Google sign-in start and callback handoff. Store the token in an httpOnly Secure SameSite=Lax cookie. Never expose it to client JS.
2. /api/bff/[...path] proxy for client-side calls, attaching the token. Implement single-flight refresh: concurrent 401s trigger one refresh then retry once; on failure clear cookies and redirect to /login with a toast.
3. middleware.ts: protect /admin, /courier, /dashboard by role; redirect logged-in users away from /login and /register; send each role to its home.
4. /login and /register pages: validated forms (Zod matching backend rules), "Continue with Google", and a Quick Demo Login section with three clearly distinct buttons (Admin, Courier, Customer) that call /api/auth/demo. DEMO_PASSWORD is read only on the server.
5. useAuth hook + a small Zustand store for the current user (non-sensitive profile only). Role-based UI helpers (<RoleGate>).
6. Skeleton dashboards for all three roles so redirects land somewhere.
Test every flow in the browser: login, wrong password, demo login x3, logout, direct URL to a forbidden route.
```
**Done when:** all three demo buttons land on the right dashboard, forbidden routes redirect, logout clears access, and the token is not visible in document.cookie or localStorage.

## Phase 4: Customer experience

```
Build the customer area using real API data:
- /dashboard: stat cards (active, delivered, spend), recent shipments, notification bell.
- /dashboard/shipments: DataTable with search, status filter, sort and pagination, all in the URL; empty state; skeletons.
- /dashboard/shipments/new: 3-step wizard (1 sender and receiver details, 2 parcel details + zone/service with a live price quote from the pricing endpoint, 3 review and confirm). Persist the draft in Zustand so a refresh does not lose it. Zod per step matching backend rules.
- /dashboard/shipments/[id]: details, status Timeline, courier info if assigned, proof-of-delivery image when delivered (next/image), Cancel with ConfirmDialog (optimistic), and a Pay button when unpaid.
- /dashboard/profile: validated profile form and change-password if the API supports it.
- Notifications dropdown and list from the notifications API.
```
**Done when:** a new customer can create a shipment, see it in the list, open it, and cancel it; all filters survive a refresh.

## Phase 5: Stripe payments

```
Implement the payment flow from the contract.
- Pay button calls the initiate endpoint, then redirects to the returned Stripe Checkout URL (test mode).
- /payment/success reads the session id from the query, calls the verify endpoint, and shows the real status (PAID / still processing / failed) with a polling retry for a few seconds if the webhook is slower than the redirect. Do not trust the redirect alone.
- /payment/cancel explains nothing was charged and offers "Try again" and "Back to shipment".
- /dashboard/payments: history table with status badges, receipts/links if available, refund state (pending/refunded).
Test with card 4242 4242 4242 4242 (any future date, any CVC) and decline card 4000 0000 0000 0002.
```
**Done when:** a real test payment moves a shipment to paid, the decline path shows a clear error and allows retry, and refreshing the success page is safe.

## Phase 6: Courier experience

```
Build the courier area:
- /courier: today's tasks list with status filters (URL state), stat cards, empty state.
- /courier/tasks/[id]: task details, allowed next-status buttons only (read the allowed transitions from the contract), optimistic status updates with rollback on error, a Timeline, and Proof of delivery upload: pick or drop an image, compress client-side to under 3.5 MB (browser-image-compression; the API limit is 4 MB and only real PNG/JPEG/WebP are accepted), show a preview and an upload progress bar (XHR through the BFF), then show the stored image.
- /courier/earnings: Recharts chart plus a table of earnings.
- /courier/profile: validated profile and availability toggle if the API supports it.
```
**Done when:** a courier can move a seeded task through its states, upload proof, and see it appear for the customer and admin.

## Phase 7: Admin

```
Build the admin area:
- /admin: stat cards from dashboard-stats, at least 2 Recharts charts (revenue over time, shipments by status), recent activity.
- /admin/shipments: DataTable (URL-synced filters), assign courier dialog, status override only if the API allows it.
- /admin/users: list, activate/deactivate with ConfirmDialog, role badges.
- /admin/payments: list, status filter, refund retry action where the contract supports it.
- /admin/reports: audit logs with filters and pagination.
- /admin/settings: zones, hubs and pricing rules CRUD with validated dialogs.
Every list needs skeleton, empty state, and error toast.
```
**Done when:** each admin action works against the live API and updates the UI without a full reload.

## Phase 8: Polish, performance, deploy

```
1. Run Lighthouse on /, /login and one dashboard; fix the top issues (images, fonts, bundle size, dynamic import for charts).
2. Check responsive layouts at 375/768/1280 for every page; fix overflow.
3. Check keyboard navigation, focus rings, aria-labels on icon buttons, contrast in both themes.
4. Remove /dev/ui and any dead code; no console errors or hydration warnings.
5. Write README.md: overview, screenshots placeholders list, tech stack, setup, env vars, demo accounts (emails only), scripts.
6. Make sure .env.example is complete. Do not commit any secrets.
```
**Done when:** build, lint and tsc are clean, no hydration warnings, Lighthouse performance is 85+ on mobile for public pages.

---

## Deploy checklist (I will do the backend half for you)

1. You: push the repo, import it into Vercel, add the env vars from `.env.example` (Production), including `API_BASE_URL` and `DEMO_PASSWORD`.
2. You tell me the frontend URL. I set on the backend Vercel project: `CORS_ORIGINS`, `FRONTEND_URL`, `FRONTEND_SUCCESS_URL`, `FRONTEND_CANCEL_URL`, then redeploy it.
3. You add the frontend callback to Google OAuth redirect/origin settings if Phase 3 needs it.
4. Test in production: three demo logins, a real 4242 payment, proof upload.

## Submission block

```
Project Name            : Carrivo (Courier & Logistics Platform)
Backend Repo            : https://github.com/Zarif207/carrivo-backend
Frontend Repo           : <your frontend repo>
Live Backend URL        : https://carrivo-backend.vercel.app/api/v1
Live Frontend URL       : <vercel url>
API Documentation       : <postman docs link>
Demo Video              : <loom link>
Demo Admin Email        : admin@carrivo.dev
Demo Admin Password     : <your demo password>
```

## Video checklist (5–10 minutes)

1. Overview and design choices (bold, tokens, dark mode toggle).
2. Server vs Client components; show `layout.tsx` and `loading.tsx` working.
3. Demo login as customer, then log out and log in as admin; show different navigation and a blocked route.
4. A data-heavy page: skeleton, populated table, TanStack Query caching in the Network tab.
5. Invalid form data (Zod errors) and an API error toast.
6. Responsive: DevTools device mode.
7. Payment: create shipment, pay with 4242, success page, courier proof upload.
