import { instant } from "@next/playwright";
import { expect, type Page, test } from "@playwright/test";

const origin = process.env.BASE_URL ?? "http://127.0.0.1:3005";

/**
 * Every page paints its static shell first and streams the rest. A visitor on
 * a slow connection sees the shell, then the streamed content replaces its
 * placeholders. Nothing already on screen may move when that happens, and
 * nothing may move as the page loads images and fonts or as it is scrolled.
 *
 * Each test loads the shell alone (`instant()` holds back the stream), lets
 * the stream in, scrolls to the bottom and back, and fails on any layout
 * shift, listing the elements that moved.
 */

type Shift = {
  value: number;
  time: number;
  sources: { node: string; from: number[]; to: number[] }[];
};

declare global {
  interface Window {
    __layoutShifts?: Shift[];
  }
}

function recordLayoutShifts() {
  const describeNode = (node: Node | null): string => {
    if (!node) {
      return "(removed)";
    }
    if (!(node instanceof Element)) {
      return `#text "${(node.textContent ?? "").trim().slice(0, 40)}"`;
    }
    const id = node.id ? `#${node.id}` : "";
    const testId = node.getAttribute("data-testid");
    const classes = String(node.getAttribute("class") ?? "").slice(0, 80);
    return `${node.tagName.toLowerCase()}${id}${testId ? `[data-testid=${testId}]` : ""} .${classes}`;
  };
  const rect = (r: DOMRectReadOnly) =>
    [r.x, r.y, r.width, r.height].map((n) => Math.round(n));

  window.__layoutShifts = [];
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as unknown as Array<
      PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
        sources: {
          node: Node | null;
          previousRect: DOMRectReadOnly;
          currentRect: DOMRectReadOnly;
        }[];
      }
    >) {
      if (entry.hadRecentInput) {
        continue;
      }
      window.__layoutShifts?.push({
        value: entry.value,
        time: Math.round(entry.startTime),
        sources: entry.sources.map((source) => ({
          node: describeNode(source.node),
          from: rect(source.previousRect),
          to: rect(source.currentRect),
        })),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
}

async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const pause = () => new Promise((resolve) => setTimeout(resolve, 150));
    // A screen at a time: long pages (team sheets on a phone) stay quick.
    const step = Math.max(400, window.innerHeight - 100);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await pause();
    }
    window.scrollTo(0, 0);
    await pause();
  });
}

async function expectNoLayoutShift(page: Page, path: string) {
  const url = new URL(path, origin).toString();
  await instant(
    page,
    async () => {
      await page.goto(url);
      await page.waitForLoadState("load");
      await page.evaluate(() => document.fonts.ready);
    },
    { baseURL: new URL(url).origin },
  );

  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await scrollThrough(page);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const shifts = await page.evaluate(() => window.__layoutShifts ?? []);
  const total = shifts.reduce((sum, shift) => sum + shift.value, 0);
  expect(
    shifts,
    `${path} moved ${total.toFixed(4)} (CLS):\n${JSON.stringify(shifts, null, 2)}`,
  ).toEqual([]);
}

/**
 * A client-side navigation: the router shows the next page's shell at once and
 * streams the rest. Shifts within 500ms of the click don't count toward CLS;
 * holding the stream back with `instant()` makes every later one count.
 */
async function expectNoLayoutShiftAfterClick(
  page: Page,
  from: string,
  link: (page: Page) => ReturnType<Page["locator"]>,
) {
  await page.goto(new URL(from, origin).toString());
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    window.__layoutShifts = [];
  });
  const target = link(page).first();
  await target.scrollIntoViewIfNeeded();
  const href = await target.getAttribute("href");
  await instant(
    page,
    async () => {
      await target.click();
      await page.waitForURL((url) => url.pathname === href);
    },
    { baseURL: origin },
  );
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  const shifts = await page.evaluate(() => window.__layoutShifts ?? []);
  const total = shifts.reduce((sum, shift) => sum + shift.value, 0);
  expect(
    shifts,
    `${from} → ${href} moved ${total.toFixed(4)} (CLS):\n${JSON.stringify(shifts, null, 2)}`,
  ).toEqual([]);
}

/** First same-site link on `path` whose href matches `pattern`. */
async function discover(page: Page, path: string, pattern: RegExp) {
  await page.goto(new URL(path, origin).toString());
  // The links may stream in after the shell, so wait for one to match.
  let href: string | undefined;
  await expect
    .poll(
      async () => {
        const hrefs = await page
          .locator("main a[href^='/']")
          .evaluateAll((links) =>
            links.map((link) => link.getAttribute("href")),
          );
        href = hrefs.find((h): h is string => !!h && pattern.test(h));
        return href;
      },
      { message: `no link matching ${pattern} on ${path}`, timeout: 15_000 },
    )
    .toBeTruthy();
  return href as string;
}

const STATIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/newsletter",
  "/search",
  "/college/news",
  "/college/teams",
  "/transfer-portal",
  "/rankings/methodology",
  "/ratings/methodology",
  "/college/football/news",
  "/college/football/news/fcs",
  "/college/football/rankings",
  "/college/football/rankings/fcs",
  "/college/football/rankings/fcs/2026/0",
  "/college/football/rankings/fcs/2026/11",
  "/college/football/rankings/fcs/2026/11/ballots",
  "/college/football/rankings/fcs/2026/11/ballots/by-voter",
  "/college/football/rankings/fcs/history",
  "/college/football/rankings/fcs/voters",
  "/college/football/ratings/fcs",
  "/college/football/ratings/fcs/accuracy",
  "/college/football/playoffs/fcs",
  "/college/football/playoffs/fcs/2026",
  "/college/football/playoffs/fcs/2026/projections/week-10",
  "/college/football/playoffs/fcs/builder",
  "/college/football/transfer-portal",
  "/this-page-does-not-exist",
];

const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "desktop", width: 1920, height: 1080 },
];

for (const viewport of VIEWPORTS) {
  test.describe(`no layout shift at ${viewport.name} (${viewport.width}px)`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
    });
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(recordLayoutShifts);
    });

    for (const path of STATIC_PATHS) {
      test(path, async ({ page }) => {
        await expectNoLayoutShift(page, path);
      });
    }

    test("home → article (client navigation)", async ({ page }) => {
      await expectNoLayoutShiftAfterClick(page, "/", (p) =>
        p.locator('[data-testid="home-feed"] article a[href^="/"]'),
      );
    });

    test("news → article (client navigation)", async ({ page }) => {
      await expectNoLayoutShiftAfterClick(page, "/college/football/news", (p) =>
        p.locator('main article a[href^="/"]:not([href^="/college"])'),
      );
    });

    test("poll → ballots tab (client navigation)", async ({ page }) => {
      await expectNoLayoutShiftAfterClick(
        page,
        "/college/football/rankings/fcs",
        (p) =>
          p
            .getByRole("navigation", { name: "Rankings sections" })
            .getByRole("link", { name: "Ballots" }),
      );
    });

    test("poll → voters tab (client navigation)", async ({ page }) => {
      await expectNoLayoutShiftAfterClick(
        page,
        "/college/football/rankings/fcs",
        (p) =>
          p
            .getByRole("navigation", { name: "Rankings sections" })
            .getByRole("link", { name: "Voters" }),
      );
    });

    test("rankings index → a poll (client navigation)", async ({ page }) => {
      await expectNoLayoutShiftAfterClick(
        page,
        "/college/football/rankings",
        (p) => p.locator('main a[href^="/college/football/rankings/"]'),
      );
    });

    test("an article", async ({ page }) => {
      const href = await discover(page, "/college/football/news", /^\/[^/]+$/);
      await expectNoLayoutShift(page, href);
    });

    test("a team page", async ({ page }) => {
      const href = await discover(
        page,
        "/college/teams",
        /^\/college\/teams\/[^/]+$/,
      );
      await expectNoLayoutShift(page, href);
    });

    test("a person page", async ({ page }) => {
      const href = await discover(page, "/about", /^\/people\/[^/]+$/);
      await expectNoLayoutShift(page, href);
    });

    test("a player page", async ({ page }) => {
      // Player pages 404 until the portal is public; the sitemap lists them then.
      test.skip(
        process.env.PORTAL_PUBLIC !== "true",
        "player pages are hidden while PORTAL_PUBLIC is off",
      );
      const response = await page.request.get(
        new URL("/players/sitemap.xml", origin).toString(),
      );
      const loc = /<loc>[^<]*?(\/players\/[^<]+)<\/loc>/.exec(
        await response.text(),
      )?.[1];
      expect(loc, "no player in /players/sitemap.xml").toBeTruthy();
      await expectNoLayoutShift(page, loc as string);
    });

    for (const sheets of [false, true]) {
      test(`a ratings week${sheets ? "'s team sheets" : ""}`, async ({
        page,
      }) => {
        // The latest ratings page links that week's team sheets.
        const href = await discover(
          page,
          "/college/football/ratings/fcs",
          /^\/college\/football\/ratings\/fcs\/\d+\/[^/]+\/team-sheets$/,
        );
        await expectNoLayoutShift(
          page,
          sheets ? href : href.replace(/\/team-sheets$/, ""),
        );
      });
    }
  });
}
