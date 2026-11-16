import { instant } from "@next/playwright";
import { expect, type Page, test } from "@playwright/test";

const origin = process.env.BASE_URL ?? "http://127.0.0.1:3005";

/**
 * The rankings card and sponsorships render on each request, so a poll publish
 * or a sponsorship edit rewrites no cached pages. These tests fail if either
 * goes back into a page's static shell, or if the shell stops holding the
 * card's space while it loads.
 */
async function expectRankingsCardStreamsIn(page: Page) {
  await expect(page.getByTestId("rankings-widget-skeleton")).toBeVisible();
  await expect(page.getByTestId("rankings-widget")).toHaveCount(0);
  await expect(page.locator("[data-ad-slot]")).toHaveCount(0);
}

test("homepage shell holds the rankings card's space, then the card streams in", async ({
  page,
}) => {
  const url = new URL("/", origin).toString();
  await instant(
    page,
    async () => {
      await page.goto(url);
      await expect(page.getByTestId("site-header")).toBeVisible();
      await expect(page.getByTestId("home-feed")).toBeVisible();
      await expectRankingsCardStreamsIn(page);
    },
    { baseURL: new URL(url).origin },
  );

  await expect(page.getByTestId("rankings-widget")).toBeVisible();
  await expect(page.getByTestId("rankings-widget-skeleton")).toHaveCount(0);
});

test("football article shell has the story, then the rankings card streams in", async ({
  page,
}) => {
  // Any published football story: its sidebar always carries the card.
  await page.goto(new URL("/college/football/news", origin).toString());
  const href = await page
    .locator('main article a[href^="/"]')
    .first()
    .getAttribute("href");
  expect(href).toBeTruthy();

  const url = new URL(href as string, origin).toString();
  await instant(
    page,
    async () => {
      await page.goto(url);
      await expect(page.getByTestId("site-header")).toBeVisible();
      await expect(page.locator("article h1")).toBeVisible();
      await expectRankingsCardStreamsIn(page);
    },
    { baseURL: new URL(url).origin },
  );

  await expect(page.getByTestId("rankings-widget")).toBeVisible();
  await expect(page.getByTestId("rankings-widget-skeleton")).toHaveCount(0);
});
