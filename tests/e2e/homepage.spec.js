import { test, expect } from "@playwright/test";

// Structural clone-accuracy checks for threads.com logged-out homepage
// (Vietnamese dark UI per provided screenshot).
test.describe("Threads logged-out homepage", () => {
  test.beforeEach(async ({ page }) => {
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
    for (const key of ["home", "create", "search", "messages", "activity", "profile", "insights"]) {
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

  test("feed renders screenshot post first with hashtags and video", async ({ page }) => {
    const feed = page.getByTestId("threads-feed");
    await expect(feed).toBeVisible();
    await expect(feed.locator(":scope > article")).toHaveCount(7);

    const first = page.getByTestId("thread-p0");
    await expect(first).toContainText("t_nakats_");
    await expect(first).toContainText("17 giờ");
    await expect(first).toContainText("#大谷翔平");
    await expect(first.getByTestId("translate-p0")).toContainText("Dịch");
    await expect(first.getByTestId("mute-p0")).toBeVisible();
    await expect(first.getByTestId("like-p0")).toContainText("3.2K");

    await expect(page.getByTestId("thread-p1")).toContainText("12 giờ");
    await expect(page.getByTestId("thread-p4")).toContainText("abcnews");
  });

  test("right login panel mirrors screenshot with normal login button", async ({ page }) => {
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
