import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";
import { mockFeed, makeApiFeed } from "./helpers/feedFixture.js";

const post = (overrides = {}) => ({ ...makeApiFeed(1)[0], ...overrides });

const PNG = {
  name: "probe.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
};

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

  test("inserts an emoji into the inline reply", async ({ page }) => {
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
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );

    await page.goto("/nguyenvana/post/1");
    const input = page.getByTestId("post-detail-reply-input");
    await input.fill("Cảm ơn");

    await page.getByTestId("post-detail-emoji").click();
    await expect(page.getByTestId("emoji-picker")).toBeVisible();
    await page.locator("[data-testid=emoji-picker] button").first().click();

    await expect(input).toHaveValue(/^Cảm ơn\p{Extended_Pictographic}/u);
    await expect(page.getByTestId("emoji-picker")).toHaveCount(0);
    await expect(page.getByTestId("post-detail-reply-submit")).toBeEnabled();
  });

  test("attaches one image to the inline reply and sends it as multipart", async ({
    page,
  }) => {
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
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );
    let payload = null;
    await page.route("**/api/posts/1/reply", (route) => {
      const request = route.request();
      payload = {
        contentType: request.headers()["content-type"] ?? "",
        body: request.postDataBuffer()?.toString("utf8") ?? "",
      };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: post({ id: 778 }) }),
      });
    });

    await page.goto("/nguyenvana/post/1");
    const input = page.getByTestId("post-detail-reply-input");
    const submit = page.getByTestId("post-detail-reply-submit");

    await page.getByTestId("post-detail-file-input").setInputFiles(PNG);
    await expect(page.getByTestId("post-detail-previews")).toBeVisible();
    await expect(
      page.getByTestId("post-detail-upload-media"),
    ).toBeDisabled();
    // The backend still requires content when an image is attached.
    await expect(submit).toBeDisabled();

    await input.fill("Trả lời kèm ảnh");
    await submit.click();

    await expect(page.getByText("Đã gửi trả lời")).toBeVisible();
    await expect(page.getByTestId("post-detail-previews")).toHaveCount(0);
    expect(payload.contentType).toContain("multipart/form-data");
    expect(payload.body).toContain('name="media[]"');
    expect(payload.body).toContain('filename="probe.png"');
    expect(payload.body).toContain("Trả lời kèm ảnh");
  });

  test("removes the attached image before sending", async ({ page }) => {
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
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );

    await page.goto("/nguyenvana/post/1");
    await page.getByTestId("post-detail-file-input").setInputFiles(PNG);
    await expect(page.getByTestId("post-detail-previews")).toBeVisible();

    await page.getByTestId("post-detail-previews-remove-0").click();
    await expect(page.getByTestId("post-detail-previews")).toHaveCount(0);
    await expect(
      page.getByTestId("post-detail-upload-media"),
    ).toBeEnabled();
  });

  test("keeps the draft and the image when the reply fails", async ({
    page,
  }) => {
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
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );
    await page.route("**/api/posts/1/reply", (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Ảnh vượt quá dung lượng cho phép",
        }),
      }),
    );

    await page.goto("/nguyenvana/post/1");
    const input = page.getByTestId("post-detail-reply-input");
    await input.fill("Trả lời kèm ảnh lỗi");
    await page.getByTestId("post-detail-file-input").setInputFiles(PNG);
    await page.getByTestId("post-detail-reply-submit").click();

    await expect(page.getByRole("alert")).toContainText(
      "Ảnh vượt quá dung lượng cho phép",
    );
    await expect(input).toHaveValue("Trả lời kèm ảnh lỗi");
    await expect(page.getByTestId("post-detail-previews")).toBeVisible();
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

  test("the back button returns to the feed", async ({ page }) => {
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

    const back = page.getByTestId("post-detail-back");
    await expect(back).toHaveAttribute("aria-label", "Quay lại feed");
    await back.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("the back button falls back to the feed without history", async ({
    page,
  }) => {
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

    // Opened directly — no previous page to go back to.
    await page.goto("/nguyenvana/post/1");
    await page.getByTestId("post-detail-back").click();
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

  test("likes the post from its detail page", async ({ page }) => {
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
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );
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
    await page.getByTestId("post-1").click();
    await expect(page).toHaveURL(/\/nguyenvana\/post\/1$/);

    const like = page.getByTestId("like-1");
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", "true");
  });

  test("likes a post opened directly, before the feed ever loaded", async ({
    page,
  }) => {
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
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );
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

    await page.goto("/nguyenvana/post/1");
    const like = page.getByTestId("like-1");
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", "true");
  });

  test("leaves the page after deleting your own post", async ({ page }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    const base = makeApiFeed(1)[0];
    const mine = {
      ...base,
      id: 99,
      user_id: 42,
      content: "Bài của tôi",
      user: { ...base.user, id: 42, username: "me" },
    };
    await page.route("**/api/posts/99/replies**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [], pagination: {} }),
      }),
    );
    await page.route("**/api/posts/99", (route) => {
      if (route.request().method() === "DELETE") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: {} }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: mine }),
      });
    });

    await page.goto("/me/post/99");
    await page.getByTestId("post-menu-99").click();
    await page.getByTestId("menu-delete-99").click();
    await page.getByTestId("confirm-submit").click();

    await expect(page).toHaveURL(/\/$/);
  });
});
