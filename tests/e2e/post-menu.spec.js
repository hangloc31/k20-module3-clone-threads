import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";
import { mockFeed, makeApiFeed } from "./helpers/feedFixture.js";

const seedUser = (page) => seedAuth(page, { accessToken: "seeded-access-token" });

const ownPost = () =>
  makeApiPostWithUser({ id: 99, user_id: 42, username: "me" });

const makeApiPostWithUser = (overrides = {}) => {
  const post = makeApiFeed(1)[0];
  return {
    ...post,
    ...overrides,
    user: {
      ...post.user,
      id: overrides.user_id ?? post.user.id,
      username: overrides.username ?? post.user.username,
    },
  };
};

const ok = (body = {}) =>
  ({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data: body }),
  });

test.describe("post menu", () => {
  test.beforeEach(async ({ page }) => {
    await seedUser(page);
    await mockFeed(page, { 1: makeApiFeed(1) });
  });

  test("shows the actions for someone else's post", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("post-menu-1").click();

    await expect(page.getByTestId("menu-save-1")).toBeVisible();
    await expect(page.getByTestId("menu-hide-1")).toBeVisible();
    await expect(page.getByTestId("menu-mute-1")).toBeVisible();
    await expect(page.getByTestId("menu-restrict-1")).toBeVisible();
    await expect(page.getByTestId("menu-block-1")).toBeVisible();
    await expect(page.getByTestId("menu-report-1")).toBeVisible();
    await expect(page.getByTestId("menu-copy-1")).toBeVisible();

    // Not your post -> no edit / delete
    await expect(page.getByTestId("menu-edit-1")).toHaveCount(0);
    await expect(page.getByTestId("menu-delete-1")).toHaveCount(0);
  });

  test("saves a post and toggles the label", async ({ page }) => {
    let saved = null;
    await page.route("**/api/posts/1/save", (route) => {
      saved = route.request().method();
      return route.fulfill(ok({ is_saved: true }));
    });
    await page.goto("/");
    await page.getByTestId("post-menu-1").click();
    await page.getByTestId("menu-save-1").click();

    await expect(page.getByText("Đã lưu bài viết")).toBeVisible();
    expect(saved).toBe("POST");
  });

  test("hides a post from the feed", async ({ page }) => {
    await page.route("**/api/posts/1/hide", (route) =>
      route.fulfill(ok({ is_hidden: true })),
    );
    await page.goto("/");
    await expect(page.getByTestId("post-1")).toBeVisible();
    await page.getByTestId("post-menu-1").click();
    await page.getByTestId("menu-hide-1").click();
    await expect(page.getByTestId("post-1")).toHaveCount(0);
  });

  test("reports a post with a reason", async ({ page }) => {
    let payload = null;
    await page.route("**/api/posts/1/report", (route) => {
      payload = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Post reported successfully" }),
      });
    });
    await page.goto("/");
    await page.getByTestId("post-menu-1").click();
    await page.getByTestId("menu-report-1").click();

    const modal = page.getByTestId("report-modal");
    await expect(modal).toBeVisible();
    await page.getByTestId("report-reason-abuse").check();
    await page.getByTestId("report-description").fill("Nội dung gây hại");
    await page.getByTestId("report-submit").click();

    await expect(page.getByText("Đã gửi báo cáo")).toBeVisible();
    expect(payload).toEqual({ reason: "abuse", description: "Nội dung gây hại" });
  });

  test("blocks a user after confirmation", async ({ page }) => {
    let call = null;
    await page.route("**/api/users/10/block", (route) => {
      call = route.request().method();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "User blocked successfully" }),
      });
    });
    await page.goto("/");
    await page.getByTestId("post-menu-1").click();
    await page.getByTestId("menu-block-1").click();

    const modal = page.getByTestId("confirm-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Chặn người dùng?");
    await page.getByTestId("confirm-submit").click();

    await expect(page.getByText("Đã chặn người dùng")).toBeVisible();
    expect(call).toBe("POST");
  });

  test("copies the post link and shows a toast", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.getByTestId("post-menu-1").click();
    await page.getByTestId("menu-copy-1").click();

    await expect(page.getByText("Đã sao chép liên kết")).toBeVisible();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain("/nguyenvana/post/1");
  });

  test("offers edit and delete for your own post", async ({ page }) => {
    await mockFeed(page, { 1: [ownPost()] });
    await page.goto("/");
    await page.getByTestId("post-menu-99").click();
    await expect(page.getByTestId("menu-edit-99")).toBeVisible();
    await expect(page.getByTestId("menu-delete-99")).toBeVisible();
  });

  test("edits your own post", async ({ page }) => {
    await mockFeed(page, { 1: [ownPost()] });
    let body = null;
    await page.route("**/api/posts/99", async (route) => {
      if (route.request().method() === "PUT") {
        body = route.request().postDataJSON();
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { ...ownPost(), content: body.content },
          }),
        });
      }
      return route.continue();
    });
    await page.goto("/");
    await page.getByTestId("post-menu-99").click();
    await page.getByTestId("menu-edit-99").click();

    const modal = page.getByTestId("edit-modal");
    await expect(modal).toBeVisible();
    await page.getByTestId("edit-content").fill("Nội dung đã sửa");
    await page.getByTestId("edit-submit").click();

    await expect(page.getByText("Đã cập nhật bài viết")).toBeVisible();
    expect(body).toEqual({ content: "Nội dung đã sửa" });
    await expect(page.getByTestId("post-99")).toContainText("Nội dung đã sửa");
  });

  test("deletes your own post after confirmation", async ({ page }) => {
    await mockFeed(page, { 1: [ownPost()] });
    let called = null;
    await page.route("**/api/posts/99", (route) => {
      called = route.request().method();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Post deleted successfully" }),
      });
    });
    await page.goto("/");
    await page.getByTestId("post-menu-99").click();
    await page.getByTestId("menu-delete-99").click();

    const modal = page.getByTestId("confirm-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Xoá bài viết?");
    await page.getByTestId("confirm-submit").click();

    await expect(page.getByText("Đã xoá bài viết")).toBeVisible();
    expect(called).toBe("DELETE");
    await expect(page.getByTestId("post-99")).toHaveCount(0);
  });
});
