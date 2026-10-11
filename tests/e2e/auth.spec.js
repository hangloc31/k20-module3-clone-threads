import { test, expect } from "@playwright/test";

test.describe("auth redirect matrix", () => {
  test("guest visiting /dashboard is sent to /", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("threads-home")).toBeVisible();
  });

  test("login page has its own theme toggle and stays on page", async ({ page }) => {
    await page.goto("/login");
    const html = page.locator("html");
    const before = (await html.getAttribute("class")) ?? "";
    await page.getByTestId("theme-toggle-login").click();
    const after = (await html.getAttribute("class")) ?? "";
    expect(before.includes("dark") !== after.includes("dark")).toBe(true);
    await expect(page).toHaveURL(/\/login/);
  });

  test("login form blocks empty submit inline", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Đăng nhập" })).toBeVisible();
    const btn = page.getByRole("button", { name: "Đăng nhập" });
    await expect(btn).toBeDisabled();
  });

  test("login page links Quên mật khẩu? to /forgot-password", async ({ page }) => {
    await page.goto("/login");
    const link = page.getByRole("link", { name: "Quên mật khẩu?" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/forgot-password");
  });

  test("login page links Đăng ký to /register", async ({ page }) => {
    await page.goto("/login");
    const link = page.getByRole("link", { name: "Đăng ký" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/register");
    await expect(page.getByText("Bạn chưa có tài khoản?")).toBeVisible();
  });

  test("successful login fetches user info from /api/auth/user", async ({ page }) => {
    const loginPayload = {
      data: {
        user: { id: 1, username: "mockuser" },
        access_token: "mock-access",
        refresh_token: "mock-refresh",
        expires_in: 3600,
      },
    };
    const mePayload = { data: { id: 1, username: "mockuser", email: "m@x.com" } };
    await page.route("**/api/auth/login", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(loginPayload) }),
    );
    const userRequest = page.waitForRequest("**/api/auth/user");
    await page.route("**/api/auth/user", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mePayload) }),
    );

    await page.goto("/login");
    await page.getByPlaceholder("Username hoặc Email").fill("mockuser");
    await page.getByPlaceholder("Mật khẩu").fill("secret123");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await userRequest;
    await expect(page).toHaveURL(/\/$/);
  });
});
