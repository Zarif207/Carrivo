import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APPLICATION_TABS, parseApplicationTab, statusForTab } from "../src/lib/admin/courier-application-tabs.ts";
import { matchBffRule } from "../src/lib/api/bff-allowlist.ts";
import { canMutate, readOnlyMayWrite } from "../src/lib/auth/permissions.ts";
import { ROLE_CHANGE_HINT_COOKIE, SESSION_END_MESSAGES, readCookie, reasonFromHint, sessionEndLoginUrl } from "../src/lib/auth/session-end.ts";
import { ApiError } from "../src/lib/api/errors.ts";
import { applicationErrorMessage, applicationView, expectsRoleChange, pastApplications } from "../src/lib/courier-application.ts";
import { notificationLabel } from "../src/lib/notifications/labels.ts";
import { safeInternalPath } from "../src/lib/notifications/link.ts";
import { formatUsPhoneInput } from "../src/lib/us.ts";
import { applyFormSchema, approveFormSchema, rejectFormSchema, toApplyBody, toApproveBody } from "../src/lib/validation/courier-application.ts";

const ID = "019a5e00-0000-7000-8000-00000000a004";
const NOW = new Date("2026-11-11T15:00:00Z");

const application = (status, extra = {}) => ({
  id: extra.id ?? ID,
  status,
  phone: "(312) 555-0140",
  vehicleType: "CAR",
  vehiclePlate: "IL CRV-2041",
  availability: "FULL_TIME",
  experience: null,
  about: null,
  reviewNote: null,
  reviewedAt: null,
  createdAt: "2026-11-10T06:45:39.137Z",
  updatedAt: "2026-11-10T06:45:39.137Z",
  preferredZone: { id: "z1", name: "Chicago Metro", code: "CHI" },
  ...extra,
});

const mine = (history, extra = {}) => ({
  latest: history[0] ?? null,
  history,
  canApply: true,
  canReapplyAt: null,
  blockedReason: null,
  cooldownDays: 7,
  ...extra,
});

const FORM = {
  phone: "(312) 555-0140",
  preferredZoneId: "",
  vehicleType: "CAR",
  vehiclePlate: "il crv-2041",
  availability: "WEEKDAYS",
  experience: "  ",
  about: "Three years on a cargo bike.",
  consent: true,
};

describe("apply form schema", () => {
  it("accepts a complete form and builds the API body", () => {
    const parsed = applyFormSchema.parse(FORM);
    assert.deepEqual(toApplyBody(parsed), {
      phone: "(312) 555-0140",
      vehicleType: "CAR",
      availability: "WEEKDAYS",
      preferredZoneId: null,
      vehiclePlate: "IL CRV-2041",
      experience: null,
      about: "Three years on a cargo bike.",
    });
  });

  it("requires consent, a US phone, a vehicle and an availability", () => {
    const errors = (values) => applyFormSchema.safeParse(values).error?.issues.map((i) => i.path.join(".")) ?? [];
    assert.deepEqual(errors({ ...FORM, consent: false }), ["consent"]);
    assert.deepEqual(errors({ ...FORM, phone: "+44 20 7946 0958" }), ["phone"]);
    assert.deepEqual(errors({ ...FORM, vehicleType: undefined }), ["vehicleType"]);
    assert.deepEqual(errors({ ...FORM, vehicleType: "SCOOTER" }), ["vehicleType"]);
    assert.deepEqual(errors({ ...FORM, availability: undefined }), ["availability"]);
    assert.match(applyFormSchema.safeParse({ ...FORM, consent: false }).error.issues[0].message, /confirm/);
  });

  it("checks the optional plate and the text limits", () => {
    assert.ok(applyFormSchema.safeParse({ ...FORM, vehiclePlate: "" }).success, "empty plate is fine");
    assert.equal(applyFormSchema.safeParse({ ...FORM, vehiclePlate: "A" }).success, false);
    assert.equal(applyFormSchema.safeParse({ ...FORM, vehiclePlate: "NY_KDR" }).success, false);
    assert.equal(applyFormSchema.safeParse({ ...FORM, vehiclePlate: "X".repeat(21) }).success, false);
    assert.equal(applyFormSchema.safeParse({ ...FORM, experience: "x".repeat(501) }).success, false);
    assert.equal(applyFormSchema.safeParse({ ...FORM, about: "x".repeat(1001) }).success, false);
  });

  it("never sends a licence, SSN or other ID field, even if one sneaks into the values", () => {
    const parsed = applyFormSchema.parse({ ...FORM, licenseNumber: "D123", ssn: "123-45-6789" });
    const body = toApplyBody(parsed);
    assert.deepEqual(Object.keys(body).sort(), ["about", "availability", "experience", "phone", "preferredZoneId", "vehiclePlate", "vehicleType"]);
  });
});

describe("decision schemas", () => {
  it("reject needs a 5-500 character note (trimmed)", () => {
    assert.equal(rejectFormSchema.safeParse({ note: "    no " }).success, false);
    assert.equal(rejectFormSchema.safeParse({ note: "x".repeat(501) }).success, false);
    assert.equal(rejectFormSchema.parse({ note: "  Needs a vehicle  " }).note, "Needs a vehicle");
  });

  it("approve needs a zone; the hub is optional", () => {
    assert.equal(approveFormSchema.safeParse({ zoneId: "", hubId: "" }).success, false);
    assert.deepEqual(toApproveBody({ zoneId: "z1", hubId: "" }), { zoneId: "z1" });
    assert.deepEqual(toApproveBody({ zoneId: "z1", hubId: "h1" }), { zoneId: "z1", hubId: "h1" });
  });
});

describe("page state machine (applicationView)", () => {
  it("no application yet → the form", () => {
    assert.deepEqual(applicationView("CUSTOMER", mine([]), NOW), { kind: "apply", previous: null });
  });

  it("pending → status card, and a role change is expected", () => {
    const data = mine([application("PENDING")], { canApply: false, blockedReason: "pending" });
    assert.equal(applicationView("CUSTOMER", data, NOW).kind, "pending");
    assert.equal(expectsRoleChange(data), true);
    assert.equal(expectsRoleChange(mine([application("REJECTED")])), false);
    assert.equal(expectsRoleChange(undefined), false);
  });

  it("approved while still a customer session → sign in again", () => {
    assert.equal(applicationView("CUSTOMER", mine([application("APPROVED")], { canApply: false }), NOW).kind, "approved");
  });

  it("rejected during the wait → the reason and the reapply date", () => {
    const rejected = application("REJECTED", { reviewNote: "Needs a vehicle", reviewedAt: "2026-11-10T15:00:00Z" });
    const view = applicationView("CUSTOMER", mine([rejected], { canApply: false, canReapplyAt: "2026-11-17T15:00:00Z", blockedReason: "wait" }), NOW);
    assert.deepEqual(view, { kind: "cooldown", application: rejected, reapplyAt: "2026-11-17T15:00:00Z" });
  });

  it("rejected after the wait → the reason and the form again (also when the date passes while open)", () => {
    const rejected = application("REJECTED", { reviewNote: "Needs a vehicle" });
    assert.equal(applicationView("CUSTOMER", mine([rejected]), NOW).kind, "reapply");
    const data = mine([rejected], { canApply: false, canReapplyAt: "2026-11-11T14:59:59Z" });
    assert.equal(applicationView("CUSTOMER", data, NOW).kind, "reapply");
  });

  it("withdrawn → the form, remembering the previous one", () => {
    const cancelled = application("CANCELLED");
    assert.deepEqual(applicationView("CUSTOMER", mine([cancelled]), NOW), { kind: "apply", previous: cancelled });
  });

  it("couriers see their approved application; staff are pointed at the queue", () => {
    const approved = application("APPROVED");
    assert.deepEqual(applicationView("COURIER", mine([approved]), NOW), { kind: "courier", approved });
    assert.deepEqual(applicationView("COURIER", mine([]), NOW), { kind: "courier", approved: null });
    assert.deepEqual(applicationView("ADMIN", mine([]), NOW), { kind: "staff" });
    assert.deepEqual(applicationView("ADMIN_VIEWER", mine([]), NOW), { kind: "staff" });
  });

  it("an API refusal the page doesn't model is shown as-is", () => {
    assert.deepEqual(applicationView("CUSTOMER", mine([], { canApply: false, blockedReason: "Not today" }), NOW), { kind: "blocked", reason: "Not today" });
  });

  it("history lists everything except the application shown on top", () => {
    const pending = application("PENDING", { id: "a2" });
    const old = application("REJECTED", { id: "a1" });
    const data = mine([pending, old]);
    assert.deepEqual(pastApplications(data, applicationView("CUSTOMER", data, NOW)).map((a) => a.id), ["a1"]);
  });
});

describe("US phone mask", () => {
  it("formats as you type", () => {
    assert.equal(formatUsPhoneInput(""), "");
    assert.equal(formatUsPhoneInput("3"), "(3");
    assert.equal(formatUsPhoneInput("3125"), "(312) 5");
    assert.equal(formatUsPhoneInput("3125550140"), "(312) 555-0140");
  });

  it("drops the country code, separators and extra digits", () => {
    assert.equal(formatUsPhoneInput("+1 312-555-0140"), "(312) 555-0140");
    assert.equal(formatUsPhoneInput("1 (312) 555.0140 ext 9"), "(312) 555-0140");
    assert.equal(formatUsPhoneInput("abc"), "");
  });
});

describe("session ended by a role change", () => {
  it("a 401 while a courier application was pending reads as a role change", () => {
    assert.equal(reasonFromHint("1"), "role-changed");
    assert.equal(reasonFromHint(null), "expired");
    assert.equal(reasonFromHint(""), "expired");
    assert.equal(SESSION_END_MESSAGES["role-changed"], "Your role changed, please sign in again.");
    assert.equal(readCookie(`a=b; ${ROLE_CHANGE_HINT_COOKIE}=1; c=d`, ROLE_CHANGE_HINT_COOKIE), "1");
    assert.equal(readCookie("a=b", ROLE_CHANGE_HINT_COOKIE), null);
  });

  it("sends the user to /login with the reason and the page to return to", () => {
    assert.equal(sessionEndLoginUrl("/courier-application", "", "role-changed"), "/login?reason=role-changed&next=%2Fcourier-application");
    assert.equal(sessionEndLoginUrl("/dashboard/shipments", "?page=2", "expired"), "/login?reason=expired&next=%2Fdashboard%2Fshipments%3Fpage%3D2");
  });

  it("never loops: no `next` back to /login, /register, /api or /auth, or from the home page", () => {
    for (const path of ["/login", "/register", "/api/auth/refresh", "/auth/google/callback", "/"]) {
      assert.equal(sessionEndLoginUrl(path, "?next=/login", "role-changed"), "/login?reason=role-changed", path);
    }
    assert.equal(sessionEndLoginUrl("//evil.example", "", "expired"), "/login?reason=expired");
  });
});

describe("BFF and permissions", () => {
  it("allows the courier application calls, and nothing else under them", () => {
    assert.ok(matchBffRule("POST", "/courier-applications"));
    assert.ok(matchBffRule("GET", "/courier-applications/my"));
    assert.ok(matchBffRule("PATCH", `/courier-applications/my/${ID}/cancel`));
    assert.ok(matchBffRule("GET", "/admin/courier-applications"));
    assert.ok(matchBffRule("GET", `/admin/courier-applications/${ID}`));
    assert.ok(matchBffRule("PATCH", `/admin/courier-applications/${ID}/approve`));
    assert.ok(matchBffRule("PATCH", `/admin/courier-applications/${ID}/reject`));
    assert.equal(matchBffRule("DELETE", `/admin/courier-applications/${ID}`), null);
    assert.equal(matchBffRule("PATCH", `/admin/courier-applications/${ID}/delete`), null);
    assert.equal(matchBffRule("PATCH", "/courier-applications/my/not-an-id/cancel"), null);
  });

  it("the viewer can't decide: no admin writes, and the BFF refuses approve/reject", () => {
    assert.equal(canMutate("ADMIN_VIEWER"), false);
    assert.equal(canMutate("ADMIN"), true);
    assert.equal(readOnlyMayWrite("PATCH", `/admin/courier-applications/${ID}/approve`), false);
    assert.equal(readOnlyMayWrite("PATCH", `/admin/courier-applications/${ID}/reject`), false);
  });
});

describe("admin tabs and notification links", () => {
  it("defaults to Pending, and All sends no status filter", () => {
    assert.equal(parseApplicationTab(undefined), "PENDING");
    assert.equal(parseApplicationTab("REJECTED"), "REJECTED");
    assert.equal(parseApplicationTab("CANCELLED"), "PENDING");
    assert.equal(statusForTab("all"), undefined);
    assert.deepEqual([...APPLICATION_TABS], ["PENDING", "APPROVED", "REJECTED", "all"]);
  });

  it("labels the three new notification types, and their links are followed", () => {
    assert.equal(notificationLabel("COURIER_APPLICATION_SUBMITTED"), "Courier application");
    assert.equal(notificationLabel("COURIER_APPLICATION_APPROVED"), "Application approved");
    assert.equal(notificationLabel("COURIER_APPLICATION_REJECTED"), "Application not approved");
    for (const link of ["/dashboard", "/courier-application", "/admin/courier-applications?status=PENDING"]) {
      assert.equal(safeInternalPath(link), link);
    }
  });
});

describe("error messages", () => {
  it("429 and network errors get friendly words; API messages pass through", () => {
    assert.match(applicationErrorMessage(new ApiError(429, "Too many courier application requests, please try again in an hour")), /Too many tries/);
    assert.match(applicationErrorMessage(new ApiError(0, "offline")), /didn't answer/);
    const unfinished = "This customer still has 6 unfinished shipments. They must be finished or cancelled before this person can become a courier.";
    assert.equal(applicationErrorMessage(new ApiError(409, unfinished)), unfinished);
    assert.equal(applicationErrorMessage(new Error("x")), "Something went wrong. Try again.");
  });
});
