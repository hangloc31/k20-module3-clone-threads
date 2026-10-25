import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";
import { makeApiFeed, mockFeed } from "./helpers/feedFixture.js";

// The sidebar has three variants: full sidebar (desktop), icon rail (tablet)
// and bottom tab bar (mobile). Tests pick whichever variant is on screen so
// the same expectations hold on all four Playwright projects.
const visibleNavItem = async (page, key) => {
  for (const prefix of ["nav", "rail", "tab"]) {
    const locator = page.getByTestId(`${prefix}-${key}`);
    if (await locator.isVisible()) return locator;
  }
  return page.getByTestId(`nav-${key}`);
};

const json = (body) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const user = {
  id: 42,
  name: "banner_user",
  username: "banner_user",
  email: "banner@x.com",
  email_verified_at: "2026-10-20T10:00:00.000000Z",
  created_at: "2026-01-15T10:00:00.000000Z",
  avatar_url: null,
};

// Everything the profile page asks for once the avatar is clicked.
const mockAccount = async (page) => {
  await page.route("**/api/auth/user", (route) =>
    route.fulfill(json({ success: true, data: user })),
  );
  await page.route("**/api/users/suggestions", (route) =>
    route.fulfill(json({ success: true, data: [] })),
  );
  for (const relation of ["followers", "followings"]) {
    await page.route(`**/api/users/42/${relation}**`, (route) =>
      route.fulfill(
        json({
          success: true,
          data: [],
          pagination: { current_page: 1, per_page: 20, total: 0, last_page: 1 },
        }),
      ),
    );
  }
  await page.route("**/api/users/42/reposts**", (route) =>
    route.fulfill(
      json({
        success: true,
        data: [],
        pagination: { current_page: 1, per_page: 20, total: 0, last_page: 1 },
      }),
    ),
  );
};

test.describe("sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await mockFeed(page, { 1: makeApiFeed(1) });
  });

  test("sends guests to login from Tin nhắn", async ({ page }) => {
    await page.goto("/");
    await (await visibleNavItem(page, "messages")).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("sends guests to login from Thông tin chi tiết", async ({ page }) => {
    await page.goto("/");
    const insights = page.getByTestId("nav-insights");
    const railInsights = page.getByTestId("rail-insights");
    if (!(await insights.isVisible()) && !(await railInsights.isVisible())) {
      test.skip(true, "Thông tin chi tiết is not in the mobile tab bar");
    }
    await (await visibleNavItem(page, "insights")).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("keeps the login button for guests", async ({ page }) => {
    await page.goto("/");
    if (await page.getByTestId("threads-sidebar").isVisible()) {
      await expect(page.getByTestId("sidebar-login-btn")).toBeVisible();
      await expect(page.getByTestId("sidebar-profile")).toHaveCount(0);
      return;
    }
    if (await page.getByTestId("threads-leftnav").isVisible()) {
      await expect(page.getByTestId("rail-login")).toBeVisible();
      await expect(page.getByTestId("rail-account")).toHaveCount(0);
      return;
    }
    test.skip(true, "the mobile tab bar has no login button");
  });

  test("shows the avatar instead of the login button when signed in", async ({
    page,
  }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await mockAccount(page);
    await page.goto("/");

    if (await page.getByTestId("threads-sidebar").isVisible()) {
      await expect(page.getByTestId("sidebar-login-btn")).toHaveCount(0);
      const profile = page.getByTestId("sidebar-profile");
      await expect(profile).toBeVisible();
      await expect(profile).toContainText("banner_user");
      await profile.click();
    } else if (await page.getByTestId("threads-leftnav").isVisible()) {
      await expect(page.getByTestId("rail-login")).toHaveCount(0);
      await page.getByTestId("rail-account").click();
    } else {
      test.skip(true, "the mobile tab bar has no avatar slot");
    }

    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByTestId("profile-page")).toBeVisible();
  });

  test("opens the messages placeholder for a signed-in user", async ({
    page,
  }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await mockAccount(page);
    await page.goto("/");

    await (await visibleNavItem(page, "messages")).click();

    await expect(page).toHaveURL(/\/messages/);
    await expect(page.getByTestId("messages-empty")).toBeVisible();
    const active = await visibleNavItem(page, "messages");
    await expect(active).toHaveAttribute("aria-current", "page");
  });

  test("opens the insights placeholder for a signed-in user", async ({
    page,
  }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await mockAccount(page);
    await page.goto("/");

    const insights = page.getByTestId("nav-insights");
    const railInsights = page.getByTestId("rail-insights");
    if (!(await insights.isVisible()) && !(await railInsights.isVisible())) {
      test.skip(true, "Thông tin chi tiết is not in the mobile tab bar");
    }

    await (await visibleNavItem(page, "insights")).click();

    await expect(page).toHaveURL(/\/insights/);
    await expect(page.getByTestId("insights-empty")).toBeVisible();
    const active = await visibleNavItem(page, "insights");
    await expect(active).toHaveAttribute("aria-current", "page");
  });

  test("marks the current section in every nav variant", async ({ page }) => {
    await page.goto("/search");

    let checked = 0;
    for (const prefix of ["nav", "rail", "tab"]) {
      const link = page.getByTestId(`${prefix}-search`);
      if (await link.isVisible()) {
        await expect(link).toHaveAttribute("aria-current", "page");
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);

    await page.goto("/");
    checked = 0;
    for (const prefix of ["nav", "rail", "tab"]) {
      const link = page.getByTestId(`${prefix}-home`);
      if (await link.isVisible()) {
        await expect(link).toHaveAttribute("aria-current", "page");
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  test("closes the Xem thêm menu when clicking outside", async ({ page }) => {
    await page.goto("/");
    if (!(await page.getByTestId("nav-more").isVisible())) {
      test.skip(true, "Xem thêm menu is desktop-only");
    }

    await page.getByTestId("nav-more").click();
    await expect(page.getByTestId("more-menu")).toBeVisible();

    await page.mouse.click(1240, 760);

    await expect(page.getByTestId("more-menu")).toHaveCount(0);
  });
});
