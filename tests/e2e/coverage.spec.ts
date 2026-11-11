import { expect, test, type Page } from "@playwright/test";

/*
 * Home page "Where we deliver": map, route highlight, cluster inset, filters and the no-JS fallback.
 * Counts come from the page itself (the API decides how many zones exist), never a fixed 15.
 */

const section = (page: Page) => page.locator("#coverage");
const cards = (page: Page) => section(page).locator("article");

/** Waits until smooth scrolling has stopped (scrollY stable, Lenis not animating). */
async function settle(page: Page) {
  let last = -1;
  for (let stable = 0, i = 0; stable < 3 && i < 40; i++) {
    await page.waitForTimeout(120);
    const { y, scrolling } = await page.evaluate(() => ({ y: Math.round(scrollY), scrolling: document.documentElement.classList.contains("lenis-scrolling") }));
    stable = y === last && !scrolling ? stable + 1 : 0;
    last = y;
  }
}

async function openCoverage(page: Page, query = "") {
  await page.goto(`/${query}`, { waitUntil: "networkidle" });
  await section(page).scrollIntoViewIfNeeded();
  await expect(section(page).getByText(/^Showing \d+ of \d+ zones?/)).toBeVisible(); // hydrated
  await settle(page);
}

/** Total zones, from the "All N" tab. */
async function totalZones(page: Page) {
  const label = await section(page).getByRole("radio", { name: /^All \d+$/ }).textContent();
  return Number(label?.replace(/\D/g, ""));
}

test.describe("coverage section", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("headline numbers match the cards and finish counting", async ({ page }) => {
    await openCoverage(page);
    const total = await totalZones(page);
    expect(total).toBeGreaterThan(0);
    const stats = section(page).locator("dl");
    await stats.scrollIntoViewIfNeeded();
    await expect(stats.locator("dd").first()).toHaveText(new RegExp(`^${total}`), { timeout: 4000 });
  });

  test("collapses to six cards, Show all reveals every zone", async ({ page }) => {
    await openCoverage(page);
    const total = await totalZones(page);
    test.skip(total <= 6, "not enough zones to collapse");
    await expect(cards(page)).toHaveCount(6);
    await section(page).getByRole("button", { name: `Show all ${total} zones` }).click();
    await expect(cards(page)).toHaveCount(total);
  });

  test("region tab and search filter the cards and land in the URL", async ({ page }) => {
    await openCoverage(page);
    const michigan = section(page).getByRole("radio", { name: /^Michigan \d+$/ });
    test.skip((await michigan.count()) === 0, "no Michigan zones");
    const expected = Number((await michigan.textContent())?.replace(/\D/g, ""));
    await michigan.click();
    await expect(cards(page)).toHaveCount(Math.min(expected, 6));
    await expect(page).toHaveURL(/region=michigan/);

    await section(page).getByRole("searchbox", { name: /search zones/i }).fill("flint");
    await expect(cards(page)).toHaveCount(1);
    await expect(page).toHaveURL(/zone=flint/);

    await section(page).getByRole("searchbox").fill("no such place");
    await expect(section(page).getByText(/No zone matches/)).toBeVisible();
    await section(page).getByRole("button", { name: "Show every zone" }).click();
    await expect(cards(page)).toHaveCount(6);
  });

  test("a shared URL restores the view", async ({ page }) => {
    await openCoverage(page, "?region=michigan&zone=lansing");
    await expect(section(page).getByRole("radio", { name: /^Michigan/ })).toHaveAttribute("aria-checked", "true");
    await expect(cards(page)).toHaveCount(1);
  });

  test("hovering a card highlights its routes; hovering a pin highlights its card", async ({ page }) => {
    await openCoverage(page);
    // Chicago's routes leave its pin on the national map (a Michigan zone's may all sit inside the cluster).
    const first = section(page).locator("#zone-CHI");
    test.skip((await first.count()) === 0, "no Chicago card");
    await first.scrollIntoViewIfNeeded();
    await settle(page);
    await first.hover();
    await expect(first).toHaveAttribute("data-active", "true");
    // Routes not touching this zone dim to 0.18 (wide layout, the one showing at 1280px).
    const wide = section(page).locator("figure .sm\\:block svg").first();
    const all = await wide.locator("[data-flow]").count();
    await expect.poll(() => wide.locator("g[opacity='0.18']").count()).toBeGreaterThan(0);
    expect(await wide.locator("g[opacity='0.18']").count()).toBeLessThan(all);

    await page.mouse.move(5, 5);
    const pin = section(page).getByRole("button", { name: /^Chicago Metro, / });
    test.skip((await pin.count()) === 0, "no Chicago pin");
    await pin.scrollIntoViewIfNeeded();
    await settle(page);
    await pin.hover();
    await expect(section(page).locator("#zone-CHI")).toHaveAttribute("data-active", "true");
  });

  test("clicking a pin brings its card into view, even when hidden behind Show all", async ({ page }) => {
    await openCoverage(page);
    const pin = section(page).getByRole("button", { name: /^Washington DC Metro, / });
    test.skip((await pin.count()) === 0, "no Washington pin");
    await pin.click();
    await expect(section(page).locator("#zone-WDC")).toBeInViewport();
    await expect(section(page).locator("#zone-WDC")).toBeFocused();
  });

  test("cluster pin opens a regional inset on hover, focus and click; Escape closes it", async ({ page }) => {
    await openCoverage(page);
    const cluster = section(page).getByRole("button", { name: /zones close together/ });
    test.skip((await cluster.count()) === 0, "no cluster");
    const inset = section(page).getByRole("group", { name: /regional map/ });

    await cluster.scrollIntoViewIfNeeded();
    await settle(page);
    await cluster.hover();
    await expect(inset).toBeVisible();
    await expect(cluster).toHaveAttribute("aria-expanded", "true");
    await page.mouse.move(5, 5);
    await expect(inset).toBeHidden();

    await cluster.focus();
    await expect(inset).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(inset).toBeHidden();
    await expect(cluster).toBeFocused();

    await cluster.click();
    await expect(inset).toBeVisible();
    const entries = inset.getByRole("listitem");
    expect(await entries.count()).toBeGreaterThan(1);
    await inset.getByRole("button", { name: /^Lansing Metro/ }).click();
    await expect(inset).toBeHidden();
    await expect(section(page).locator("#zone-LAN")).toBeInViewport();
  });

  test("hub links: tel: and Google Maps directions", async ({ page }) => {
    await openCoverage(page);
    const card = cards(page).first();
    await expect(card.locator("a[href^='tel:+1']").first()).toBeVisible();
    await expect(card.getByRole("link", { name: /^Directions to / }).first()).toHaveAttribute("href", /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
  });

  test("animates only while on screen", async ({ page }) => {
    await openCoverage(page);
    const net = section(page).locator(".coverage-net").first();
    await net.scrollIntoViewIfNeeded();
    await expect(net).toHaveAttribute("data-live", "");
    expect(await section(page).locator("animateMotion").count()).toBeGreaterThan(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(net).not.toHaveAttribute("data-live", "");
  });
});

test.describe("coverage section, reduced motion", () => {
  test.use({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });

  test("routes are static: no flowing dashes, no parcels", async ({ page }) => {
    await openCoverage(page);
    const net = section(page).locator(".coverage-net").first();
    await net.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(net).not.toHaveAttribute("data-live", "");
    expect(await section(page).locator("animateMotion").count()).toBe(0);
    expect(await section(page).locator("svg [data-flow]").count()).toBeGreaterThan(0);
  });
});

test.describe("coverage section, phone", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test("cards fit the screen and the cluster inset opens below the map on tap", async ({ page }) => {
    await openCoverage(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    for (const box of await cards(page).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().right))) expect(box).toBeLessThanOrEqual(375);

    // On phones nearby metros share wider clusters (24px touch targets); every pin button keeps its space.
    const pins = await section(page).locator("figure button[aria-label]").evaluateAll((els) =>
      els.filter((el) => el.getClientRects().length).map((el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }),
    );
    for (const a of pins) for (const b of pins) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(24);
    const cluster = section(page).getByRole("button", { name: /Michigan: \d+ zones close together/ });
    test.skip((await cluster.count()) === 0, "no Michigan cluster");
    await cluster.tap();
    const inset = section(page).getByRole("group", { name: /regional map/ });
    await expect(inset).toBeVisible();
    await section(page).getByRole("button", { name: "Close the regional map" }).tap();
    await expect(inset).toBeHidden();
  });
});

test.describe("coverage section without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });

  test("every zone and hub is in the server HTML", async ({ page }) => {
    await page.goto("/");
    const total = Number((await section(page).getByRole("radio", { name: /^All \d+$/ }).textContent())?.replace(/\D/g, ""));
    expect(total).toBeGreaterThan(0);
    await expect(cards(page)).toHaveCount(total);
    expect(await cards(page).locator("a[href^='https://www.google.com/maps']").count()).toBeGreaterThanOrEqual(total);
    expect(await section(page).locator("svg [data-flow]").count()).toBeGreaterThan(0);
  });
});
