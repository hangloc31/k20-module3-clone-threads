import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";
import { mockFeed, makeApiFeed } from "./helpers/feedFixture.js";

const post = (overrides = {}) => ({ ...makeApiFeed(1)[0], ...overrides });

test.describe("post detail page", () => {
  test.beforeEach(async ({ page }) => {
    await mockFeed(page, { 1: makeApiFeed(1) });
  });

  test("clicking a post opens its detail page", async ({ page }) => {
    await page.route("**/api/posts/1", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: post() }),
      }),
    );
    await page.route("**/api/posts/1/replies**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );

    await page.goto("/");
    await page.getByTestId("post-1").click();
    await expect(page).toHaveURL(/\/nguyenvana\/post\/1$/);
    await expect(page.getByTestId("post-detail")).toContainText("nguyenvana");
  });

  test("shows the comments and an inline reply box", async ({ page }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await page.route("**/api/posts/1", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: post() }),
      }),
    );
    await page.route("**/api/posts/1/replies**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [post({ id: 501, content: "Một bình luận có sẵn" })],
          pagination: { current_page: 1, per_page: 20, total: 1, last_page: 1 },
        }),
      }),
    );

    await page.goto("/nguyenvana/post/1");
    await expect(page.getByTestId("comment-list")).toContainText(
      "Một bình luận có sẵn",
    );
    const input = page.getByTestId("post-detail-reply-input");
    await expect(input).toHaveAttribute("placeholder", "Reply to nguyenvana...");
    await expect(page.getByTestId("post-detail-reply-submit")).toBeDisabled();

    await input.fill("Trả lời của tôi");
    await expect(page.getByTestId("post-detail-reply-submit")).toBeEnabled();
  });

  test("sends the inline reply", async ({ page }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    let payload = null;
    await page.route("**/api/posts/1", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: post() }),
      }),
    );
    await page.route("**/api/posts/1/replies**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );
    await page.route("**/api/posts/1/reply", (route) => {
      payload = route.request().postData();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: post({ id: 777 }) }),
      });
    });

    await page.goto("/nguyenvana/post/1");
    await page.getByTestId("post-detail-reply-input").fill("Trả lời của tôi");
    await page.getByTestId("post-detail-reply-submit").click();

    await expect(page.getByText("Đã gửi trả lời")).toBeVisible();
    expect(payload).toContain("Trả lời của tôi");
  });

  test("the like button does not navigate away", async ({ page }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
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
    await page.getByTestId("like-1").click();
    await page.waitForTimeout(600);
    await expect(page).toHaveURL(/\/$/);
  });

  test("shows an error for a missing post", async ({ page }) => {
    await page.route("**/api/posts/999", (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Post not found" }),
      }),
    );
    await page.goto("/nguyenvana/post/999");
    await expect(page.getByRole("alert")).toContainText("Post not found");
  });
});
