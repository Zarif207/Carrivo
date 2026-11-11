import { expect, test, type Page } from "@playwright/test";

/*
 * "Mobile app, coming soon" on the home page. Production build (no login needed):
 *
 *   E2E_BASE_URL=http://localhost:3100 npx playwright test app-teaser
 */

const section = (page: Page) => page.locator("section#app");
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

/** Real wheel input down to the teaser (the bottom of the home page). */
async function wheelToTeaser(page: Page) {
  await page.mouse.move(640, 400);
  for (let i = 0; i < 120; i++) {
    const top = await section(page).evaluate((el) => el.getBoundingClientRect().top);
    if (top < 200) break;
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(80);
  }
  await settle(page);
}

test.use({ viewport: { width: 1280, height: 800 } });

test("renders as a section a screen reader can name, with disabled store buttons that are not links", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/", { waitUntil: "networkidle" });
  await wheelToTeaser(page);
  await expect(page.getByRole("region", { name: /Mobile app, coming soon/ })).toBeVisible();
  await expect(section(page).getByRole("heading", { level: 2 })).toHaveText(/Every parcel, tracked from your pocket/);

  for (const store of ["App Store", "Google Play"]) {
    const button = section(page).getByRole("button", { name: `${store}: coming soon` });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
    await expect(button).toHaveAttribute("aria-disabled", "true");
  }
  await expect(section(page).getByRole("link")).toHaveCount(0);
  // The mockup is decorative; its text alternative is the caption.
  await expect(section(page).locator("figure > [aria-hidden='true']")).toHaveCount(1);

  await page.waitForTimeout(4000); // let the loop run a while
  expect(errors).toEqual([]);
});

test("the phone's timeline loops while on screen", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await wheelToTeaser(page);
  const current = section(page).locator("[data-app-step][data-state='current']");
  const seen = new Set<string>();
  for (let i = 0; i < 24 && seen.size < 3; i++) {
    seen.add((await current.textContent()) ?? "");
    await page.waitForTimeout(500);
  }
  expect(seen.size).toBeGreaterThanOrEqual(3);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("shows the finished state, still", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await wheelToTeaser(page);
    await page.waitForTimeout(4000); // GSAP has loaded by now
    const current = section(page).locator("[data-app-step][data-state='current']");
    await expect(current).toHaveText("Delivered");
    await page.waitForTimeout(2500);
    await expect(current).toHaveText("Delivered");
    await expect(section(page).locator("[data-app-toast]").filter({ hasText: "Delivered with photo" })).toBeVisible();
  });
});

test("navigating away from the bottom of the page and back leaves it scrollable", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await wheelToTeaser(page);
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Pricing", exact: true }).click();
  await page.waitForURL("**/pricing");
  await page.goBack();
  await page.waitForURL((url) => url.pathname === "/");
  await settle(page);
  await page.mouse.move(640, 400);
  const start = await scrollY(page);
  await page.mouse.wheel(0, start > 1500 ? -800 : 800);
  await settle(page);
  expect(Math.abs((await scrollY(page)) - start)).toBeGreaterThan(200);
});
