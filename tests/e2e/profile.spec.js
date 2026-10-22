import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";
import { makeApiFeed } from "./helpers/feedFixture.js";

const user = {
  id: 42,
  name: "Ronin Cipher",
  username: "ronin",
  bio: "Frontend developer",
  is_private: false,
  verified: true,
  email: "ronin@example.com",
  email_verified_at: null,
  created_at: "2026-01-15T10:00:00.000000Z",
  updated_at: "2026-10-01T10:00:00.000000Z",
  avatar_url: "https://i.pravatar.cc/100?img=12",
};

test.describe("profile page", () => {
  test("shows the account header with the verification state", async ({
    page,
  }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });
    await page.route("**/api/auth/user", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: user }),
      }),
    );
    await page.route("**/api/users/42/followers**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { current_page: 1, per_page: 20, total: 12, last_page: 1 },
        }),
      }),
    );
    await page.route("**/api/users/42/followings**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { current_page: 1, per_page: 20, total: 5, last_page: 1 },
        }),
      }),
    );
    await page.route("**/api/users/42/reposts**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [makeApiFeed(1)[0]],
          pagination: { current_page: 1, per_page: 20, total: 1, last_page: 1 },
        }),
      }),
    );

    await page.goto("/profile");

    const header = page.getByTestId("profile-header");
    await expect(header).toContainText("Ronin Cipher");
    await expect(header).toContainText("@ronin");
    await expect(header).toContainText("Frontend developer");
    await expect(page.getByTestId("profile-joined")).toContainText("15/01/2026");
    await expect(page.getByTestId("profile-email")).toContainText(
      "ronin@example.com",
    );
    await expect(page.getByTestId("profile-unverified")).toBeVisible();

    await expect(page.getByTestId("profile-stat-followers")).toContainText("12");
    await expect(page.getByTestId("profile-stat-following")).toContainText("5");
    await expect(page.getByTestId("profile-stat-reposts")).toContainText("1");
    await expect(page.getByTestId("post-1")).toBeVisible();
  });

  test("asks guests to log in", async ({ browser }) => {
    const context = await browser.newContext();
    const guest = await context.newPage();
    await guest.goto("/profile");
    await expect(guest.getByTestId("profile-login-link")).toBeVisible();
    await context.close();
  });
});
