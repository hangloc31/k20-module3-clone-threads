import { test, expect } from "@playwright/test";
import { makeApiFeed, mockFeed } from "./helpers/feedFixture.js";

// Home shell: icon sidebar + feed tabs + post cards + login panel.
test.describe("home page", () => {
  test.beforeEach(async ({ page }) => {
    await mockFeed(page, { 1: makeApiFeed(3) });
    await page.goto("/");
    await expect(page.getByTestId("threads-home")).toBeVisible();
  });

  test("sidebar shows the logo and the five icon items", async ({ page }) => {
    const sidebar = page.getByTestId("app-sidebar");
    if (!(await sidebar.isVisible())) {
      test.skip(true, "sidebar is desktop-only");
    }
    await expect(sidebar).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: "Threads home" }),
    ).toBeVisible();
    for (const key of ["home", "search", "create", "activity", "profile"]) {
      await expect(page.getByTestId(`nav-${key}`)).toBeVisible();
    }
    await expect(page.getByTestId("nav-home")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("mobile shows the icon tab bar", async ({ page, isMobile }) => {
    test.skip(!isMobile, "tab bar is mobile-only");
    await expect(page.getByTestId("mobile-tabbar")).toBeVisible();
    for (const key of ["home", "search", "create", "activity", "profile"]) {
      await expect(page.getByTestId(`mobile-nav-${key}`)).toBeVisible();
    }
  });

  test("feed header has the three tabs", async ({ page }) => {
    await expect(page.getByTestId("feed-tab-for_you")).toContainText("For you");
    await expect(page.getByTestId("feed-tab-following")).toContainText(
      "Following",
    );
    await expect(page.getByTestId("feed-tab-ghost")).toContainText(
      "Ghost posts",
    );
    await expect(page.getByTestId("feed-tab-for_you")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("renders post cards from the API payload", async ({ page }) => {
    const feed = page.getByTestId("threads-feed");
    await expect(feed).toBeVisible();
    await expect(feed.locator("article")).toHaveCount(3);

    const first = page.getByTestId("post-1");
    await expect(first).toContainText("nguyenvana");
    await expect(first).toContainText("Bài viết số 1");
    await expect(first).toContainText("2 giờ");
    await expect(page.getByTestId("like-1")).toContainText("1.2K");
    await expect(page.getByTestId("comment-1")).toContainText("34");
    await expect(page.getByTestId("repost-1")).toContainText("5");
    await expect(page.getByTestId("share-1")).toBeVisible();
  });

  test("guests see the login panel on the right", async ({ page }) => {
    const panel = page.getByTestId("login-panel");
    if (!(await panel.isVisible())) {
      test.skip(true, "login panel is desktop-only");
    }
    await expect(panel).toContainText("Đăng nhập để xem thêm");
    await page.getByTestId("panel-login-btn").click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("guests cannot like a post", async ({ page }) => {
    await expect(page.getByTestId("like-1")).toBeDisabled();
  });

  test("switching to Following shows the empty state", async ({ page }) => {
    await page.getByTestId("feed-tab-following").click();
    await expect(page.getByTestId("feed-empty")).toContainText(
      "Bạn chưa theo dõi ai",
    );
  });

  test("switching to Ghost posts shows the empty state", async ({ page }) => {
    await page.getByTestId("feed-tab-ghost").click();
    await expect(page.getByTestId("feed-empty")).toContainText(
      "Chưa có bài viết ghost nào",
    );
  });
});
