import { expect, test, type Page } from "@playwright/test";

/*
 * Regression: scroll down a long public page, use a header control, and the page must still scroll.
 * The bug: opening a header menu stopped Lenis, whose `.lenis-stopped { overflow: clip }` on <html>,
 * combined with Radix's body scroll lock, laid the sticky header out ~scrollY px above the viewport on
 * the home page. The menu opened off-screen and its modal lock froze the page until a refresh.
 * Everything here uses real wheel and keyboard input in real Chrome (see playwright.config.ts).
 */

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 812 };
const PAGES = ["/", "/pricing"] as const;
const NAV = ["Track a parcel", "Services", "Pricing", "About", "Contact"] as const;

const getScrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY));

/** Waits until smooth scrolling has finished (scrollY stable, Lenis not animating). */
async function settle(page: Page) {
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 40 && stable < 3; i++) {
    await page.waitForTimeout(150);
    const { y, scrolling } = await page.evaluate(() => ({
      y: Math.round(window.scrollY),
      scrolling: document.documentElement.classList.contains("lenis-scrolling"),
    }));
    stable = y === last && !scrolling ? stable + 1 : 0;
    last = y;
  }
}

/** Real wheel input down to about `target`, then a small scroll up so the auto-hiding header comes back. */
async function scrollDownThenRevealHeader(page: Page, target = 1500) {
  await page.mouse.move(page.viewportSize()!.width / 2, 500);
  for (let i = 0; i < 40 && (await getScrollY(page)) < target; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(100);
  }
  await settle(page);
  await page.mouse.wheel(0, -120);
  await settle(page);
  expect(await getScrollY(page)).toBeGreaterThan(600);
}

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForTimeout(800); // Lenis loads after hydration
  await scrollDownThenRevealHeader(page);
}

/** No scroll lock, overlay or hidden/inert content may survive once every menu is closed. */
async function expectNoLeftovers(page: Page) {
  const state = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const alpha = (color: string) => {
      const parts = color.match(/rgba?\(([^)]+)\)/)?.[1].split(/[ ,/]+/).filter(Boolean) ?? [];
      return parts.length >= 4 ? Number.parseFloat(parts[3]) : parts.length ? 1 : 0;
    };
    const overlays = [...document.querySelectorAll<HTMLElement>("body *")].filter((el) => {
      const s = getComputedStyle(el);
      if (s.position !== "fixed" || s.display === "none" || s.visibility === "hidden") return false;
      const r = el.getBoundingClientRect();
      return r.width >= innerWidth * 0.5 && r.height >= innerHeight * 0.5 && alpha(s.backgroundColor) > 0.05;
    });
    const header = document.querySelector("header");
    const main = document.querySelector("main");
    return {
      scrollLocked: body.hasAttribute("data-scroll-locked"),
      lenisStopped: html.classList.contains("lenis-stopped"),
      bodyPointerEvents: getComputedStyle(body).pointerEvents,
      htmlOverflow: getComputedStyle(html).overflowY,
      poppers: document.querySelectorAll("[data-radix-popper-content-wrapper]").length,
      openLayers: document.querySelectorAll('[role="menu"], [role="dialog"]').length,
      overlays: overlays.length,
      headerHidden: Boolean(header?.closest("[aria-hidden='true'], [inert]")),
      mainHidden: Boolean(main?.closest("[aria-hidden='true'], [inert]")),
      headerTop: Math.round(header?.getBoundingClientRect().top ?? 0),
    };
  });
  expect(state).toMatchObject({
    scrollLocked: false,
    lenisStopped: false,
    bodyPointerEvents: "auto",
    poppers: 0,
    openLayers: 0,
    overlays: 0,
    headerHidden: false,
    mainHidden: false,
  });
  expect(state.htmlOverflow).not.toBe("clip");
  expect(state.headerTop).toBeGreaterThanOrEqual(-70); // on screen, or hidden by the scroll-away header
}

/** The page scrolls with the wheel and, once settled, with the keyboard. */
async function expectScrollable(page: Page) {
  await settle(page);
  const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  test.skip(max < 400, "page too short to scroll");
  await page.mouse.move(page.viewportSize()!.width / 2, 500);
  const start = await getScrollY(page);
  const dir = start > max - 500 ? -1 : 1;
  await page.mouse.wheel(0, dir * 400);
  await settle(page);
  const afterWheel = await getScrollY(page);
  expect(Math.abs(afterWheel - start), `wheel from ${start}`).toBeGreaterThan(100);

  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const before = await getScrollY(page);
  const keyDir = before > max - 500 ? -1 : 1;
  await page.keyboard.press(keyDir > 0 ? "PageDown" : "PageUp");
  await settle(page);
  expect(Math.abs((await getScrollY(page)) - before), `PageDown/PageUp from ${before}`).toBeGreaterThan(100);
}

/** A header menu must open next to its trigger, inside the viewport, while the page stays locked. */
async function expectMenuOnScreenAndLocked(page: Page) {
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  // The bug appeared ~300 ms after opening (when the lock stopped Lenis), so measure once after the
  // lock has fully applied instead of letting an auto-retrying assertion pass in the first frames.
  await expect(page.locator("body[data-scroll-locked]")).toHaveCount(1);
  await page.waitForTimeout(800);
  const boxes = await page.evaluate(() => {
    const top = (el: Element | null) => Math.round(el?.getBoundingClientRect().top ?? Number.NaN);
    const menuEl = document.querySelector('[role="menu"]');
    const r = menuEl?.getBoundingClientRect();
    return {
      headerTop: top(document.querySelector("header")),
      menuTop: top(menuEl),
      menuInViewport: Boolean(r && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth),
    };
  });
  expect(boxes, "header menu must open next to its trigger, on screen").toMatchObject({ headerTop: 0, menuInViewport: true });
  // The modal menu still locks the page: the wheel must not move it.
  const y = await getScrollY(page);
  await page.mouse.move(200, 600);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(700);
  expect(await getScrollY(page)).toBe(y);
}

async function expectBottomReachable(page: Page) {
  await page.mouse.move(page.viewportSize()!.width / 2, 500);
  for (let i = 0; i < 60; i++) {
    const { y, max } = await page.evaluate(() => ({ y: Math.round(window.scrollY), max: document.documentElement.scrollHeight - innerHeight }));
    if (y >= max - 2) break;
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(80);
  }
  await settle(page);
  const { y, max } = await page.evaluate(() => ({ y: Math.round(window.scrollY), max: document.documentElement.scrollHeight - innerHeight }));
  expect(y).toBeGreaterThanOrEqual(max - 2);
}

for (const path of PAGES) {
  test.describe(`header controls from scrollY≈1500 on ${path}`, () => {
    test.describe("desktop", () => {
      test.use({ viewport: DESKTOP });

      for (const name of NAV) {
        test(`nav link "${name}"`, async ({ page }) => {
          await open(page, path);
          await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name, exact: true }).click();
          await page.waitForLoadState("networkidle");
          await expectNoLeftovers(page);
          await expectScrollable(page);
          await expectBottomReachable(page); // scroll height follows the new page after client navigation
        });
      }

      test("logo", async ({ page }) => {
        await open(page, path);
        await page.locator("header").getByRole("link").first().click();
        await page.waitForURL("**/");
        await expectNoLeftovers(page);
        await expectScrollable(page);
      });

      for (const close of ["pick an option", "Escape", "click outside"] as const) {
        test(`theme menu, close by ${close}`, async ({ page }) => {
          await open(page, path);
          await page.locator("header").getByRole("button", { name: "Change theme" }).click();
          await expectMenuOnScreenAndLocked(page);
          if (close === "pick an option") await page.getByRole("menuitemradio", { name: "Dark" }).click();
          else if (close === "Escape") await page.keyboard.press("Escape");
          else await page.mouse.click(200, 600);
          await expect(page.getByRole("menu")).toHaveCount(0);
          await expectNoLeftovers(page);
          await expectScrollable(page);
        });
      }

      test('"Log in" and "Send a parcel" (signed out)', async ({ page }) => {
        for (const name of ["Log in", "Send a parcel"]) {
          await open(page, path);
          await page.locator("header").getByRole("link", { name }).click();
          await page.waitForLoadState("networkidle");
          await expectNoLeftovers(page);
        }
      });
    });

    test.describe("desktop, signed in (demo customer)", () => {
      test.use({ viewport: DESKTOP });

      test.beforeEach(async ({ page }) => {
        await page.goto("/login", { waitUntil: "networkidle" });
        await page.getByRole("button", { name: /^Log in as Customer/ }).click();
        await page.waitForURL("**/dashboard**");
      });

      for (const close of ["Escape", "click outside"] as const) {
        test(`account menu, close by ${close}`, async ({ page }) => {
          await open(page, path);
          await page.locator("header").getByRole("button", { name: /^Account menu/ }).click();
          await expectMenuOnScreenAndLocked(page);
          if (close === "Escape") await page.keyboard.press("Escape");
          else await page.mouse.click(200, 600);
          await expect(page.getByRole("menu")).toHaveCount(0);
          await expectNoLeftovers(page);
          await expectScrollable(page);
        });
      }
    });

    test.describe("mobile menu", () => {
      test.use({ viewport: MOBILE });

      for (const close of ["close button", "Escape", "nav link"] as const) {
        test(`close by ${close}`, async ({ page }) => {
          await open(page, path);
          await page.getByRole("button", { name: "Open menu" }).click();
          const sheet = page.getByRole("dialog");
          await expect(sheet).toBeVisible();
          if (close === "close button") await sheet.getByRole("button", { name: /close/i }).click();
          else if (close === "Escape") await page.keyboard.press("Escape");
          else await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Services" }).click();
          await expect(sheet).toHaveCount(0);
          await page.waitForLoadState("networkidle");
          await expectNoLeftovers(page);
          await expectScrollable(page);
        });
      }
    });
  });
}
