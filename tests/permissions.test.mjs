import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchBffRule } from "../src/lib/api/bff-allowlist.ts";
import { STAFF_ROLES, canDeleteNotifications, canMarkNotificationsRead, canMutate, isReadOnly, isStaff, readOnlyMayWrite } from "../src/lib/auth/permissions.ts";

const ROLES = ["CUSTOMER", "COURIER", "ADMIN", "ADMIN_VIEWER"];

describe("admin permissions", () => {
  it("only ADMIN may make admin changes", () => {
    assert.deepEqual(ROLES.filter(canMutate), ["ADMIN"]);
    assert.equal(canMutate(null), false);
    assert.equal(canMutate(undefined), false);
  });
  it("ADMIN_VIEWER is the only read-only role", () => {
    assert.deepEqual(ROLES.filter(isReadOnly), ["ADMIN_VIEWER"]);
  });
  it("staff are ADMIN and ADMIN_VIEWER", () => {
    assert.deepEqual(ROLES.filter(isStaff), ["ADMIN", "ADMIN_VIEWER"]);
    assert.deepEqual([...STAFF_ROLES], ["ADMIN", "ADMIN_VIEWER"]);
  });
});

describe("notification permissions", () => {
  const ID = "01a1c5d4-84b8-7033-9308-9cf99bb0e510";

  it("every signed-in role may mark its own notifications read; only the viewer may not delete", () => {
    assert.deepEqual(ROLES.filter(canMarkNotificationsRead), ROLES);
    assert.deepEqual(ROLES.filter(canDeleteNotifications), ["CUSTOMER", "COURIER", "ADMIN"]);
    assert.equal(canDeleteNotifications(undefined), false);
    assert.equal(canMarkNotificationsRead(null), false);
  });

  it("the viewer's only BFF writes are the two read-state PATCHes", () => {
    assert.equal(readOnlyMayWrite("PATCH", `/notifications/${ID}/read`), true);
    assert.equal(readOnlyMayWrite("patch", "/notifications/read-all"), true);
    for (const [method, path] of [
      ["DELETE", `/notifications/${ID}`],
      ["DELETE", `/notifications/${ID}/read`],
      ["POST", "/notifications/read-all"],
      ["PATCH", `/notifications/${ID}`],
      ["PATCH", `/notifications/${ID}/read/x`],
      ["PATCH", "/notifications/not-a-uuid/read"],
      ["PATCH", `/zones/${ID}`],
      ["PATCH", "/users/me"],
    ]) {
      assert.equal(readOnlyMayWrite(method, path), false, `${method} ${path}`);
    }
  });

  it("the BFF proxies the notification endpoints", () => {
    assert.ok(matchBffRule("GET", "/notifications/unread-count"));
    assert.ok(matchBffRule("DELETE", `/notifications/${ID}`));
    assert.ok(matchBffRule("PATCH", `/notifications/${ID}/read`));
    assert.equal(matchBffRule("DELETE", "/notifications/read-all"), null);
  });
});
