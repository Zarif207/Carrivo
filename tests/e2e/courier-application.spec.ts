import { expect, test, type Browser, type Page } from "@playwright/test";

/*
 * Courier applications end to end. Needs a production build talking to a LOCAL backend with the dev
 * seed (applicant1/2@carrivo.dev have pending applications), never the live API:
 *
 *   E2E_BASE_URL=http://localhost:3100 E2E_PASSWORD='<SEED_DEMO_PASSWORD>' npx playwright test courier-application
 *
 * E2E_ADMIN_PASSWORD defaults to E2E_PASSWORD (the local seed gives the admin the demo password).
 * Each run registers a fresh customer, so it can be repeated.
 */

const PASSWORD = process.env.E2E_PASSWORD ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? PASSWORD;

test.skip(!PASSWORD, "set E2E_PASSWORD (the local seed's demo password)");
test.describe.configure({ mode: "serial" });

async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /^log in$/i }).click();
}

async function adminPage(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await signIn(page, "admin@carrivo.dev", ADMIN_PASSWORD);
  await page.waitForURL("**/admin");
  return { context, page };
}

test("logged-out visitors are sent to log in and come back to the page", async ({ page }) => {
  await page.goto("/courier-application");
  await expect(page).toHaveURL(/\/login\?next=%2Fcourier-application/);
});

test("customer applies, admin approves, customer is told to sign in again and lands as a courier", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const email = `e2e.applicant.${Date.now()}@example.com`;

  // A fresh customer (no shipments, so the approval isn't blocked by unfinished work).
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Morgan Ellis");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL("**/dashboard");

  // The dashboard card leads to the page.
  await page.getByRole("link", { name: /become a courier/i }).last().click();
  await expect(page).toHaveURL(/\/courier-application$/);
  await expect(page.getByRole("heading", { name: "Tell us about yourself" })).toBeVisible();

  // Inline validation before anything is sent.
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText("Choose the vehicle you'll deliver with")).toBeVisible();
  await expect(page.getByText("Tick the box to confirm before you apply")).toBeVisible();

  const phone = page.getByLabel("Phone");
  await phone.fill("3125550188");
  await expect(phone).toHaveValue("(312) 555-0188"); // the mask
  await page.getByRole("combobox", { name: /preferred zone/i }).click();
  await page.getByRole("option", { name: "Chicago Metro" }).click();
  await page.getByRole("combobox", { name: "Vehicle" }).click();
  await page.getByRole("option", { name: "Car" }).click();
  await page.getByLabel(/number plate/i).fill("il e2e-2041");
  await page.getByRole("radio", { name: "Weekdays" }).click();
  await page.getByLabel(/these details are true/i).check();
  await page.getByRole("button", { name: "Submit application" }).click();

  await expect(page.getByRole("heading", { name: "Your application is under review" })).toBeVisible();
  await expect(page.getByText("IL E2E-2041")).toBeVisible();

  // Admin approves it.
  const admin = await adminPage(browser);
  await admin.page.goto(`/admin/courier-applications?searchTerm=${encodeURIComponent(email)}`);
  await admin.page.getByRole("link", { name: "Morgan Ellis" }).first().click();
  const sheet = admin.page.getByRole("dialog");
  await expect(sheet.getByText(email)).toBeVisible();
  await sheet.getByRole("button", { name: "Approve" }).click();
  const confirm = admin.page.getByRole("dialog", { name: /make morgan ellis a courier/i });
  await expect(confirm.getByText(/signed out on every device/)).toBeVisible();
  await expect(confirm.getByRole("combobox", { name: "Zone" })).toContainText("Chicago Metro"); // prefilled
  await confirm.getByRole("button", { name: "Approve" }).click();
  await expect(admin.page.getByText("Morgan Ellis is now a courier")).toBeVisible();
  await admin.context.close();

  // The customer's next request is refused: told why, and sent to log in.
  await page.getByRole("button", { name: "Check status" }).click();
  await expect(page.getByText("Your role changed, please sign in again.")).toBeVisible();
  await page.waitForURL(/\/login\?reason=role-changed/);
  await expect(page.getByRole("status").filter({ hasText: "Your role changed" })).toBeVisible();

  // No loop: the login page stays put, and signing in lands on the courier side.
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/login/);
  await signIn(page, email, PASSWORD);
  await expect(page.getByRole("heading", { name: "You're already a Carrivo courier" })).toBeVisible();
  await page.getByRole("link", { name: "Go to my tasks" }).click();
  await page.waitForURL("**/courier");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Earnings" }).first()).toBeVisible(); // courier navigation
});

test("viewer reads applications but sees no decision buttons", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /admin \(view-only\)/i }).click();
  await page.waitForURL("**/admin");
  await page.goto("/admin/courier-applications");
  await expect(page.getByRole("radio", { name: /^Pending \d+$/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("link", { name: "Priya Nair" }).first().click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("applicant2@carrivo.dev")).toBeVisible();
  await expect(sheet.getByText(/view only/i)).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await expect(sheet.getByRole("button", { name: "Reject" })).toHaveCount(0);
});

test("admin: reject needs a note, and the nav shows the pending count", async ({ browser }) => {
  const admin = await adminPage(browser);
  const nav = admin.page.getByRole("link", { name: /courier applications/i }).first();
  await expect(nav).toBeVisible();
  await admin.page.goto("/admin/courier-applications");
  await admin.page.getByRole("link", { name: "Priya Nair" }).first().click();
  await admin.page.getByRole("dialog").getByRole("button", { name: "Reject" }).click();
  const dialog = admin.page.getByRole("dialog", { name: /reject priya nair/i });
  await dialog.getByLabel(/reason for the applicant/i).fill("no");
  await dialog.getByRole("button", { name: "Reject application" }).click();
  await expect(dialog.getByText(/at least 5 characters/i).first()).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click(); // nothing sent: Priya stays pending for the next run
  await admin.context.close();
});

test("approving a customer with unfinished shipments shows the API's reason in the dialog; the customer can cancel", async ({ page, browser }) => {
  test.setTimeout(90_000);
  // customer1 (demo) owns unfinished seed shipments, so an approval must be refused with a clear 409.
  await page.goto("/login");
  await page.getByRole("button", { name: /^log in as customer/i }).click();
  await page.waitForURL("**/dashboard");
  await page.goto("/courier-application");
  const submit = page.getByRole("button", { name: /submit application|apply again/i });
  await expect(submit.or(page.getByRole("heading", { name: "Your application is under review" }))).toBeVisible();
  if (await submit.isVisible()) {
    await page.getByLabel("Phone").fill("6465550130");
    await page.getByRole("combobox", { name: "Vehicle" }).click();
    await page.getByRole("option", { name: "Van" }).click();
    await page.getByRole("radio", { name: "Full time" }).click();
    await page.getByLabel(/these details are true/i).check();
    await submit.click();
  }
  await expect(page.getByRole("heading", { name: "Your application is under review" })).toBeVisible();

  const admin = await adminPage(browser);
  await admin.page.goto("/admin/courier-applications?searchTerm=customer1%40carrivo.dev");
  await admin.page.getByRole("link", { name: "Emily Carter" }).first().click();
  await admin.page.getByRole("dialog").getByRole("button", { name: "Approve" }).click();
  const confirm = admin.page.getByRole("dialog", { name: /make emily carter a courier/i });
  await confirm.getByRole("combobox", { name: "Zone" }).click(); // no preferred zone: required
  await admin.page.getByRole("option", { name: "New York Metro" }).click();
  await confirm.getByRole("button", { name: "Approve" }).click();
  await expect(confirm.getByRole("alert")).toContainText(/This customer still has \d+ unfinished shipments\. They must be finished or cancelled/);
  await expect(confirm).toBeVisible(); // stays open
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await admin.context.close();

  // The customer withdraws it (confirm dialog), and gets the form back.
  await page.getByRole("button", { name: "Cancel application" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel application" }).click();
  await expect(page.getByText("Application cancelled")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Apply again" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Earlier applications" })).toBeVisible();
});
