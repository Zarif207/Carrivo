# Carrivo Frontend: rules for Claude Code

Carrivo is a Courier & Logistics Platform. This repo is the **Next.js frontend** (Programming Hero B7A7).
The backend is already built and live. This repo only consumes it.

- Live API base: `https://carrivo-backend.vercel.app/api/v1`
- Roles: `CUSTOMER`, `COURIER`, `ADMIN` (3 fixed roles; the assignment calls them User / Provider / Admin)
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
- Every data page has `loading.tsx` (skeleton, never a full-page spinner) and every route group has `error.tsx`. Add `not-found.tsx` and `global-error.tsx`.
- **Auth via a thin BFF.** The browser never sees the API token.
  - Route handlers under `src/app/api/auth/*` call the backend, then store the token in an **httpOnly, Secure, SameSite=Lax cookie**.
  - Server Components read the cookie and call the backend directly.
  - Client components call `/api/bff/[...path]`, a same-origin proxy that attaches the token. This also avoids CORS.
  - Token refresh must be **single-flight**: many parallel 401s trigger one refresh, then retry once.
- `middleware.ts` (or `proxy.ts`) protects `/admin/*`, `/courier/*`, `/dashboard/*` by role and redirects to the right home. Also hide or show UI by role.
- **Demo login buttons** call `POST /api/auth/demo` with `{ role }`. The demo password lives only in a server env var (`DEMO_PASSWORD`), never in client code or the bundle.
- Filters, search, sort and pagination live in the URL (`useSearchParams`), so every list is bookmarkable.
- Forms: React Hook Form + Zod. Zod rules must match backend validation (check the docs). Show field errors inline and a toast for API errors.
- Reuse: `DataTable`, `StatCard`, `StatusBadge`, `SearchInput`, `EmptyState`, `PageHeader`, `ConfirmDialog`. No copy-pasted UI. Extract hooks (`useAuth`, `useDebounce`, `usePagination`).
- Every list has an empty state; every mutation shows a toast; use optimistic updates for quick toggles and status changes.
- No Lorem ipsum, no placeholder images, no hardcoded data for real workflows.
- Public pages export `metadata` (title, description, Open Graph).

## Design direction

**Bold and modern**, light + dark with a toggle.
- Strong brand colour with a high-contrast accent, large confident type, generous radius, subtle gradients and motion.
- Define all colours, radius and fonts as CSS variables / Tailwind tokens once (`globals.css`). Never hardcode hex in components.
- WCAG AA contrast in both themes; visible focus rings; keyboard-friendly dialogs and menus.
- Mobile-first. Check 375px, 768px and 1280px for every page.
- Use the `frontend-design` skill (if available) when building pages so the result does not look like a template.

## Git (important)

- **NEVER run `git add`, `git commit`, `git push`, or anything that changes history or the remote.** The owner commits manually.
- Read-only git commands are fine.
- At the end of every task, list commit-sized chunks with files and a conventional message
  (`feat:`, `fix:`, `chore:`, `refactor:`, `style:`, `docs:`). The assignment needs **20+ meaningful commits**, so keep chunks small and specific.

## Workflow

- After implementing, run `npm run lint`, `npx tsc --noEmit` and `npm run build`. Fix errors before reporting.
- Report briefly: what works, what you verified, what differs from the plan, then the suggested commits.
- Never print or log tokens, passwords or secrets. Never commit `.env*` (keep `.env.example` current).

## Environment variables

```
NEXT_PUBLIC_APP_URL=            # this site's URL, e.g. http://localhost:3000
API_BASE_URL=                   # https://carrivo-backend.vercel.app/api/v1 (server only)
DEMO_PASSWORD=                  # server only, used by /api/auth/demo
NEXT_PUBLIC_DEMO_ADMIN_EMAIL=admin@carrivo.dev
NEXT_PUBLIC_DEMO_COURIER_EMAIL=courier1@carrivo.dev
NEXT_PUBLIC_DEMO_CUSTOMER_EMAIL=customer1@carrivo.dev
```

## Definition of done for the project

18+ real pages, all 3 roles working end to end, real Stripe test payment with success and cancel pages,
proof-of-delivery upload, charts on the admin dashboard, one-click demo login working **in production**,
20+ commits, deployed on Vercel.
