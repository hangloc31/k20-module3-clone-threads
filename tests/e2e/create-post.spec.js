import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";
import { makeApiFeed, makeApiPost, mockFeed } from "./helpers/feedFixture.js";

// Covers the composer wired to feedStore.createPost: a successful post lands
// on top of the feed, server errors surface and never create a fake post.

const mockCreate = (page, handler) =>
  page.route("**/api/posts", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    return handler(route);
  });

const PNG = {
  name: "probe.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  ),
};

test.describe("create post", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await mockFeed(page, { 1: makeApiFeed(1) });
  });

  test("prepends the created post and clears the composer", async ({
    page,
  }) => {
    let payload = null;
    await mockCreate(page, (route) => {
      payload = route.request().postDataJSON();
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            post: makeApiPost({ id: 900, content: "Thread mới của tôi" }),
          },
        }),
      });
    });

    await page.goto("/");
    const input = page.getByTestId("create-thread-input");
    await input.fill("Thread mới của tôi");
    await page.getByTestId("create-thread-submit").click();

    await expect(page.getByTestId("post-900")).toContainText(
      "Thread mới của tôi",
    );
    await expect(input).toHaveValue("");
    expect(payload).toEqual({ content: "Thread mới của tôi" });
  });

  test("shows the server message and keeps the draft on 422", async ({
    page,
  }) => {
    await mockCreate(page, (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Nội dung không hợp lệ",
          errors: { content: ["Nội dung không hợp lệ"] },
        }),
      }),
    );

    await page.goto("/");
    const input = page.getByTestId("create-thread-input");
    await input.fill("Nội dung bị từ chối");
    await page.getByTestId("create-thread-submit").click();

    await expect(page.getByRole("alert")).toContainText("Nội dung không hợp lệ");
    await expect(input).toHaveValue("Nội dung bị từ chối");
  });

  test("does not add a fake post when the request fails", async ({ page }) => {
    await mockCreate(page, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Server Error" }),
      }),
    );

    await page.goto("/");
    await expect(page.locator("article")).toHaveCount(1);

    await page.getByTestId("create-thread-input").fill("Bài không lên được");
    await page.getByTestId("create-thread-submit").click();

    await expect(page.getByRole("alert")).toContainText("Server Error");
    await expect(page.locator("article")).toHaveCount(1);
    await expect(
      page.locator("article").filter({ hasText: "Bài không lên được" }),
    ).toHaveCount(0);
  });

  test("sends an attached image as multipart and shows it on the new post", async ({
    page,
  }) => {
    let payload = null;
    await mockCreate(page, (route) => {
      const request = route.request();
      payload = {
        contentType: request.headers()["content-type"] ?? "",
        body: request.postDataBuffer()?.toString("utf8") ?? "",
      };
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            post: makeApiPost({
              id: 901,
              content: "Thread có ảnh",
              media_urls: ["https://cdn.test/photo.png"],
            }),
          },
        }),
      });
    });

    await page.goto("/");
    await page.getByTestId("create-thread-input").fill("Thread có ảnh");
    await page.getByTestId("create-thread-file-input").setInputFiles(PNG);
    await expect(page.getByTestId("create-thread-previews")).toBeVisible();

    await page.getByTestId("create-thread-submit").click();

    const created = page.getByTestId("post-901");
    await expect(created).toContainText("Thread có ảnh");
    await expect(
      created.locator('img[src="https://cdn.test/photo.png"]'),
    ).toHaveAttribute("src", "https://cdn.test/photo.png");
    await expect(page.getByTestId("create-thread-previews")).toHaveCount(0);
    await expect(page.getByTestId("create-thread-input")).toHaveValue("");

    expect(payload.contentType).toContain("multipart/form-data");
    expect(payload.body).toContain('name="content"');
    expect(payload.body).toContain("Thread có ảnh");
    expect(payload.body).toContain('name="media[]"');
    expect(payload.body).toContain('filename="probe.png"');
  });

  test("keeps one image at a time and lets it be removed", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("create-thread-file-input");

    await input.setInputFiles(PNG);
    await expect(page.getByTestId("create-thread-previews")).toBeVisible();
    await expect(
      page.getByTestId("create-thread-upload-media"),
    ).toBeDisabled();

    // A second pick must not stack another image onto the same thread.
    await input.setInputFiles({ ...PNG, name: "second.png" });
    await expect(
      page.getByTestId("create-thread-previews").locator("img"),
    ).toHaveCount(1);

    await page.getByTestId("create-thread-previews-remove-0").click();
    await expect(page.getByTestId("create-thread-previews")).toHaveCount(0);
    await expect(
      page.getByTestId("create-thread-upload-media"),
    ).toBeEnabled();
  });

  test("keeps the draft and the image when the server rejects it", async ({
    page,
  }) => {
    await mockCreate(page, (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Ảnh vượt quá dung lượng cho phép",
          errors: { media: ["Ảnh vượt quá dung lượng cho phép"] },
        }),
      }),
    );

    await page.goto("/");
    const input = page.getByTestId("create-thread-input");
    await input.fill("Ảnh quá lớn");
    await page.getByTestId("create-thread-file-input").setInputFiles(PNG);
    await page.getByTestId("create-thread-submit").click();

    await expect(page.getByRole("alert")).toContainText(
      "Ảnh vượt quá dung lượng cho phép",
    );
    await expect(input).toHaveValue("Ảnh quá lớn");
    await expect(page.getByTestId("create-thread-previews")).toBeVisible();
  });
});

test.describe("create route guard", () => {
  test("redirects a signed-out visitor to the login page", async ({ page }) => {
    await page.goto("/create");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
  });
});
