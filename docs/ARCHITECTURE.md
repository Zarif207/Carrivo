# Carrivo frontend architecture

How the Next.js 16 App Router app is put together, with the files that prove each point. The backend
(`https://carrivo-backend.vercel.app/api/v1`) is a separate project; this app only consumes it.

## 1. Server and Client Components

**Server Components are the default.** Pages, layouts and data loading run on the server; a file gets
`"use client"` only when it needs state, effects, browser APIs or event handlers, and each such file
says why in its first comment.

| Server (no `"use client"`) | What it does |
|---|---|
| `src/app/dashboard/shipments/page.tsx` | Reads `searchParams`, calls the API, renders the list |
| `src/app/admin/page.tsx` | Loads dashboard stats + audit log in parallel, renders stat cards and panels |
| `src/app/courier/tasks/[id]/page.tsx` | Loads one task; 404s for another courier's shipment |
| `src/components/shipments/detail-parts.tsx` | Cards, rows, phone links, proof image (server-safe building blocks) |
| `src/components/shipments/pickup-card.tsx` | Picks the right pickup state; embeds the client dialog only when needed |

| Client (`"use client"`) | Why it must be a client component |
|---|---|
| `src/components/shipments/shipment-status-panel.tsx` | Optimistic cancel with rollback, Pay button |
| `src/components/shipments/wizard/new-shipment-wizard.tsx` | 3-step form, Zustand draft in sessionStorage, live price estimate |
| `src/components/courier/proof-uploader.tsx` | File picker, drag and drop, compression, XHR upload progress |
| `src/components/admin/shipment-actions.tsx` | Next-step buttons, courier picker, optimistic status |
| `src/components/notifications/notification-bell.tsx` | TanStack Query polling + optimistic mark-as-read |
| `src/components/charts/*.tsx` | Recharts measures in the browser (below-the-fold charts load via `next/dynamic`) |

Server components pass **plain data** to client components (never functions); values shared by both
sides live in plain modules such as `src/lib/status.ts` and `src/lib/admin/settings-tabs.ts`.

## 2. Authentication: a thin BFF with httpOnly cookies

The browser never sees the API token.

```
Browser ──POST /api/auth/login──▶ Route Handler ──▶ API /auth/login
        ◀── Set-Cookie: carrivo_session (token, httpOnly)
                         carrivo_role   (ROLE.EXP.HMAC, httpOnly)
```

- **Route handlers** `src/app/api/auth/*/route.ts` (login, register, logout, demo, refresh, me,
  change-password, session-expired, google/start) and `src/app/auth/google/callback/route.ts` talk to the
  API and set or clear cookies. Every mutating handler checks `Origin` (`src/lib/auth/http.ts`).
- **Cookies** `src/lib/auth/session.ts`: the role cookie is `ROLE.EXP.HMAC(SESSION_SECRET, …sha256(token))`,
  so it can't be forged or moved to another token.
- **Route protection** `src/proxy.ts` (Next 16's middleware): `/dashboard`, `/payment` → CUSTOMER,
  `/courier` → COURIER, `/admin` → ADMIN or ADMIN_VIEWER (read-only), read from the signed cookie only (no API call). Wrong role →
  that role's home; no session → `/login?next=…`.
- **Re-verification** `src/lib/auth/current-user.ts`: `getCurrentUser()` (React `cache()`, one
  `GET /users/me` per request) and `requireRole()`, called by `src/components/layout/authed-shell.tsx`
  in every area layout and again by each admin data loader (`src/lib/data/admin.ts`).
- **Client calls** go through the same-origin proxy `src/app/api/bff/[...path]/route.ts`: an allow-list
  (`src/lib/api/bff-allowlist.ts`) of the endpoints the UI uses; it attaches the token, forwards the
  visitor IP (`x-client-ip`) with `x-bff-secret` so the API rate-limits per visitor, streams bodies
  (multipart uploads pass straight through) and rotates the token proactively when under 24 h remain
  (`src/lib/auth/refresh.ts`, single-flight).
- **401 handling** `src/lib/api/client.ts`: parallel 401s share one `/api/auth/refresh`, the request is
  retried once, then the session ends (`endSession`) with a toast and `/login?next=…`.
- **Demo login** `src/app/api/auth/demo/route.ts` reads `DEMO_PASSWORD` on the server only.

## 3. Data fetching and caching

| Kind | Where | How |
|---|---|---|
| Public, rarely changing (zones, hubs, price examples) | `src/lib/data/public.ts` | `"use cache"` + `cacheLife("hours")` + `cacheTag`; `serverFetch(path, { auth: false })` |
| Signed-in reads | `src/lib/data/session-fetch.ts`, `customer.ts`, `courier.ts`, `admin.ts` | `await connection()` first (request time), token from the cookie, 401 → `/api/auth/session-expired` |
| Counts for stat cards | `sessionCount()` in `session-fetch.ts` | `limit=1` and read `meta.total` (one small request per count) |
| Client reads that poll or update optimistically | `src/lib/queries/notifications.ts`, `pricing.ts` | TanStack Query; query keys in `src/lib/api/query-keys.ts` |
| Mutations | client components | `apiFetch` through the BFF, toast, then `router.refresh()` so Server Components re-read |

`src/lib/api/server.ts` (`serverFetch`) is the only place that calls the API from the server: 15 s
timeout, typed envelope (`ApiSuccess<T>`), one `ApiError` class (`src/lib/api/errors.ts`).

**Cache Components** is on (`next.config.ts`). Anything request-time (cookies, `params`,
`searchParams`, the clock) renders inside `<Suspense>` after `await connection()`; see
`src/app/dashboard/page.tsx` (`Overview` reads the clock only after `connection()`).

## 4. URL state

Filters, search, sort and pagination live in the URL, so every list is bookmarkable and survives a
refresh or Back.

- `src/hooks/use-url-state.ts`: `get` / `set` / `hrefWith` over `useSearchParams` (filters reset `page`).
- `src/lib/list-params.ts`: the server side parses and **validates** the same params (`parseListParams`,
  `pickEnum`, `pickDate`), so a hand-edited URL can't cause an API 400.
- `src/components/shared/data-table.tsx`: sortable headers write `sortBy`/`sortOrder` (and keep keyboard
  focus on the header after the list re-renders); `src/components/shared/pagination.tsx` renders real links.
- Each list page keys its results `<Suspense>` on the parsed query, so every change shows a skeleton:
  `src/app/admin/shipments/page.tsx`.
- Sheets and tabs too: `?view=<userId>` opens the user sheet (`src/app/admin/users/page.tsx`),
  `?tab=` picks the settings tab (`src/app/admin/settings/page.tsx`), `?range=` the time range.

## 5. Loading, error and empty states

| Boundary | File | Covers |
|---|---|---|
| Skeletons | `loading.tsx` in every data route, e.g. `src/app/admin/shipments/loading.tsx` | Route transitions |
| Section skeletons | `<Suspense fallback>` in each page | Streaming parts of a page independently |
| Area errors | `src/app/{dashboard,courier,admin,payment}/error.tsx` → `src/components/layout/area-error.tsx` | A page inside an area failing; **Try again calls `retry()`**, which re-fetches |
| Layout / root errors | `src/app/error.tsx` | The session check in an area layout timing out (e.g. API cold start) |
| Last resort | `src/app/global-error.tsx` | The root layout itself |
| Section errors | `src/components/shared/load-error.tsx` | One panel failing while the rest of the page works (inline card + toast + retry) |
| Not found | `not-found.tsx` per detail route, e.g. `src/app/courier/tasks/[id]/not-found.tsx` | Unknown ids and other users' records (the API answers 404 for both) |
| Empty states | `src/components/shared/empty-state.tsx`, used by every table | "No results" vs "nothing yet" with a next step |

Mutations keep their dialog open on failure (`src/components/shared/confirm-dialog.tsx`: the handler
throws to keep it open) and roll optimistic changes back.

## 6. Folder map

```
src/
  app/                 routes: (public) site, (auth) login/register, dashboard (customer),
                       courier, admin, payment (Stripe return pages), api/auth + api/bff (BFF)
  components/          ui/ (shadcn), shared/ (DataTable, StatCard, dialogs…), feature folders
  lib/api/             serverFetch, apiFetch, endpoints, errors, BFF allow-list, query keys
  lib/auth/            cookies, session, redirects, current user
  lib/data/            server-side loaders per area (public, customer, courier, admin)
  lib/validation/      Zod schemas mirroring the API's rules
  stores/              Zustand (auth user, shipment draft, UI)
  types/               API types and enums (state machine in types/enums.ts)
  proxy.ts             role-based route protection
```
