import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";
import { mockFeed, makeApiFeed } from "./helpers/feedFixture.js";

test.describe("share and embed", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await mockFeed(page, { 1: makeApiFeed(1) });
  });

  test("opens the share menu with image and embed options", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("share-1").click();
    await expect(page.getByTestId("menu-copy-image-1")).toBeVisible();
    await expect(page.getByTestId("menu-embed-1")).toBeVisible();
  });

  test("shows the embed code and the preview iframe", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.getByTestId("share-1").click();
    await page.getByTestId("menu-embed-1").click();

    const modal = page.getByTestId("embed-modal");
    await expect(modal).toBeVisible();
    const code = await page.getByTestId("embed-code").inputValue();
    expect(code).toContain("/nguyenvana/post/1/embed");
    expect(code).toContain("<iframe");

    const preview = page.getByTestId("embed-preview");
    await expect(preview).toHaveAttribute(
      "src",
      /\/nguyenvana\/post\/1\/embed$/,
    );

    await page.getByTestId("embed-copy").click();
    await expect(page.getByText("Đã sao chép mã nhúng")).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain("<iframe");
  });

  test("the embed page renders the post without the app chrome", async ({
    page,
  }) => {
    await page.route("**/api/posts/1", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: makeApiFeed(1)[0] }),
      }),
    );
    await page.goto("/nguyenvana/post/1/embed");

    await expect(page.getByTestId("embed-page")).toBeVisible();
    await expect(page.getByTestId("post-1")).toContainText("nguyenvana");
    await expect(page.getByTestId("embed-view-link")).toHaveAttribute(
      "href",
      /\/nguyenvana\/post\/1$/,
    );
    // no app chrome on the embedded page
    await expect(page.getByTestId("threads-sidebar")).toHaveCount(0);
    await expect(page.getByTestId("app-sidebar")).toHaveCount(0);
  });

  test("the embed page shows an error for a missing post", async ({ page }) => {
    await page.route("**/api/posts/999", (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Post not found" }),
      }),
    );
    await page.goto("/nguyenvana/post/999/embed");
    await expect(page.getByRole("alert")).toContainText("Post not found");
  });
});
