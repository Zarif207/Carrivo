import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { notificationHref, safeInternalPath } from "../src/lib/notifications/link.ts";
import { NOTIFICATION_LABELS, notificationLabel } from "../src/lib/notifications/labels.ts";
import { NOTIFICATION_TYPES } from "../src/types/enums.ts";

describe("safeInternalPath (notification links)", () => {
  it("keeps in-app paths, with query and hash", () => {
    assert.equal(safeInternalPath("/admin/shipments/01a1c5d3-e58e-7455-8ede-044e8eaf3ecc"), "/admin/shipments/01a1c5d3-e58e-7455-8ede-044e8eaf3ecc");
    assert.equal(safeInternalPath("/admin/payments?status=FAILED"), "/admin/payments?status=FAILED");
    assert.equal(safeInternalPath("/admin/settings?tab=hubs#list"), "/admin/settings?tab=hubs#list");
    assert.equal(safeInternalPath("/shipments/abc"), "/shipments/abc");
    assert.equal(safeInternalPath("  /admin/users  "), "/admin/users");
  });

  it("normalizes dot segments without leaving the site", () => {
    assert.equal(safeInternalPath("/admin/../dashboard"), "/dashboard");
    assert.equal(safeInternalPath("/../../etc"), "/etc");
  });

  it("rejects anything that is not a same-origin path", () => {
    for (const bad of [
      "https://evil.example/admin",
      "http://localhost:3000/admin",
      "//evil.example/admin",
      "///evil.example",
      "/\\evil.example",
      "\\\\evil.example",
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "mailto:ops@example.com",
      "admin/shipments",
      "./admin",
      "?tab=hubs",
      "#top",
      "/\t/evil.example",
      "/admin\n/x",
      "/ad min",
      "",
      "   ",
      `/${"a".repeat(3000)}`,
    ]) {
      assert.equal(safeInternalPath(bad), null, JSON.stringify(bad));
    }
  });

  it("rejects non-strings", () => {
    for (const bad of [null, undefined, 42, {}, ["/admin"]]) assert.equal(safeInternalPath(bad), null);
  });

  it("notificationHref: the safe link, or null (just mark it read)", () => {
    assert.equal(notificationHref({ link: "/admin/users" }), "/admin/users");
    assert.equal(notificationHref({ link: null }), null);
    assert.equal(notificationHref({}), null);
    assert.equal(notificationHref({ link: "https://evil.example" }), null);
  });
});

describe("notification labels", () => {
  it("label every type the API sends, including the staff types", () => {
    assert.deepEqual(Object.keys(NOTIFICATION_LABELS).sort(), [...NOTIFICATION_TYPES].sort());
    for (const type of ["SHIPMENT_CANCELLED", "PAYMENT_FAILED", "REFUND_FAILED", "ZONE_CHANGED", "HUB_CHANGED", "COURIER_ADDED"]) {
      assert.ok(NOTIFICATION_TYPES.includes(type), type);
    }
    assert.equal(notificationLabel("SHIPMENT_CREATED"), "Shipment booked");
    assert.equal(notificationLabel("PAYMENT_FAILED"), "Payment failed");
  });

  it("falls back for a type a newer API adds", () => {
    assert.equal(notificationLabel("SOMETHING_NEW"), "Update");
  });
});
