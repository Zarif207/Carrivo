import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { US_PHONE_PATTERN, ZIP_PATTERN, formatUsAddress, isUsStateCode, isValidUsAddressLine, parseUsAddress, US_STATE_CODES } from "../src/lib/us.ts";

describe("US phone (same rule as the API)", () => {
  it("accepts common US formats", () => {
    for (const phone of ["(212) 555-0142", "212-555-0142", "212.555.0142", "2125550142", "+1 212 555 0142", "1-212-555-0142"]) {
      assert.ok(US_PHONE_PATTERN.test(phone), phone);
    }
  });
  it("rejects non-US and malformed numbers", () => {
    for (const phone of ["+44 20 7946 0958", "012-555-0142", "212-055-0142", "555-0142", "+8801711000000", ""]) {
      assert.ok(!US_PHONE_PATTERN.test(phone), phone);
    }
  });
});

describe("ZIP and states", () => {
  it("accepts ZIP and ZIP+4 only", () => {
    assert.ok(ZIP_PATTERN.test("10118"));
    assert.ok(ZIP_PATTERN.test("10118-0110"));
    for (const zip of ["1011", "101180", "10118-01", "SW1A 2AA"]) assert.ok(!ZIP_PATTERN.test(zip), zip);
  });
  it("lists 50 states plus DC", () => {
    assert.equal(US_STATE_CODES.length, 51);
    assert.ok(isUsStateCode("NY") && isUsStateCode("DC"));
    assert.ok(!isUsStateCode("PR") && !isUsStateCode("ny"));
  });
});

describe("US address line", () => {
  it("joins the parts the way the API stores them", () => {
    assert.equal(formatUsAddress({ street: " 350 5th Ave ", city: "New York", state: "ny", zip: "10118" }), "350 5th Ave, New York, NY 10118");
  });
  it("splits an API line back into parts, commas in the street included", () => {
    assert.deepEqual(parseUsAddress("88 Greenwich St, Apt 3B, New York, NY 10006"), { street: "88 Greenwich St, Apt 3B", city: "New York", state: "NY", zip: "10006" });
    assert.deepEqual(parseUsAddress("47-10 Austell Pl, Long Island City, ny 11101-1234"), { street: "47-10 Austell Pl", city: "Long Island City", state: "NY", zip: "11101-1234" });
  });
  it("keeps a non-US line whole in street so it can be fixed", () => {
    assert.deepEqual(parseUsAddress("House 10, Road 3, Uttara, Dhaka"), { street: "House 10, Road 3, Uttara, Dhaka", city: "", state: "", zip: "" });
    assert.deepEqual(parseUsAddress(null), { street: "", city: "", state: "", zip: "" });
  });
  it("validates whole lines like the API", () => {
    assert.ok(isValidUsAddressLine("1200 E 7th St, Los Angeles, CA 90021"));
    assert.ok(!isValidUsAddressLine("1200 E 7th St, Los Angeles, XX 90021"));
    assert.ok(!isValidUsAddressLine("10 Downing St, London SW1A 2AA"));
  });
});
