import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { postLoginPath, safeNextPath } from "../src/lib/auth/redirects.ts";
import { SIGNED_OUT_CTA, courierCta, courierCtaKind } from "../src/lib/courier-cta.ts";

const NOW = new Date("2026-11-11T15:00:00Z");

const application = (status, extra = {}) => ({
  id: "019a5e00-0000-7000-8000-00000000c001",
  status,
  phone: "(312) 555-0140",
  vehicleType: "CAR",
  vehiclePlate: null,
  availability: "WEEKDAYS",
  experience: null,
  about: null,
  reviewNote: status === "REJECTED" ? "Please add your experience." : null,
  reviewedAt: status === "PENDING" ? null : "2026-11-08T15:00:00Z",
  createdAt: "2026-11-01T15:00:00Z",
  updatedAt: "2026-11-08T15:00:00Z",
  preferredZone: null,
  ...extra,
});

const mine = (latest, extra = {}) => ({
  latest,
  history: latest ? [latest] : [],
  canApply: !latest || latest.status === "CANCELLED",
  canReapplyAt: null,
  blockedReason: null,
  cooldownDays: 7,
  ...extra,
});

describe("courier campaign CTA: one decision for every entry point", () => {
  it("logged out: log in first, with a validated return path to the application page", () => {
    const cta = courierCta(null, null, NOW);
    assert.equal(cta, SIGNED_OUT_CTA);
    assert.equal(cta.href, "/login?next=%2Fcourier-application");
    assert.equal(cta.label, "Become a courier");
    const next = new URL(cta.href, "http://x").searchParams.get("next");
    assert.equal(safeNextPath(next), "/courier-application");
    // After login each role lands where the proxy allows (customers on the form).
    assert.equal(postLoginPath("CUSTOMER", next), "/courier-application");
  });

  it("customer who can apply: straight to the form", () => {
    for (const data of [null, mine(null), mine(application("CANCELLED"))]) {
      const cta = courierCta("CUSTOMER", data, NOW);
      assert.deepEqual([cta.kind, cta.href, cta.label], ["apply", "/courier-application", "Become a courier"]);
    }
  });

  it("pending applicant: View my application", () => {
    const cta = courierCta("CUSTOMER", mine(application("PENDING")), NOW);
    assert.deepEqual([cta.kind, cta.href, cta.label], ["view-application", "/courier-application", "View my application"]);
    assert.match(cta.note, /with an admin/);
  });

  it("rejected: the page while the wait runs, the form once it's over", () => {
    const rejected = application("REJECTED");
    assert.equal(courierCtaKind("CUSTOMER", mine(rejected, { canReapplyAt: "2026-11-15T15:00:00Z" }), NOW), "view-application");
    assert.equal(courierCtaKind("CUSTOMER", mine(rejected, { canReapplyAt: "2026-11-10T15:00:00Z", canApply: true }), NOW), "apply");
  });

  it("courier: their dashboard; admin and viewer: the admin area, with a note that they can't apply", () => {
    const courier = courierCta("COURIER", null, NOW);
    assert.deepEqual([courier.href, courier.label], ["/courier", "Go to my dashboard"]);
    for (const role of ["ADMIN", "ADMIN_VIEWER"]) {
      const staff = courierCta(role, null, NOW);
      assert.deepEqual([staff.kind, staff.href], ["staff", "/admin"]);
      assert.match(staff.note, /can't apply/);
    }
  });

  it("every link stays on this site", () => {
    const roles = [null, "CUSTOMER", "COURIER", "ADMIN", "ADMIN_VIEWER"];
    for (const role of roles) assert.ok(safeNextPath(courierCta(role, null, NOW).href), `${role} link`);
  });
});
