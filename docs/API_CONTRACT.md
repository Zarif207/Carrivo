# Carrivo API contract (frontend view)

What the Next.js UI uses from the Carrivo API. **Source of truth:** `docs/backend/postman_collection.json` and `docs/backend/README.md` (copied from the backend repo). Where those were silent or contradictory, the backend source (`Carrivo-Backend/src`, read-only) was checked and the item is marked **(src)**. Open questions are in [§9](#9-gaps-and-open-questions).

TypeScript shapes live in `src/types` (named in the tables below); endpoint paths live in `src/lib/api/endpoints.ts`.

## 1. Basics

| | |
|---|---|
| Base URL | `API_BASE_URL` = `https://carrivo-backend.vercel.app/api/v1` (server-only env) |
| Auth | `Authorization: Bearer <token>`. The browser never holds the token (see §3). |
| Success | `{ success: true, message, data, meta? }`, where `meta = { page, limit, total, totalPages }` on lists |
| Failure | `{ success: false, message, errors: [{ path, message }] }`. `path` looks like `body.email`, `query.sortBy`, `image` or `""` |
| Status codes | 200/201 ok · 400 validation or illegal transition · 401 no/invalid/expired token or deactivated · 403 wrong role · 404 unknown **or not yours** · 409 conflict (state machine, duplicate, in use, concurrent) · 413/415 upload · 422 pricing (no rule, over max weight, below Stripe minimum) · 429 rate limit |
| Money | USD, 2-decimal **strings** (`"6.00"`), `currency: "usd"`. Inputs (fees, declaredValue) are numbers. Never show cents. |
| Decimals | `weightKg`, `baseWeightKg`, `maxWeightKg` are Decimal strings without fixed scale (`"2.3"`, `"1"`) |
| Ids | UUIDs (v7 domain rows, v4 users). Tracking id: `CRV-YYMMDD-XXXXXX`, regex `^CRV-\d{6}-[A-Z0-9]{6}$`, case-insensitive on lookup |
| Dates | ISO strings. Date filters (`fromDate`, `toDate`) take `YYYY-MM-DD` (an **Asia/Dhaka** day, UTC+6) or an ISO date-time with offset |
| Strict bodies | Every body is a strict object: unknown keys (`role`, `price`, `status`, …) → 400 |
| Body limit | JSON 100 kB, proof image 4 MB |
| Rate limits | Global 300 req / 15 min / IP; login, register, change-password and Google: 20 **failed** attempts / 15 min / IP. The BFF sends **`x-client-ip`** (visitor IP) and **`x-bff-secret`** (`BFF_SHARED_SECRET`) on every server-side call so limits apply per visitor (§9.2) |

### List queries

Every list accepts `page` (default 1), `limit` (default 10, **max 100**), `sortOrder` (`asc`/`desc`, default `desc`), plus the `sortBy` whitelist and filters listed per endpoint. Most lists also accept `searchTerm` (1-100 chars). An empty value (`?status=`) means "not provided". Boolean filters are the strings `"true"`/`"false"`.

## 2. Enums

Defined in `src/types/enums.ts` as readonly tuples (usable with `z.enum`).

| Enum | Values |
|---|---|
| `Role` | `CUSTOMER`, `COURIER`, `ADMIN`. Self-registration and Google sign-up are always CUSTOMER. |
| `UserStatus` | `ACTIVE`, `INACTIVE` |
| `ShipmentStatus` | `PENDING`, `PICKUP_SCHEDULED`, `COURIER_ASSIGNED`, `PICKED_UP`, `AT_ORIGIN_HUB`, `IN_TRANSIT`, `AT_DESTINATION_HUB`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED_DELIVERY`, `RETURNED`, `CANCELLED` |
| `ShipmentPaymentStatus` (`shipment.paymentStatus`) | `UNPAID`, `PAID`, `REFUNDED` |
| `PaymentStatus` (`payment.status`) | `PENDING`, `PAID`, `FAILED`, `EXPIRED`, `REFUND_PENDING`, `REFUNDED` |
| `ServiceType` | `STANDARD`, `EXPRESS`, `SAME_DAY` |
| `VehicleType` | `BICYCLE`, `MOTORCYCLE`, `CAR`, `VAN`, `TRUCK` |
| `PickupStatus` | `SCHEDULED`, `COMPLETED`, `CANCELLED` |
| `EarningStatus` | `PENDING`, `PAID` |
| `NotificationType` | `SHIPMENT_CREATED`, `COURIER_ASSIGNED`, `PICKED_UP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED_DELIVERY`, `PAYMENT_RECEIVED`, `REFUND_COMPLETED` |
| `AuditEntityType` | `ZONE`, `HUB`, `PRICING_RULE`, `SHIPMENT`, `COURIER_PROFILE`, `USER`, `PAYMENT` **(src; Postman lists only the first 6)** |
| `AuditAction` | 36 values, see `AUDIT_ACTIONS` in `src/types/enums.ts` **(src)** |
| Google `?error=` | `account_exists`, `account_deactivated`, `google_cancelled`, `google_failed` |

### Shipment state machine

A shipment must be **PAID** before it leaves PENDING. Cancellation is only possible before PICKED_UP, and a paid cancellation triggers a refund. Every status change adds a `statusHistory` row.

| From | To | Who | Endpoint |
|---|---|---|---|
| PENDING | PICKUP_SCHEDULED | CUSTOMER (owner, shipment PAID) | `POST /shipments/:id/pickup` |
| PENDING / PICKUP_SCHEDULED / COURIER_ASSIGNED | CANCELLED | CUSTOMER (owner), ADMIN | `POST /shipments/:id/cancel` |
| PICKUP_SCHEDULED | COURIER_ASSIGNED | ADMIN | `POST /shipments/:id/assign` |
| COURIER_ASSIGNED | PICKUP_SCHEDULED | ADMIN | `POST /shipments/:id/unassign` |
| COURIER_ASSIGNED | PICKED_UP | COURIER (assigned) | `PATCH /shipments/:id/status` |
| PICKED_UP → AT_ORIGIN_HUB → IN_TRANSIT → AT_DESTINATION_HUB → OUT_FOR_DELIVERY | (each step in turn) | ADMIN | `PATCH /shipments/:id/status` (`hubId` optional on the two hub statuses) |
| OUT_FOR_DELIVERY | DELIVERED (creates a 20 % courier earning) / FAILED_DELIVERY (`note` required) | COURIER (assigned) | `PATCH /shipments/:id/status` |
| FAILED_DELIVERY | OUT_FOR_DELIVERY (retry, only while `failedAttempts < 3`) | COURIER (assigned) | `PATCH /shipments/:id/status` |
| FAILED_DELIVERY | RETURNED | ADMIN | `PATCH /shipments/:id/status` |

DELIVERED, RETURNED and CANCELLED are terminal. Encoded as `SHIPMENT_TRANSITIONS` and `getAllowedNextStatuses()` in `src/types/enums.ts`; use these to decide which buttons to show (the API still decides). An illegal move returns 400 with the allowed next statuses, a legal move by the wrong role returns 403, and someone else's shipment returns 404.

## 3. Authentication (how the BFF uses the API)

The API is Bearer-only and has no cookies the frontend can use. Our Next.js server (BFF) holds the token in httpOnly cookies (names in `AUTH_COOKIES`, `src/lib/api/config.ts`):

| Cookie | Content | Flags |
|---|---|---|
| `carrivo_session` | Bearer token | httpOnly, Secure (prod), SameSite=Lax, Path=/, Max-Age = until `expiresAt` |
| `carrivo_role` | `ROLE.EXP.SIG`: role + token expiry, `SIG = HMAC-SHA256(SESSION_SECRET, "ROLE.EXP.sha256(token)")`. `src/proxy.ts` trusts it for routing without calling the API; it can't be forged or moved to another token | same |
| `carrivo_google_verifier`, `carrivo_google_next` | PKCE verifier and the safe `next` path, during Google sign-in only | httpOnly, Secure (prod), SameSite=Lax, Path=/auth/google, Max-Age 600 |

**Implemented in Phase 3** (`src/lib/auth/*`, `src/app/api/auth/*`, `src/app/api/bff/[...path]`, `src/proxy.ts`):
- Every mutating route handler requires `Origin` = `NEXT_PUBLIC_APP_URL`'s origin (CSRF guard).
- `/api/bff/*` only forwards method + path pairs in `src/lib/api/bff-allowlist.ts` (404 `NOT_ALLOWED` otherwise), attaches the token, `x-client-ip` and `x-bff-secret`, streams bodies both ways and keeps status codes. A 401 from the API comes back as `code: "SESSION_EXPIRED"` without clearing cookies.
- `GET /api/auth/me` returns `{ user }`, or `{ user: null }` (200) when signed out, so anonymous pages log no failed requests.
- Layouts re-verify with `requireRole()` (GET /users/me); a dead session goes through `GET /api/auth/session-expired`, which clears cookies and lands on `/login?reason=expired`.
- `next` is accepted only as a same-origin path that the signed-in role may open (`src/lib/auth/redirects.ts`).

Server Components call the API with `serverFetch` (`src/lib/api/server.ts`), which reads `carrivo_session`. Client Components call `/api/bff/[...path]`, which attaches the same token server-side.

### 3.1 Register: `POST /auth/register` (public, auth rate limit)
Body `RegisterInput`: `name` 2-100 (trimmed), `email` (valid, lower-cased), `password` 8-128, `phone?` matching `^\+?[0-9\s-]{7,20}$`. → **201** `AuthResult { token, expiresAt, user }` (the user is signed in immediately). 409 when the email exists (`USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`).
**BFF:** `POST /api/auth/register` forwards the body, sets the 3 cookies and returns `{ user }` (never the token).

### 3.2 Login: `POST /auth/login` (public, auth rate limit)
Body `LoginInput { email, password }` (password min 1). → **200** `AuthResult`. Tokens last 7 days. Errors: 401 `Invalid email or password`, 403 `Account is deactivated`, 429.
**BFF:** `POST /api/auth/login` sets the cookies and returns `{ user }`. **Demo login:** `POST /api/auth/demo { role }` maps the role to `NEXT_PUBLIC_DEMO_<ROLE>_EMAIL`, takes the password from server-only `DEMO_PASSWORD`, and then does the same as login.

### 3.3 Current user: `GET /users/me` (any role)
→ `UserProfile` (`User` + `courierProfile`, which is null unless COURIER). `/api/auth/me` uses this to rebuild the client's user store. Better Auth's `GET /auth/get-session` is reachable too, but the UI doesn't need it.

### 3.4 Logout: `POST /auth/logout` (any role, Bearer, no body)
→ `data: null`. The token stops working immediately.
**BFF:** `POST /api/auth/logout` calls the API (ignoring a 401, since the token may already be dead), deletes all auth cookies and returns 200.

### 3.5 Token refresh: `POST /auth/refresh-token` (any role, Bearer, no body)
→ `RefreshResult { token, expiresAt }`: a new 7-day session, and **the token you sent is revoked**.
This is session *rotation*, not an OAuth refresh token: it needs a **still-valid** token, so it can't revive a token that already got a 401. **Agreed approach:**
- **Refresh proactively before expiry.** When `carrivo_session_exp` is less than 24 h away, the BFF rotates the token and rewrites the cookies. It is single-flight per token on the server (parallel requests share one rotation), and only one place rotates (the BFF proxy and `/api/auth/me`, never middleware), because rotation revokes the old token immediately.
- **Treat a 401 as logged out after one retry.** Parallel 401s on the client share one call to `/api/auth/refresh`. That call only succeeds if another request already rotated the cookie (a race); then each failed request is retried **once**. If it fails, the BFF clears all auth cookies and the UI redirects to `/login?next=<current path>` with a toast ("Your session ended. Log in again.").
- Deactivation, a role change and "sign out everywhere" also revoke sessions, which shows up as a 401 and is handled the same way.

### 3.6 Google sign-in (PKCE handoff, no token in any URL)
1. Browser → `GET /api/auth/google/start` (our route handler). It creates `codeVerifier` = 32 random bytes as base64url (43 chars, `[A-Za-z0-9._~-]{43,128}`), stores it in `carrivo_google_verifier`, and computes `challenge = base64url(SHA-256(verifier))` without padding (43 chars).
2. 302 → **`${API_BASE_URL}/auth/google?challenge=<challenge>`**. This is a real navigation to the API origin; never fetch it. The API sets its own state cookies on its domain and 302s to Google.
3. Google → `API/auth/callback/google` → `API/auth/google/complete` → 302 → **`FRONTEND_URL/auth/google/callback?code=<one-time code>`**, or `?error=account_exists | account_deactivated | google_cancelled | google_failed`.
4. Our route handler `src/app/auth/google/callback/route.ts` reads `code` and the verifier cookie, then calls **`POST /auth/google/exchange { code, codeVerifier }`** server-to-server (no API cookies needed) within **60 s**. → `AuthResult` (new users are CUSTOMER). The code works once; a wrong verifier also uses it up (400 `Invalid or expired code…`), and 403 means the account is deactivated.
5. Set the session cookies, delete the verifier cookie, and redirect to the role's home. On `?error=` redirect to `/login?error=<code>` and show a message (`account_exists` means "sign in with your password; Google never links to an existing account").

This keeps the verifier out of client JS. The backend README suggests sessionStorage, which also works, but the cookie version needs no client code. Backend env required: `FRONTEND_URL` = the frontend origin. The Google OAuth app must be **published** (or the user added as a test user).

### 3.7 Change password: `POST /auth/change-password` (any role, Better Auth)
Body `ChangePasswordInput { currentPassword, newPassword (8-128), revokeOtherSessions? }`. → **Not enveloped**: `{ token: string | null, user: { id, email, name } }`. Failed attempts count toward the auth rate limit. `serverFetch` wraps this into `{ success: true, data }`. The error body shape is not documented (see §9). Accounts created through Google probably have no password to change (not documented; test before showing the form to Google users).

## 4. Public endpoints (no token)

| Method | Path | Body / query | Response `data` |
|---|---|---|---|
| GET | `/health` | | `HealthStatus { status, environment, uptime, timestamp, database: "up"\|"down" }` |
| GET | `/zones` | `searchTerm` (name, code), `sortBy` name\|code\|createdAt, `isActive` true(default)\|false\|all | `Zone[]` + meta |
| GET | `/zones/:id` | | `Zone { id, name, code, description, isActive, createdAt, updatedAt }` |
| GET | `/hubs` | `zoneId`, `city` (exact, case-insensitive), `searchTerm` (name, code, city), `sortBy` name\|code\|city\|createdAt, `isActive` | `Hub[]` + meta |
| GET | `/hubs/:id` | | `Hub { id, name, code, address, city, phone, isActive, zone: ZoneRef, … }` |
| POST | `/pricing/estimate` | `PriceEstimateInput { weightKg (>0, ≤1000, 2 dp), serviceType, originZoneId, destinationZoneId }` | `PriceEstimate { currency, weightKg, baseWeightKg, chargeableExtraKg, baseFee, perKgFee, weightCharge, total, serviceType }`. 422 if no rule exists for the route (seeded SAME_DAY is within one zone only) or the weight is over the rule's max |
| GET | `/tracking/:trackingId` | | `TrackingInfo { trackingId, status, serviceType, origin{city}, destination{city}, createdAt, estimatedDeliveryAt, deliveredAt, timeline[{status, city, at}] }`. No personal data. 400 bad format, 404 unknown |

Pricing formula: `total = baseFee + ceil(max(0, weight - baseWeightKg)) × perKgFee`. The rule is the active (service, origin, destination) rule if there is one, otherwise the service's default rule (both zones null).

## 5. Customer endpoints (`CUSTOMER`)

| Method | Path | Body / query | Response `data` / notes |
|---|---|---|---|
| GET/PATCH | `/users/me` | PATCH `UpdateProfileInput`: `name` 2-100, `phone` (regex above) \| null, `address` 3-300 \| null, `image` (URL) \| null; at least one field | `UserProfile` |
| POST | `/shipments` | `CreateShipmentInput` (rules below) | **201** `ShipmentDetail` (PENDING, UNPAID, server-priced, new trackingId) |
| GET | `/shipments` | `ShipmentListQuery`: `searchTerm` (trackingId, receiver name/phone), `status`, `serviceType`, `paymentStatus`, `fromDate`, `toDate`, `sortBy` createdAt\|updatedAt\|price\|weightKg\|status\|trackingId | `ShipmentListItem[]` + meta (own only) |
| GET | `/shipments/:id` | | `ShipmentDetail` (incl. `statusHistory`, `pickupRequest`, `priceBreakdown`, `proofOfDeliveryUrl`/`UploadedAt`) |
| PATCH | `/shipments/:id` | `UpdateShipmentInput` (any editable field, ≥ 1) | `ShipmentDetail`. Only while PENDING. Weight or service change re-prices; both are locked once PAID (409) or while a checkout is open (409) |
| POST | `/shipments/:id/cancel` | `{ reason? }` 3-500 (body optional) | `ShipmentDetail`. Before PICKED_UP. If paid: payment → REFUND_PENDING → Stripe refund → `paymentStatus` REFUNDED |
| POST | `/shipments/:id/pickup` | `SchedulePickupInput` (rules below) | `ShipmentDetail` (PICKUP_SCHEDULED + `pickupRequest`). 409 if not PAID |
| POST | `/payments/initiate` | `{ shipmentId }` | **201** `CheckoutSession { paymentId, checkoutUrl, expiresAt, amount, currency, reused:false }`, or **200** with `reused:true` when a session is already open. 409 already paid, 422 below the $0.50 Stripe minimum. Redirect the browser to `checkoutUrl` (session lasts 31 min) |
| GET | `/payments/verify?session_id=cs_…` | `session_id` regex `^cs_(test\|live)_[A-Za-z0-9]+$` | `PaymentVerification { payment: Payment, stripe: { sessionStatus, paymentStatus } }`. Also reconciles PAID if the webhook was missed. 404 when not your session |
| GET | `/payments/my` | `status` (PaymentStatus), `sortBy` createdAt\|amount\|paidAt\|status (no searchTerm) | `Payment[]` + meta |
| GET | `/payments/:id` | | `Payment` (`checkoutUrl` only while the session is open) |
| * | notifications | see §8 | |

**Create shipment validation** (src): `senderName`, `receiverName` 2-100; `senderPhone`, `receiverPhone` match `^\+?[0-9\s-]{7,20}$`; `pickupAddress`, `deliveryAddress` 5-300; `receiverEmail?` email \| null; `description?` ≤500 \| null; `declaredValue?` number 0-99,999,999 \| null; `isFragile?` boolean; `weightKg` > 0, ≤ 1000 (rounded to 2 dp; the rule's max may be lower → 422); `serviceType`; `originZoneId`, `originHubId`, `destinationZoneId`, `destinationHubId` UUIDs. Each hub must be active and in its zone (400 `Hub does not belong to originZoneId`).

**Pickup validation** (src): `windowStart`, `windowEnd` are ISO date-times **with offset** (e.g. `2026-11-10T10:00:00+06:00`); start must be in the future and ≤ 30 days ahead; end after start; window ≤ 12 h. Optional: `pickupAddress` 5-300, `contactName` 2-100, `contactPhone`, `notes` ≤500 (defaults come from the shipment).

**Stripe redirects** (the backend builds these URLs): success → `FRONTEND_SUCCESS_URL?session_id={CHECKOUT_SESSION_ID}` (= `/payment/success`), cancel → `FRONTEND_CANCEL_URL?shipmentId=<id>` (= `/payment/cancel`). A payment becomes PAID only through the webhook or `/payments/verify`, never because of the redirect. Test cards: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline; the payment stays PENDING with `failureReason` and can be retried).

## 6. Courier endpoints (`COURIER`)

| Method | Path | Body / query | Response `data` / notes |
|---|---|---|---|
| GET/PATCH | `/users/me` | as §5 | `UserProfile` with `courierProfile { id, vehicleType, vehicleNumber, isAvailable, zone, hub }` |
| GET | `/couriers/me/tasks` | `status` (omit = active: not DELIVERED/RETURNED/CANCELLED), `searchTerm`, `sortBy` createdAt\|updatedAt(default)\|status. **No date filter** | `CourierTask[]` + meta (list fields + `senderPhone`, `isFragile`, `description`, `failedAttempts`, `failureReason`, `proofOfDeliveryUrl`, `proofOfDeliveryUploadedAt`, `currentHub`, `pickupRequest`) |
| GET | `/shipments/:id` | | `ShipmentDetail` (assigned only, else 404). Use it for the timeline |
| GET | `/shipments` | as §5 | assigned shipments only |
| PATCH | `/shipments/:id/status` | `{ status, note? (3-500) }`: `PICKED_UP` (from COURIER_ASSIGNED), `DELIVERED` / `FAILED_DELIVERY` (from OUT_FOR_DELIVERY; FAILED needs `note`), `OUT_FOR_DELIVERY` (retry from FAILED_DELIVERY, < 3 attempts) | `ShipmentDetail` |
| POST | `/shipments/:id/proof` | multipart, exactly one file in field **`image`**: JPEG/PNG/WebP whose bytes match the type, ≤ 4 MB. Only while OUT_FOR_DELIVERY or DELIVERED | `ShipmentDetail` with `proofOfDeliveryUrl`. Re-uploading replaces the image. 400 wrong type, 413 too big, 415 not multipart |
| GET | `/couriers/me/earnings` | `status` PENDING\|PAID, `fromDate`, `toDate`, `sortBy` createdAt\|amount | `EarningsResult { summary { totalEarned, pending, paidOut, deliveries }, earnings: Earning[] }` + meta (paginates `earnings`) |
| PATCH | `/couriers/me/availability` | `{ isAvailable: boolean }` | `CourierProfile`. Unavailable couriers keep their tasks but get no new assignments |

## 7. Admin endpoints (`ADMIN`)

| Method | Path | Body / query | Response `data` / notes |
|---|---|---|---|
| GET | `/admin/dashboard-stats` | | `DashboardStats { shipments{total, byStatus}, revenue{currency, grossCollected, refunded, net}, paymentsByStatus, shipmentsPerDay[{date, count}], topCouriers[{id, name, deliveries}], failedDeliveryRate{rate, failedAttempts, deliveredShipments}, counts{activeCouriers, activeCustomers, activeHubs}, generatedAt }`. Cached 60 s |
| GET | `/shipments` | `ShipmentListQuery` + `customerId`, `courierId` | all shipments |
| GET | `/shipments/:id` | | `ShipmentDetail` |
| POST | `/shipments/:id/cancel` | `{ reason? }` | any shipment before PICKED_UP |
| DELETE | `/shipments/:id` | | `DeletedShipment { id, trackingId, deletedAt }`. Only PENDING or terminal, else 409 |
| POST | `/shipments/:id/assign` | `{ courierId, note? }` (`courierId` = user id from `/couriers`) | `ShipmentDetail` (COURIER_ASSIGNED). 409 assigned concurrently or courier unavailable; 400 courier is in another zone (must match the **origin** zone) |
| POST | `/shipments/:id/unassign` | `{ note? }` (body optional) | `ShipmentDetail` (back to PICKUP_SCHEDULED) |
| PATCH | `/shipments/:id/status` | `{ status, note?, hubId? }`: `AT_ORIGIN_HUB` (`hubId` in origin zone, default = planned hub), `IN_TRANSIT`, `AT_DESTINATION_HUB` (`hubId` in destination zone), `OUT_FOR_DELIVERY`, `RETURNED` (from FAILED_DELIVERY) | `ShipmentDetail` |
| GET | `/couriers` | `zoneId`, `hubId`, `available` true\|false, `searchTerm` (name, email, phone), `sortBy` name(default)\|createdAt | `CourierListItem[] { id, name, email, phone, courierProfile, activeTaskCount }` + meta |
| GET | `/admin/users` | `role`, `status`, `searchTerm` (name, email, phone), `sortBy` name\|email\|createdAt\|role\|status | `AdminUser[]` (= `UserProfile`) + meta |
| POST | `/admin/users` | `CreateUserInput`: `name`, `email`, `password` 8-128, `phone?`, `role` COURIER\|ADMIN; COURIER **requires** `courierProfile { zoneId, hubId?, vehicleType, vehicleNumber? 2-50, licenseNumber? 2-50 }` (the hub must be active and in the zone) | **201** `AdminUser` |
| PATCH | `/admin/users/:id/role` | `{ role, courierProfile? }` | `AdminUser`. 403 own role; 409 last admin, or the user has active shipments (lists tracking ids). Revokes the user's sessions |
| PATCH | `/admin/users/:id/status` | `{ status, reason? 3-500 }` | `AdminUser`. 403 self; 409 last admin or courier with active shipments. Deactivation revokes sessions and makes a courier unavailable |
| GET | `/admin/payments` | `status`, `customerId`, `shipmentId`, `requiresReview` true\|false, `fromDate`, `toDate`, `sortBy` createdAt\|amount\|paidAt\|status | `AdminPayment[]` (`Payment` + `admin { customer, stripeSessionId, stripePaymentIntentId, stripeRefundId, paidCurrency, requiresReview, reviewReason }`) + meta |
| GET | `/payments/:id` | | `Payment` with `admin` |
| GET | `/payments/verify` | as §5 | admins may verify too |
| POST | `/admin/payments/:id/refund` | | `AdminPayment` (REFUNDED). Only for REFUND_PENDING (409 otherwise); idempotent |
| GET | `/admin/audit-logs` | `actorId`, `action` (AuditAction), `entityType`, `entityId`, `fromDate`, `toDate`, `sortOrder` (newest first). No searchTerm/sortBy | `AuditLog[] { id, action, entityType, entityId, actorRole, actor{id, name, email, role} \| null, before, after (redacted JSON), ipAddress, userAgent, createdAt }` + meta |
| GET | `/zones`, `/hubs` | as §4 (`isActive=all` to include inactive) | |
| POST / PATCH / DELETE | `/zones`, `/zones/:id` | `CreateZoneInput { name 2-100, code ^[A-Z0-9-]{2,20}$ (upper-cased), description? ≤500 \| null, isActive? }`, PATCH any field | `Zone`. DELETE is a soft delete (`isActive:false`); 409 lists what still uses it; 409 duplicate code |
| POST / PATCH / DELETE | `/hubs`, `/hubs/:id` | `CreateHubInput { name 2-100, code ^[A-Z0-9-]{2,30}$, address 3-300, city 2-100, phone? \| null, zoneId (active), isActive? }` | `Hub`. 409 zone change or delete while in use |
| GET | `/pricing`, `/pricing/:id` | `serviceType`, `originZoneId`, `destinationZoneId`, `isActive` true\|false (omit = both), `searchTerm` (name), `sortBy` name\|serviceType\|baseFee\|perKgFee\|createdAt | `PricingRule[]` + meta / `PricingRule` |
| POST / PATCH / DELETE | `/pricing`, `/pricing/:id` | `CreatePricingRuleInput { name 2-100, serviceType, originZoneId? \| null, destinationZoneId? \| null (both or neither), baseFee, baseWeightKg? (default 1), perKgFee, maxWeightKg? \| null (≥ baseWeightKg), isActive? (default true) }` | `PricingRule`. 409 when an active rule already exists for that service + route |

## 8. Any signed-in role

| Method | Path | Query | Response `data` |
|---|---|---|---|
| GET | `/notifications/my` | `unread` true\|false (omit = all), `page`, `limit`, `sortOrder` | `AppNotification[] { id, type, title, message, readAt, isRead, createdAt, shipment{id, trackingId} \| null }` + meta. `meta.total` with `unread=true` gives the badge count |
| PATCH | `/notifications/:id/read` | | `AppNotification` (keeps the original `readAt`) |
| PATCH | `/notifications/read-all` | | `{ updated: number }` |

Render `message` as **plain text**: it contains user-entered text (the example includes `<b>`).

**Not used by the UI:** `POST /payments/webhook` (Stripe only), `GET /auth/google/complete` and `/auth/callback/google` (redirect hops), and the Better Auth extras `GET /auth/get-session`, `POST /auth/revoke-sessions`, `POST /auth/revoke-other-sessions`, `GET /auth/ok`. Any other `/auth/*` path (e.g. `list-sessions`) returns 404 on purpose.

## 9. Gaps and open questions

1. **`docs/backend/` was missing** at the start of Phase 0. I copied `README.md` and `docs/postman_collection.json` from `../Carrivo-Backend`.
2. **Rate limits vs the BFF. Decided:** the BFF forwards `x-client-ip` + `x-bff-secret` (env `BFF_SHARED_SECRET`); backend support is being added. Original problem: The API limits by client IP (`trust proxy 1`). Every BFF call comes from our Vercel server, so all users share **one** 300-requests/15-min bucket and one 20-failed-logins/15-min bucket. A live demo with several graders could hit 429. 
3. **Refresh semantics. Decided:** refresh proactively before expiry; a 401 means logged out after one retry (§3.5, CLAUDE.md updated).
4. **Email link path mismatch.** Backend emails link to `FRONTEND_URL/shipments/:id` (for customer *and* admin), but our customer route is `/dashboard/shipments/:id` and there is no admin detail page. **Decided and built:** `src/app/shipments/[id]/route.ts` redirects CUSTOMER → `/dashboard/shipments/:id`, COURIER → `/courier/tasks/:id`, ADMIN → `/admin/shipments?view=:id` (the admin list opens a detail sheet for `view`), logged out → `/login?next=/shipments/:id`.
5. **No public pricing table.** `GET /pricing` is ADMIN-only; only `POST /pricing/estimate` (and zones/hubs) are public. **Decided:** `/pricing` is a live quote calculator.
6. **No contact endpoint. Decided:** the contact form opens a pre-filled `mailto:` and says so.
7. **No customer stats endpoint.** Dashboard cards need several list calls: counts from `meta.total` with `status=` filters (one call each), and spend summed from `/payments/my?status=PAID` (up to 100 per page). Refunded payments are excluded.
8. **No date filter on courier tasks**, so "today's tasks" can't be filtered on the server. **Decided:** the courier home shows "Active tasks".
9. **No revenue time series.** `dashboard-stats` has totals and `shipmentsPerDay` (counts only; the number of days isn't documented, the example shows about 30). **Decided:** admin charts are shipments per day, shipments by status and payments by status.
10. **No avatar upload.** `PATCH /users/me` takes an image **URL** only.
11. **Change-password responses are Better Auth's shape** (not enveloped) and the error body isn't documented. `ApiError.fromBody` falls back to `message`.
12. **Admin gaps:** there is no `GET /admin/users/:id`, no endpoint to edit a courier's vehicle/zone/hub outside a role change, and no endpoint to mark earnings as paid out (so `paidOut` stays `0.00`).
13. **Doc inconsistencies found (code is right, examples are stale):** the proof-upload "409 Wrong status" example shows a success body; the "tasks with proof" example has `data: [null]`; `/users/me` courier `hub` lacks `city` (other responses and the src include it); `proofOfDeliveryUploadedAt` is described but missing from detail examples (src returns it); the demo login examples show the name "Ayesha Customer" for admin and courier; audit `entityType` leaves out `PAYMENT`.
14. **Unknowns typed defensively:** whether `statusHistory[].changedBy` can be null; how many days `shipmentsPerDay` covers; whether `estimatedDeliveryAt` is ever set (every example has null).
15. **Locale:** zones, hubs and phone numbers are Dhaka/Bangladesh (+880) and date filters use Asia/Dhaka, but money is USD. Format dates in the user's local time and money as `$6.00`.
16. **Next 16 note (decided: keep it on):** this app has `cacheComponents: true`. A public, cacheable read (zones, tracking) should be `serverFetch(..., { auth: false })` inside a `"use cache"` function with `cacheLife`. Authenticated reads call `cookies()` and must sit under `<Suspense>`.
17. **Backend config for Google sign-in (found in Phase 3):** the live API sends Google `redirect_uri=http://localhost:5000/api/v1/auth/callback/google`, so `BETTER_AUTH_URL` on the backend's Vercel project is still the local value. Set it to `https://carrivo-backend.vercel.app`, add that callback URL in Google Cloud Console, and set `FRONTEND_URL` to the frontend origin. Until then Google sign-in can't complete.
