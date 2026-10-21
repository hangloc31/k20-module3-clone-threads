import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";
import { mockFeed, makeApiFeed } from "./helpers/feedFixture.js";

const reply = (overrides = {}) => ({
  id: 500,
  user_id: 10,
  content: "Bình luận của bạn",
  parent_id: 1,
  original_post_id: null,
  is_quote: false,
  reply_permission: "everyone",
  requires_reply_approval: false,
  status: "approved",
  is_ghost: false,
  ghost_expires_at: null,
  topic_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  deleted_at: null,
  likes_count: 0,
  replies_count: 0,
  is_liked_by_auth: false,
  is_saved_by_auth: false,
  is_reposted_by_auth: false,
  reposts_and_quotes_count: 0,
  media_urls: [],
  user: {
    id: 10,
    name: "Nguyễn Văn A",
    username: "nguyenvana",
    bio: null,
    is_private: false,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_followed_by_auth: false,
    is_muted_by_auth: false,
    is_restricted_by_auth: false,
    avatar_url: "https://i.pravatar.cc/100?img=12",
  },
  original_post: null,
  ...overrides,
});

test.describe("reply modal", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await mockFeed(page, { 1: makeApiFeed(1) });
  });

  test("opens from the comment button with the right placeholder", async ({
    page,
  }) => {
    await page.route("**/api/posts/1/replies**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { current_page: 1, per_page: 20, total: 0, last_page: 1 },
        }),
      }),
    );
    await page.goto("/");
    await page.getByTestId("comment-1").click();

    const modal = page.getByTestId("reply-modal");
    await expect(modal).toBeVisible();
    await expect(page.getByTestId("reply-input")).toHaveAttribute(
      "placeholder",
      "Reply to nguyenvana...",
    );
    await expect(page.getByTestId("comment-empty")).toBeVisible();
  });

  test("keeps the post button disabled while the reply is empty", async ({
    page,
  }) => {
    await page.route("**/api/posts/1/replies**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );
    await page.goto("/");
    await page.getByTestId("comment-1").click();
    await expect(page.getByTestId("reply-submit")).toBeDisabled();

    await page.getByTestId("reply-input").fill("Có gì đó");
    await expect(page.getByTestId("reply-submit")).toBeEnabled();
  });

  test("sends the reply and refreshes the comment list", async ({ page }) => {
    let payload = null;
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
        body: JSON.stringify({ success: true, data: reply() }),
      });
    });

    await page.goto("/");
    await page.getByTestId("comment-1").click();
    await page.getByTestId("reply-input").fill("Có gì đó");
    await page.getByTestId("reply-submit").click();

    await expect(page.getByText("Đã gửi trả lời")).toBeVisible();
    expect(payload).toContain("Có gì đó");
    await expect(page.getByTestId("reply-input")).toHaveValue("");
  });

  test("sends the reply permission", async ({ page }) => {
    let payload = null;
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
        body: JSON.stringify({ success: true, data: reply() }),
      });
    });

    await page.goto("/");
    await page.getByTestId("comment-1").click();
    await page.getByTestId("reply-options").click();
    await page.getByTestId("reply-permission-following").click();
    await page.getByTestId("reply-input").fill("Chỉ người theo dõi");
    await page.getByTestId("reply-submit").click();

    await expect(page.getByText("Đã gửi trả lời")).toBeVisible();
    expect(payload).toContain("following");
  });

  test("inserts an emoji into the reply", async ({ page }) => {
    await page.route("**/api/posts/1/replies**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );
    await page.goto("/");
    await page.getByTestId("comment-1").click();
    await page.getByTestId("reply-emoji").click();
    await expect(page.getByTestId("emoji-picker")).toBeVisible();
    await page.locator("[data-testid=emoji-picker] button").first().click();
    await expect(page.getByTestId("reply-input")).toHaveValue(/\p{Extended_Pictographic}/u);
  });

  test("previews an uploaded image", async ({ page }) => {
    await page.route("**/api/posts/1/replies**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );
    await page.goto("/");
    await page.getByTestId("comment-1").click();
    await page.getByTestId("reply-file-input").setInputFiles({
      name: "probe.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
    await expect(page.getByTestId("reply-previews")).toBeVisible();
    await expect(page.getByTestId("reply-submit")).toBeEnabled();
  });

  test("sends the reply as multipart so images survive", async ({ page }) => {
    let contentType = null;
    await page.route("**/api/posts/1/replies**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );
    await page.route("**/api/posts/1/reply", (route) => {
      contentType = route.request().headers()["content-type"] ?? null;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: reply() }),
      });
    });

    await page.goto("/");
    await page.getByTestId("comment-1").click();
    await page.getByTestId("reply-input").fill("Có ảnh");
    await page.getByTestId("reply-file-input").setInputFiles({
      name: "probe.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      ),
    });
    await page.getByTestId("reply-submit").click();

    await expect(page.getByText("Đã gửi trả lời")).toBeVisible();
    expect(contentType).toContain("multipart/form-data");
  });

  test("lists the existing comments", async ({ page }) => {
    await page.route("**/api/posts/1/replies**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [reply({ id: 501, content: "Bình luận có sẵn" })],
          pagination: { current_page: 1, per_page: 20, total: 1, last_page: 1 },
        }),
      }),
    );
    await page.goto("/");
    await page.getByTestId("comment-1").click();
    await expect(page.getByTestId("comment-list")).toContainText(
      "Bình luận có sẵn",
    );
  });

  test("keeps the comment button pointing to login for guests", async ({
    browser,
  }) => {
    // A fresh context without the seeded session.
    const context = await browser.newContext();
    const guest = await context.newPage();
    await mockFeed(guest, { 1: makeApiFeed(1) });
    await guest.goto("/");
    await expect(guest.getByTestId("comment-1")).toHaveAttribute(
      "href",
      "/login",
    );
    await context.close();
  });
});
