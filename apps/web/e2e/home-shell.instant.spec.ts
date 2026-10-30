import { instant } from "@next/playwright";
import { expect, test } from "@playwright/test";

const origin = process.env.BASE_URL ?? "http://127.0.0.1:3005";

test("homepage header and feed are in the initial document", async ({
  page,
}) => {
  const url = new URL("/", origin).toString();
  await instant(
    page,
    async () => {
      await page.goto(url);
      await expect(page.getByTestId("site-header")).toBeVisible();
      await expect(page.getByTestId("home-feed")).toBeVisible();
    },
    { baseURL: new URL(url).origin },
  );
});
