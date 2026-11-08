import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STAFF_ROLES, canMutate, isReadOnly, isStaff } from "../src/lib/auth/permissions.ts";

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
