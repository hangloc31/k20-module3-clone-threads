import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";

// Regression guard: only the endpoints that issue/reset a session may be
// called without the Bearer token. Everything else — including
// /api/auth/user and /api/auth/resend-verification-email — must carry it.
test.describe("auth request headers", () => {
  test("public auth endpoints are called without an Authorization header even when signed in", async ({
    page,
  }) => {
    await seedAuth(page, { accessToken: "stale-token" });

    let authHeader = "not-called";
    await page.route("**/api/auth/forgot-password", (route) => {
      authHeader = route.request().headers().authorization ?? null;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Reset link sent to your email",
        }),
      });
    });

    // /forgot-password is reachable while signed in, so the token exists in
    // the store and the request must still go out without it.
    await page.goto("/forgot-password");
    await page.getByPlaceholder("Email").fill("user@x.com");
    await page
      .getByRole("button", { name: "Gửi link đặt lại mật khẩu" })
      .click();
    await expect(page.getByTestId("forgot-status")).toBeVisible();
    expect(authHeader).toBeNull();
  });

  test("validate endpoints are called without an Authorization header", async ({
    page,
  }) => {
    const seen = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/auth/validate")) {
        seen.push(req.headers().authorization ?? null);
      }
    });

    await page.route("**/api/auth/validate/username", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { available: true } }),
      }),
    );
    await page.route("**/api/auth/validate/email", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { available: true } }),
      }),
    );

    await page.goto("/register");
    await page.getByPlaceholder("Tên hiển thị").fill("headeruser");
    await page.getByPlaceholder("Email").fill("header@x.com");
    await page.waitForTimeout(1200);

    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((auth) => auth === null)).toBe(true);
  });

  test("GET /api/auth/user carries the Bearer token", async ({ page }) => {
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 1, username: "mockuser" },
            access_token: "mock-access",
            refresh_token: "mock-refresh",
            expires_in: 3600,
          },
        }),
      }),
    );
    await page.route("**/api/auth/user", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: 1, username: "mockuser", email: "m@x.com" },
        }),
      }),
    );

    await page.goto("/login");
    // register the waiter before the action, otherwise the request may
    // already be gone when we start waiting
    const userRequest = page.waitForRequest("**/api/auth/user");
    await page.getByPlaceholder("Username hoặc Email").fill("mockuser");
    await page.getByPlaceholder("Mật khẩu").fill("secret123");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    expect((await userRequest).headers().authorization).toBe("Bearer mock-access");
  });

  test("resend verification carries the Bearer token", async ({ page }) => {
    await seedAuth(page, { accessToken: "seeded-access-token" });

    let authHeader = null;
    await page.route("**/api/auth/resend-verification-email", (route) => {
      authHeader = route.request().headers().authorization ?? null;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Verification email sent successfully",
        }),
      });
    });

    await page.goto("/");
    await page.getByTestId("resend-verification").click();
    await expect(page.getByTestId("resend-status")).toContainText(
      "Đã gửi lại email xác thực",
    );
    expect(authHeader).toBe("Bearer seeded-access-token");
  });

  test("a 401 on /api/auth/user refreshes the token and retries", async ({
    page,
  }) => {
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 1, username: "mockuser" },
            access_token: "expired-access",
            refresh_token: "mock-refresh",
            expires_in: 3600,
          },
        }),
      }),
    );
    await page.route("**/api/auth/refresh", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            access_token: "refreshed-access",
            refresh_token: "refreshed-refresh",
            expires_in: 3600,
          },
        }),
      }),
    );

    let userCalls = 0;
    await page.route("**/api/auth/user", (route) => {
      userCalls += 1;
      if (userCalls === 1) {
        return route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ success: false, message: "Token expired" }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: 1, username: "mockuser", email: "m@x.com" },
        }),
      });
    });

    await page.goto("/login");
    await page.getByPlaceholder("Username hoặc Email").fill("mockuser");
    await page.getByPlaceholder("Mật khẩu").fill("secret123");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    const retried = await page.waitForRequest(
      (req) =>
        req.url().includes("/api/auth/user") &&
        req.headers().authorization === "Bearer refreshed-access",
    );
    expect(retried).toBeTruthy();
  });

  test("two 401s share one refresh instead of logging out", async ({
    page,
  }) => {
    await seedAuth(page, { accessToken: "expired-access" });

    let refreshCalls = 0;
    await page.route("**/api/auth/refresh", async (route) => {
      refreshCalls += 1;
      // Hold the refresh open so the other 401s land while it is in flight.
      await new Promise((resolve) => setTimeout(resolve, 400));
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            access_token: "fresh-access",
            refresh_token: "fresh-refresh",
            expires_in: 3600,
          },
        }),
      });
    });

    // The profile page fires four protected requests at once — the narrowest
    // window we can create for two 401s to overlap.
    const expireOnce = (pattern, body) => {
      let calls = 0;
      page.route(pattern, (route) => {
        calls += 1;
        if (calls === 1) {
          return route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ success: false, message: "Token expired" }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      });
    };

    expireOnce("**/api/auth/user", {
      success: true,
      data: { id: 42, username: "banner_user", email: "banner@x.com" },
    });
    expireOnce("**/api/users/42/followers**", {
      success: true,
      data: [],
      pagination: { total: 0 },
    });
    expireOnce("**/api/users/42/followings**", {
      success: true,
      data: [],
      pagination: { total: 0 },
    });
    expireOnce("**/api/users/42/reposts**", {
      success: true,
      data: [],
      pagination: { total: 0 },
    });

    await page.goto("/profile");

    await expect.poll(() => refreshCalls).toBe(1);
    await expect(page).toHaveURL(/\/profile$/);
  });
});
