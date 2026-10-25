import { test, expect } from "@playwright/test";
import { makeApiFeed, makeApiPost, mockFeed } from "./helpers/feedFixture.js";
import { seedAuth } from "./helpers/seedAuth.js";

// A full page keeps the list taller than the viewport, so the infinite
// scroll sentinel does not fire before the test scrolls.
const FULL_PAGE = () =>
  makeApiFeed(20).map((post, index) => ({
    ...post,
    id: index + 1,
    content: `Bài viết số ${index + 1}`,
  }));

test.describe("feed behaviour", () => {
  test("loads the next page when the sentinel scrolls into view", async ({
    page,
  }) => {
    const requested = mockFeed(page, {
      1: FULL_PAGE(),
      2: makeApiFeed(3).map((post, index) => ({
        ...post,
        id: 100 + index,
        content: "Bài trang hai",
      })),
    });
    await page.goto("/");
    await expect(page.locator("article")).toHaveCount(20);

    await page.mouse.wheel(0, 30000);
    await expect
      .poll(() => requested.includes(2), { timeout: 10000 })
      .toBe(true);
    await expect(page.locator("article")).toHaveCount(23);
    await expect(page.getByTestId("post-100")).toContainText("Bài trang hai");
  });

  test("scroll to the bottom triggers the infinite scroll sentinel", async ({
    page,
  }) => {
    const requested = mockFeed(page, {
      1: FULL_PAGE(),
      2: makeApiFeed(2, { id: 200 }),
    });
    await page.goto("/");
    await expect(page.locator("article")).toHaveCount(20);
    await page.mouse.wheel(0, 30000);
    await expect
      .poll(() => requested.includes(2), { timeout: 10000 })
      .toBe(true);
  });

  test("likes a post optimistically and keeps the server count", async ({
    page,
  }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await mockFeed(page, { 1: makeApiFeed(1) });
    await page.route("**/api/posts/1/like", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { is_liked: true, likes_count: 1201 },
        }),
      }),
    );
    await page.goto("/");

    const like = page.getByTestId("like-1");
    await expect(like).toContainText("1.2K");
    await like.click();

    await expect(like).toHaveAttribute("aria-pressed", "true");
    await expect(like).toContainText("1.2K");
  });

  test("rolls the like back when the request fails", async ({ page }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await mockFeed(page, { 1: makeApiFeed(1) });
    await page.route("**/api/posts/1/like", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Server Error" }),
      }),
    );
    await page.goto("/");

    const like = page.getByTestId("like-1");
    await like.click();
    await expect(page.getByRole("alert")).toContainText("Server Error");
    await expect(like).toHaveAttribute("aria-pressed", "false");
    await expect(like).toContainText("1.2K");
  });

  test("falls back to the bundled sample data when the API fails", async ({
    page,
  }) => {
    await page.route("**/api/posts/feed**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Server Error" }),
      }),
    );
    await page.goto("/");
    await expect(page.getByTestId("feed-fallback-notice")).toContainText(
      "đang hiển thị dữ liệu mẫu",
    );
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("likes a real post through the API while the feed shows sample data", async ({
    page,
  }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await page.route("**/api/posts/feed**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Server Error" }),
      }),
    );
    await page.route("**/api/posts", (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { post: makeApiPost({ id: 901, content: "Bài thật" }) },
        }),
      });
    });
    let likeCalls = 0;
    await page.route("**/api/posts/901/like", (route) => {
      likeCalls += 1;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { is_liked: true, likes_count: 1 },
        }),
      });
    });

    await page.goto("/");
    await expect(page.getByTestId("feed-fallback-notice")).toBeVisible();

    await page.getByTestId("create-thread-input").fill("Bài thật");
    await page.getByTestId("create-thread-submit").click();
    await expect(page.getByTestId("post-901")).toBeVisible();

    await page.getByTestId("like-901").click();
    await expect.poll(() => likeCalls).toBe(1);
  });
});
