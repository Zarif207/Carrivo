import { expect, test, type Locator, type Page } from "@playwright/test";

/*
 * The courier campaign's two entry points (the home page's "Drive with Carrivo" band and
 * /drive-with-carrivo) send every role to the right place, and home-page scrolling survives header
 * links and leaving and coming back. Production build + LOCAL backend with the dev seed:
 *
 *   E2E_BASE_URL=http://localhost:3100 E2E_PASSWORD='<SEED_DEMO_PASSWORD>' npx playwright test courier-campaign
 *
 * applicant1@carrivo.dev has a pending seeded application; E2E_ADMIN_PASSWORD defaults to E2E_PASSWORD.
 */

const PASSWORD = process.env.E2E_PASSWORD ?? "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? PASSWORD;
const APPLICATION = "/courier-application";

test.skip(!PASSWORD, "set E2E_PASSWORD (the local seed's demo password)");

type Entry = { name: string; open: (page: Page) => Promise<Locator> };

/** Each entry point's primary courier button, once the visitor's own version has streamed in. */
const ENTRIES: Entry[] = [
  {
    name: "home section",
    open: async (page) => {
      await page.goto("/", { waitUntil: "networkidle" });
      const band = page.locator("#drive");
      await band.scrollIntoViewIfNeeded();
      return band.locator("[data-courier-cta]");
    },
  },
  {
    name: "advert page",
    open: async (page) => {
      await page.goto("/drive-with-carrivo", { waitUntil: "networkidle" });
      return page.locator("[data-cta-anchor]").first().locator("[data-courier-cta]");
    },
  },
];

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /^log in$/i }).click();
  await page.waitForURL((url) => url.pathname !== "/login");
}

async function demo(page: Page, button: RegExp, home: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: button }).click();
  await page.waitForURL(`**${home}`);
}

async function register(page: Page) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Jordan Reyes");
  await page.getByLabel("Email").fill(`e2e.campaign.${Date.now()}.${Math.round(Math.random() * 1e6)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL("**/dashboard");
}

const ROLES: {
  role: string;
  setup: (page: Page) => Promise<void>;
  label: string;
  note: RegExp;
  lands: RegExp;
}[] = [
  { role: "customer", setup: register, label: "Become a courier", note: /two minutes/, lands: /\/courier-application$/ },
  {
    role: "pending applicant",
    setup: (page) => signIn(page, "applicant1@carrivo.dev", PASSWORD),
    label: "View my application",
    note: /with an admin/,
    lands: /\/courier-application$/,
  },
  { role: "courier", setup: (page) => demo(page, /^log in as courier/i, "/courier"), label: "Go to my dashboard", note: /already a Carrivo courier/, lands: /\/courier$/ },
  { role: "admin", setup: (page) => signIn(page, "admin@carrivo.dev", ADMIN_PASSWORD), label: "Go to admin", note: /can't apply/, lands: /\/admin$/ },
  { role: "viewer", setup: (page) => demo(page, /admin \(view-only\)/i, "/admin"), label: "Go to admin", note: /can't apply/, lands: /\/admin$/ },
];

for (const entry of ENTRIES) {
  test.describe(`entry point: ${entry.name}`, () => {
    test("logged out: log in first, then straight back to the application form", async ({ page }) => {
      const cta = await entry.open(page);
      await expect(cta).toHaveText(/Become a courier/);
      await cta.click();
      await expect(page).toHaveURL(/\/login\?next=%2Fcourier-application$/);
      await page.getByRole("button", { name: /^log in as customer/i }).click();
      await page.waitForURL(`**${APPLICATION}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    for (const { role, setup, label, note, lands } of ROLES) {
      test(`${role}: "${label}"`, async ({ page }) => {
        await setup(page);
        const cta = await entry.open(page);
        await expect(cta).toHaveText(new RegExp(label));
        // The note sits under the button (in the same CTA block).
        await expect(cta.locator("xpath=ancestor::div[contains(@class,'space-y-3')][1]")).toContainText(note);
        await cta.click();
        await expect(page).toHaveURL(lands);
      });
    }
  });
}

test("the signed-in button swaps in without shifting the layout", async ({ page }) => {
  await register(page);
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/drive-with-carrivo", { waitUntil: "networkidle" });
  await expect(page.locator("[data-cta-anchor] [data-courier-cta]").first()).toHaveAttribute("data-courier-cta", "apply");
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.01);
});

test.describe("advert page on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the sticky bar appears once the hero button is off screen and goes to the form's login", async ({ page }) => {
    await page.goto("/drive-with-carrivo", { waitUntil: "networkidle" });
    const bar = page.locator("[data-sticky-cta]");
    await expect(bar).toBeHidden(); // the hero's own button is on screen
    await page.locator("#requirements").scrollIntoViewIfNeeded();
    await expect(bar).toBeVisible();
    await bar.getByRole("link", { name: /Become a courier/ }).click();
    await expect(page).toHaveURL(/\/login\?next=%2Fcourier-application$/);
  });
});

/* ───────────── Home-page scrolling ───────────── */

const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY));

async function settle(page: Page) {
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 40 && stable < 3; i++) {
    await page.waitForTimeout(150);
    const y = await scrollY(page);
    stable = y === last ? stable + 1 : 0;
    last = y;
  }
}

/** Real wheel input down to the campaign band (the middle of the home page). */
async function wheelToCampaign(page: Page) {
  await page.mouse.move(640, 400);
  for (let i = 0; i < 80; i++) {
    const top = await page.locator("#drive").evaluate((el) => el.getBoundingClientRect().top);
    if (top < 300) break;
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(90);
  }
  await settle(page);
  await page.mouse.wheel(0, -150); // brings the auto-hiding header back
  await settle(page);
  expect(await scrollY(page)).toBeGreaterThan(1500);
}

async function expectWheelScrolls(page: Page) {
  await settle(page);
  await page.mouse.move(640, 400);
  const start = await scrollY(page);
  await page.mouse.wheel(0, 500);
  await settle(page);
  expect(Math.abs((await scrollY(page)) - start)).toBeGreaterThan(150);
}

test.describe("home page scrolling around the campaign band", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("header link from the middle of the page, then Back", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await wheelToCampaign(page);
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Pricing", exact: true }).click();
    await page.waitForURL("**/pricing");
    await expectWheelScrolls(page);
    await page.goBack();
    await page.waitForURL((url) => url.pathname === "/");
    await expectWheelScrolls(page);
  });

  test("logo from the middle of the page", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await wheelToCampaign(page);
    await page.locator("header").getByRole("link").first().click();
    await settle(page);
    await expectWheelScrolls(page);
  });

  test('"Learn more" to the advert page and back: scrolling and the band\'s motion still work', async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await wheelToCampaign(page);
    await page.locator("#drive").getByRole("link", { name: "Learn more" }).click();
    await page.waitForURL("**/drive-with-carrivo");
    await expectWheelScrolls(page);
    await page.goBack();
    await page.waitForURL((url) => url.pathname === "/");
    await expectWheelScrolls(page);
    // Wheel back to the band: its motion restarts once it is on screen again (GSAP marks it live).
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    await wheelToCampaign(page);
    await expect(page.locator("#drive")).toHaveAttribute("data-live", "");
  });
});
