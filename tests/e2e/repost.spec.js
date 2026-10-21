import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";
import { mockFeed, makeApiFeed } from "./helpers/feedFixture.js";

const ok = (body = {}) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ success: true, data: body }),
});

test.describe("repost and quote", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await mockFeed(page, { 1: makeApiFeed(1) });
  });

  test("opens the repost menu with both options", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("repost-1").click();
    await expect(page.getByTestId("menu-repost-1")).toBeVisible();
    await expect(page.getByTestId("menu-quote-1")).toBeVisible();
  });

  test("reposts a post and turns the icon green", async ({ page }) => {
    await page.route("**/api/posts/1/repost", (route) =>
      route.fulfill(ok({ is_reposted: true, reposts_and_quotes_count: 7 })),
    );
    await page.goto("/");
    await page.getByTestId("repost-1").click();
    await page.getByTestId("menu-repost-1").click();

    await expect(page.getByText("Đã repost")).toBeVisible();
    await expect(page.getByTestId("repost-1")).toHaveClass(/text-emerald-600/);
    await expect(page.getByTestId("repost-1")).toContainText("7");
  });

  test("reposting again unpins the post", async ({ page }) => {
    let call = 0;
    await page.route("**/api/posts/1/repost", (route) => {
      call += 1;
      return route.fulfill(
        ok({
          is_reposted: call === 1,
          reposts_and_quotes_count: call === 1 ? 7 : 0,
        }),
      );
    });
    await page.goto("/");
    await page.getByTestId("repost-1").click();
    await page.getByTestId("menu-repost-1").click();
    await expect(page.getByText("Đã repost")).toBeVisible();

    await page.getByTestId("repost-1").click();
    await page.getByTestId("menu-repost-1").click();
    await expect(page.getByText("Đã bỏ repost")).toBeVisible();
    await expect(page.getByTestId("repost-1")).not.toHaveClass(/text-emerald-600/);
  });

  test("quotes a post and puts it on top of the feed", async ({ page }) => {
    let payload = null;
    await page.route("**/api/posts/1/quote", (route) => {
      payload = route.request().postData();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            ...makeApiFeed(1)[0],
            id: 777,
            content: "Bình luận của tôi",
            is_quote: true,
            original_post_id: 1,
            original_post: makeApiFeed(1)[0],
          },
        }),
      });
    });
    await page.goto("/");
    await page.getByTestId("repost-1").click();
    await page.getByTestId("menu-quote-1").click();

    const modal = page.getByTestId("quote-modal");
    await expect(modal).toBeVisible();
    await expect(page.getByTestId("quote-input")).toHaveAttribute(
      "placeholder",
      "Quote this post...",
    );
    await expect(page.getByTestId("quote-target")).toContainText("nguyenvana");
    await expect(page.getByTestId("quote-submit")).toBeDisabled();

    await page.getByTestId("quote-input").fill("Bình luận của tôi");
    await page.getByTestId("quote-submit").click();

    await expect(page.getByText("Đã quote bài viết")).toBeVisible();
    expect(payload).toContain("Bình luận của tôi");
    await expect(page.getByTestId("post-777")).toContainText("Bình luận của tôi");
  });

  test("keeps the repost button pointing to login for guests", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const guest = await context.newPage();
    await mockFeed(guest, { 1: makeApiFeed(1) });
    await guest.goto("/");
    await expect(guest.getByTestId("repost-1")).toHaveAttribute("href", "/login");
    await context.close();
  });
});
