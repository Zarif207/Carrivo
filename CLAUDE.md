# Carrivo Frontend: rules for Claude Code

Carrivo is a Courier & Logistics Platform. This repo is the **Next.js frontend** (Programming Hero B7A7).
The backend is already built and live. This repo only consumes it.

- Live API base: `https://carrivo-backend.vercel.app/api/v1`
- Roles: `CUSTOMER`, `COURIER`, `ADMIN` (the assignment calls them User / Provider / Admin), plus `ADMIN_VIEWER`: a read-only admin that sees all of `/admin` and can change nothing. Gate every admin write control with `<CanMutate>` / `canMutate()` (`src/lib/auth/permissions.ts`); the BFF refuses viewer writes too.
- Locale: US only. Weights in pounds (lb), money USD, US phones and addresses (`src/lib/us.ts`, `src/lib/validation/us.ts`), dates in `BUSINESS_TIME_ZONE` (America/New_York, `src/lib/timezone.ts`) shown as MM/DD/YYYY and 12-hour time.
- Currency: USD. The API returns money as strings/numbers in dollars; never show cents or BDT.

## Source of truth for the API

Never invent endpoints, field names or response shapes.
1. Read `docs/backend/postman_collection.json` and `docs/backend/README.md` (copied from the backend repo) first.
2. Keep a short `docs/API_CONTRACT.md` summarising what the UI uses (path, method, role, body, response). Update it when you learn something.
3. If something the UI needs is not in the docs, STOP and ask. Do not guess.

Response envelope: success is `{ success: true, message, data, meta? }`, failure is `{ success: false, message, errors? }`.
`meta` carries pagination. Write one typed `ApiResponse<T>` and one `ApiError` class and use them everywhere.

## Stack (fixed; do not swap)

Next.js (App Router) + TypeScript strict (no `any`), Tailwind CSS + shadcn/ui, TanStack Query,
Zustand (UI-only state), React Hook Form + Zod, Recharts, Sonner, Lucide, `next/image`, `next-themes`.
Package manager: npm.

## Architecture rules (these are marked by the assignment)

- **Server Components by default.** Add `"use client"` only for interactivity (forms, charts, filters, dialogs). Say why in a one-line comment on non-obvious ones.
- **Cache Components is on** (`cacheComponents: true`). Request-time data (anything that reads `cookies()`/`headers()`, authenticated `serverFetch`, `useSearchParams`, and `usePathname` on dynamic routes) must render inside `<Suspense>` with a skeleton fallback. That includes awaiting `params`/`searchParams` in a page: do it in a child component under `<Suspense>` (or the dev overlay flags the route as blocking). Cacheable public reads (zones, hubs, tracking) use `serverFetch(path, { auth: false })` inside a `"use cache"` function with `cacheLife(...)`.
- **Time and randomness are request data too.** In Server Components, `Date.now()`, `new Date()` and `Math.random()` may only run after `await connection()` (or `cookies()`/`headers()` plus `connection()`); otherwise dev reports "encountered the unstable value Date.now() while prerendering". Pass time into helpers explicitly (e.g. `readSession(store, now)`); route handlers and `proxy.ts` always run at request time, so they may read the clock directly.
- **Constants shared by server and client code live in plain modules** (`src/lib/...`), never in a `"use client"` file: a Server Component that imports a value (array, object, function) from a client module gets a client reference instead and crashes at runtime (`.map is not a function`). Components themselves can be imported normally.
- Every data page has `loading.tsx` (skeleton, never a full-page spinner) and every route group has `error.tsx`. Add `not-found.tsx` and `global-error.tsx`.
- **Auth via a thin BFF.** The browser never sees the API token.
  - Route handlers under `src/app/api/auth/*` call the backend, then store the token in an **httpOnly, Secure, SameSite=Lax cookie**.
  - Server Components read the cookie and call the backend directly.
  - Client components call `/api/bff/[...path]`, a same-origin proxy that attaches the token. This also avoids CORS.
  - Token refresh is **proactive**: the API's `/auth/refresh-token` only rotates a still-valid token (and revokes the old one), so the BFF rotates it before `expiresAt` (less than 24 h left), single-flight so parallel requests trigger one rotation.
  - A **401 means logged out after one retry**: parallel 401s share one `/api/auth/refresh` attempt (it only helps if another request already rotated the cookie), retry once, then clear cookies and redirect to `/login` with a toast. See `docs/API_CONTRACT.md` §3.5.
  - Every server-side API call sends `x-client-ip` (the visitor's IP) and `x-bff-secret` (`BFF_SHARED_SECRET`, server only) so the API rate-limits per visitor, not per Vercel server. `serverFetch` does this; the BFF proxy must pass the proxied request's IP.
- `middleware.ts` (or `proxy.ts`) protects `/admin/*`, `/courier/*`, `/dashboard/*` by role and redirects to the right home. Also hide or show UI by role.
- **Demo login buttons** (Customer, Courier, Admin (view-only)) call `POST /api/auth/demo` with `{ role }`; it accepts only CUSTOMER, COURIER and ADMIN_VIEWER. The demo password lives only in a server env var (`DEMO_PASSWORD`), never in client code or the bundle.
- Filters, search, sort and pagination live in the URL (`useSearchParams`), so every list is bookmarkable.
- Forms: React Hook Form + Zod. Zod rules must match backend validation (check the docs). Show field errors inline and a toast for API errors.
- Reuse: `DataTable`, `StatCard`, `StatusBadge`, `SearchInput`, `EmptyState`, `PageHeader`, `ConfirmDialog`. No copy-pasted UI. Extract hooks (`useAuth`, `useDebounce`, `usePagination`).
- Every list has an empty state; every mutation shows a toast; use optimistic updates for quick toggles and status changes.
- No Lorem ipsum, no placeholder images, no hardcoded data for real workflows.
- Public pages export `metadata` (title, description, Open Graph).

## Product decisions for API gaps (agreed after Phase 0)

- `/pricing` is a live quote calculator (`POST /pricing/estimate`); the rule list is admin-only.
- Contact form opens a pre-filled `mailto:` and says so honestly (there is no contact endpoint).
- Courier home shows **active tasks**, never "today's tasks" (no date filter exists).
- Admin charts: shipments per day, shipments by status, payments by status (no revenue time series).
- `/shipments/[id]` (email link target) redirects by role: CUSTOMER → `/dashboard/shipments/:id`, COURIER → `/courier/tasks/:id`, ADMIN / ADMIN_VIEWER → `/admin/shipments/:id`; logged out → `/login?next=/shipments/:id`.

## Design direction

**Orange on black and white**, light + dark with a toggle (default: match device). Tokens live once in `src/app/globals.css`; never hardcode hex in components.

- **Palette:** orange `#F05A16` (brand, the only accent), near-black `#191817` (ink), off-white `#F7F7F6` (page), white `#FFFFFF` (cards). Dark theme: page `#121110`, surfaces `#1C1B19` / `#242321`, low-contrast warm-grey borders, off-white text; orange stays the accent.
- **Orange is for:** primary actions, active states, key numbers, chart lines, unread badges. Everything else is black / white / grey. Orange is **never** a status colour.
- **Contrast rules (AA in both themes):** white on `#F05A16` is only 3.4:1, so text on orange fills is ink (`brand-foreground`, 5.2:1). Never use `#F05A16` for small text on light surfaces; use `text-brand-text` (`#B8400B` light, `#FF8A52` dark). `text-brand` is allowed only for large bold figures (≥ 24px bold). Control borders use `--input` (≥ 3:1). Run the contrast script after changing tokens.
- **Type:** Open Sans only (variable, 400-800). Headings 700-800 with slightly tight tracking (`font-display`). Numbers use `tabular` (tabular-nums). JetBrains Mono (`font-id`) **only** for tracking ids and phone numbers.
- **Status colours:** one tone per shipment and payment status (`src/lib/status.ts`, `--tone-*`): success green, info blues, warning amber (yellow, clearly not brand orange), danger red, plus slate/sky/violet/indigo/teal/cyan/fuchsia/rose/stone. Badges always show icon + words.
- **Shapes:** pill buttons, pill segmented controls (`SegmentedControl`, `TimeRangeSwitcher`), pill search fields with a leading icon; inputs 12px; cards white, 20px radius (`rounded-xl`), very soft shadow (`shadow-card`), generous padding; dashboard panel 28px (`rounded-panel`).
- **Dashboard shell:** near-black sidebar (`#191817` in both themes) with the content in an inset rounded panel on desktop (small gap, own scroll), full-bleed on mobile with a bottom bar. Active nav item = soft raised pill with an orange icon; counts are orange badges.
- **Cards and charts:** `StatCard` = small muted label above a large bold number (`variant="feature"` makes the one key number orange). Charts go inside `ChartCard`; `AreaTrendChart` draws an orange line with a soft gradient fill, muted grid, rounded tooltip. Lazy-load charts below the fold with `next/dynamic`.
- **Timeline:** neutral route line; the current stop is orange with a pulse (disabled under `prefers-reduced-motion`).
- **Public site (Phase 2):** off-white background, huge confident Open Sans headlines, an orange pill CTA, a tracking-id input card in the hero, large rounded cards, dark (`#191817`) footer. A framed product preview of the dashboard in the hero is welcome, built from real components (not an image).
- Dates render in `BUSINESS_TIME_ZONE` (America/New_York, `src/lib/timezone.ts`) so server and client match.
- Visible focus rings; keyboard-friendly dialogs, menus and segmented controls. Mobile-first: check 375px, 768px and 1280px for every page.
- Use the `frontend-design` skill (if available) when building pages so the result does not look like a template.

## Git (important)

- **NEVER run `git add`, `git commit`, `git push`, or anything that changes history or the remote.** The owner commits manually.
- Read-only git commands are fine.
- At the end of every task, list commit-sized chunks with files and a conventional message
  (`feat:`, `fix:`, `chore:`, `refactor:`, `style:`, `docs:`). The assignment needs **20+ meaningful commits**, so keep chunks small and specific.

## Workflow

- After implementing, run `npm run lint`, `npm run typecheck` (or `npx tsc --noEmit`) and `npm run build`. Fix errors before reporting.
- **Always test in `npm run dev` as well as a production build; Cache Components errors can appear only in dev.** Partial Prefetching's runtime prerender (with cookies available) runs in dev and can flag blocking routes that `next build` never sees. Log in as each role and open every route (direct load, hard refresh, Back/Forward) with the console open: no dev overlay issues, no errors, no hydration warnings.
- **The live API rate-limits 300 requests per 15 minutes per visitor IP** (auth routes: 20). Locally, dev, the production build (its prerender fetches) and browser test sweeps all share one bucket, so keep sweeps lean; a 429 during testing is the limiter, not a bug, and `next build` fails while it lasts.
- Report briefly: what works, what you verified, what differs from the plan, then the suggested commits.
- Never print or log tokens, passwords or secrets. Never commit `.env*` (keep `.env.example` current).

## Environment variables

```
NEXT_PUBLIC_APP_URL=            # this site's URL, e.g. http://localhost:3000
API_BASE_URL=                   # https://carrivo-backend.vercel.app/api/v1 (server only)
SESSION_SECRET=                 # server only, 32+ random chars; signs the role cookie the proxy trusts
BFF_SHARED_SECRET=              # server only, sent as x-bff-secret with x-client-ip (must match the backend)
DEMO_PASSWORD=                  # server only, used by /api/auth/demo
NEXT_PUBLIC_DEMO_VIEWER_EMAIL=viewer@carrivo.dev   # "Admin (view-only)" demo; the real admin is never a demo
NEXT_PUBLIC_DEMO_COURIER_EMAIL=courier1@carrivo.dev
NEXT_PUBLIC_DEMO_CUSTOMER_EMAIL=customer1@carrivo.dev
```

## Definition of done for the project

18+ real pages, all 3 roles working end to end, real Stripe test payment with success and cancel pages,
proof-of-delivery upload, charts on the admin dashboard, one-click demo login working **in production**,
20+ commits, deployed on Vercel.
