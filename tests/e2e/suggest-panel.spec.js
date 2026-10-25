import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";
import { mockFeed, makeApiFeed } from "./helpers/feedFixture.js";

const suggestions = [
  {
    id: 7,
    name: "Nguyễn Văn B",
    username: "nguyenvanb",
    bio: "Backend Developer",
    is_private: false,
    verified: false,
    followers_count: 12,
    is_following: false,
    is_followed_by: false,
    avatar_url: "https://i.pravatar.cc/100?img=8",
  },
];

test.describe("suggestion panel", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await mockFeed(page, { 1: makeApiFeed(1) });
  });

  test("lists the users returned by the API", async ({ page }) => {
    await page.route("**/api/users/suggestions", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: suggestions }),
      }),
    );
    await page.goto("/");
    const panel = page.getByTestId("threads-suggest-panel");
    if (!(await panel.isVisible())) {
      test.skip(true, "suggestion panel is desktop-only");
    }
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("Gợi ý theo dõi");
    await expect(panel).toContainText("nguyenvanb");
    await expect(page.getByTestId("follow-7")).toContainText("Theo dõi");
  });

  test("follows a user with POST /api/users/{id}/follow", async ({ page }) => {
    await page.route("**/api/users/suggestions", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: suggestions }),
      }),
    );
    let followCall = null;
    await page.route("**/api/users/7/follow", (route) => {
      followCall = { method: route.request().method() };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "User followed successfully" }),
      });
    });

    await page.goto("/");
    const followBtn = page.getByTestId("follow-7");
    if (!(await followBtn.isVisible())) {
      test.skip(true, "suggestion panel is desktop-only");
    }
    await followBtn.click();
    await expect(followBtn).toContainText("Đang theo dõi");
    expect(followCall).toEqual({ method: "POST" });
  });

  test("unfollows with DELETE /api/users/{id}/follow", async ({ page }) => {
    await page.route("**/api/users/suggestions", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: suggestions.map((user) => ({ ...user, is_following: true })),
        }),
      }),
    );
    let followCall = null;
    await page.route("**/api/users/7/follow", (route) => {
      followCall = { method: route.request().method() };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "User unfollowed successfully",
        }),
      });
    });

    await page.goto("/");
    const followBtn = page.getByTestId("follow-7");
    if (!(await followBtn.isVisible())) {
      test.skip(true, "suggestion panel is desktop-only");
    }
    await expect(followBtn).toContainText("Đang theo dõi");
    await followBtn.click();
    await expect(followBtn).toContainText("Theo dõi");
    expect(followCall).toEqual({ method: "DELETE" });
  });

  const readStoredToken = (page) =>
    page.evaluate(() => {
      const raw = window.localStorage.getItem("auth-storage");
      return raw ? JSON.parse(raw).state.accessToken : "missing";
    });

  test("revokes the session on the server before clearing it locally", async ({
    page,
  }) => {
    await page.route("**/api/users/suggestions", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: suggestions }),
      }),
    );
    let logoutCall = null;
    await page.route("**/api/auth/logout", (route) => {
      logoutCall = {
        method: route.request().method(),
        authorization: route.request().headers().authorization,
      };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Logged out" }),
      });
    });

    await page.goto("/");
    const signOutBtn = page.getByTestId("suggest-logout-btn");
    if (!(await signOutBtn.isVisible())) {
      test.skip(true, "suggestion panel is desktop-only");
    }

    await expect.poll(() => readStoredToken(page)).toBe("seeded-access-token");
    await signOutBtn.click();

    await expect
      .poll(() => logoutCall)
      .toEqual({
        method: "POST",
        authorization: "Bearer seeded-access-token",
      });
    await expect.poll(() => readStoredToken(page)).toBeNull();
    await expect(page).toHaveURL(/\/$/);
  });

  test("clears the local session when the server session is already gone", async ({
    page,
  }) => {
    await page.route("**/api/users/suggestions", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: suggestions }),
      }),
    );
    await page.route("**/api/auth/logout", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Unauthenticated" }),
      }),
    );
    await page.route("**/api/auth/refresh", (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Invalid refresh" }),
      }),
    );

    await page.goto("/");
    const signOutBtn = page.getByTestId("suggest-logout-btn");
    if (!(await signOutBtn.isVisible())) {
      test.skip(true, "suggestion panel is desktop-only");
    }

    await signOutBtn.click();

    await expect.poll(() => readStoredToken(page)).toBeNull();
    // A failed sign-out must not bounce the user through /login.
    await expect(page).toHaveURL(/\/$/);
  });
});
