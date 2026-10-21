import { test, expect } from "@playwright/test";
import { makeApiFeed, mockFeed } from "./helpers/feedFixture.js";

// Structural clone-accuracy checks for the Threads layout (sidebar, right
// column, mobile tab bar) plus the feed rendering.
test.describe("Threads homepage", () => {
  test.beforeEach(async ({ page }) => {
    await mockFeed(page, { 1: makeApiFeed(3) });
    await page.goto("/");
    await expect(page.getByTestId("threads-home")).toBeVisible();
  });

  test("sidebar has all screenshot items in Vietnamese", async ({ page }) => {
    if (!(await page.getByTestId("threads-sidebar").isVisible())) {
      test.skip(true, "full sidebar is desktop-only");
    }
    const nav = page.getByTestId("threads-sidebar");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("img", { name: "Threads" })).toBeVisible();
    for (const key of [
      "home",
      "create",
      "search",
      "messages",
      "activity",
      "profile",
      "insights",
    ]) {
      await expect(page.getByTestId(`nav-${key}`)).toBeVisible();
    }
    await expect(page.getByTestId("nav-home")).toContainText("Trang chủ");
    await expect(page.getByTestId("nav-create")).toContainText("Thread mới");
    await expect(page.getByTestId("nav-search")).toContainText("Tìm kiếm");
    await expect(page.getByTestId("sidebar-login-btn")).toContainText("Đăng nhập");
    await expect(page.getByTestId("nav-more")).toContainText("Xem thêm");
  });

  test("mobile shows bottom tab bar", async ({ page, isMobile }) => {
    test.skip(!isMobile, "tab bar is mobile-only");
    await expect(page.getByTestId("threads-tabbar")).toBeVisible();
  });

  test("feed renders posts from the API payload", async ({ page }) => {
    const feed = page.getByTestId("threads-feed");
    await expect(feed).toBeVisible();
    await expect(feed.locator(":scope > article")).toHaveCount(3);

    const first = page.getByTestId("post-1");
    await expect(first).toContainText("nguyenvana");
    await expect(first).toContainText("Bài viết số 1");
    await expect(first).toContainText("2 giờ");
    await expect(page.getByTestId("like-1")).toContainText("1.2K");
    await expect(page.getByTestId("comment-1")).toContainText("34");
    await expect(page.getByTestId("repost-1")).toContainText("5");
  });

  test("post card shows hashtags and the translate link", async ({ page }) => {
    await mockFeed(page, {
      1: makeApiFeed(1, { content: "Xin chào #k20 #f8team" }),
    });
    await page.reload();
    const first = page.getByTestId("post-1");
    await expect(first).toContainText("#k20");
    await expect(first).toContainText("#f8team");
    await expect(page.getByTestId("translate-1")).toContainText("Dịch");
  });

  test("right login panel mirrors screenshot with normal login button", async ({
    page,
  }) => {
    if (!(await page.getByTestId("threads-login-panel").isVisible())) {
      test.skip(true, "right panel is desktop-only");
    }
    const panel = page.getByTestId("threads-login-panel");
    await expect(panel).toContainText("Đăng nhập hoặc đăng ký Threads");
    await expect(panel).toContainText("Xem mọi người đang nói về điều gì");
    const btn = page.getByTestId("panel-login-btn");
    await expect(btn).toContainText("Đăng nhập");
    await btn.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("username login link navigates to /login", async ({ page }) => {
    if (!(await page.getByTestId("threads-login-panel").isVisible())) {
      test.skip(true, "right panel is desktop-only");
    }
    await page.getByTestId("panel-username-login").click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("mobile login banner navigates to /login", async ({ page, isMobile }) => {
    test.skip(!isMobile, "banner is mobile-only");
    const banner = page.getByTestId("threads-login-banner");
    await expect(banner).toBeVisible();
    await page.getByTestId("banner-login-btn").click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("sidebar login button navigates to /login", async ({ page }) => {
    if (!(await page.getByTestId("sidebar-login-btn").isVisible())) {
      test.skip(true, "sidebar is desktop-only");
    }
    await page.getByTestId("sidebar-login-btn").click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("dark toggle lives in Xem thêm menu and flips theme", async ({ page }) => {
    if (!(await page.getByTestId("nav-more").isVisible())) {
      test.skip(true, "Xem thêm menu is desktop-only");
    }
    const html = page.locator("html");
    const before = (await html.getAttribute("class")) ?? "";
    await page.getByTestId("nav-more").click();
    await expect(page.getByTestId("more-menu")).toBeVisible();
    await page.getByTestId("theme-toggle").click();
    const after = (await html.getAttribute("class")) ?? "";
    expect(before.includes("dark") !== after.includes("dark")).toBe(true);
  });

  test("tablet rail has its own theme toggle", async ({ page }) => {
    if (!(await page.getByTestId("threads-leftnav").isVisible())) {
      test.skip(true, "icon rail is tablet-only");
    }
    const html = page.locator("html");
    const before = (await html.getAttribute("class")) ?? "";
    await page.getByTestId("theme-toggle-rail").click();
    const after = (await html.getAttribute("class")) ?? "";
    expect(before.includes("dark") !== after.includes("dark")).toBe(true);
  });

  test("mobile header has its own theme toggle", async ({ page, isMobile }) => {
    test.skip(!isMobile, "header toggle is mobile-only");
    const html = page.locator("html");
    const before = (await html.getAttribute("class")) ?? "";
    await page.getByTestId("theme-toggle-header").click();
    const after = (await html.getAttribute("class")) ?? "";
    expect(before.includes("dark") !== after.includes("dark")).toBe(true);
  });

  test("footer mirrors screenshot legal links", async ({ page }) => {
    if (await page.getByTestId("threads-login-panel").isVisible()) {
      await expect(page.getByText("Báo cáo sự cố")).toBeVisible();
      await expect(page.getByText("Chính sách cookie").last()).toBeVisible();
    } else {
      await expect(page.getByText("Điều khoản của Threads").first()).toBeVisible();
      await expect(page.getByText("Chính sách cookie").first()).toBeVisible();
    }
  });
});
