import { test, expect } from "@playwright/test";

test.describe("register page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("renders all required fields", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Đăng ký" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Tên hiển thị")).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Mật khẩu", { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("Xác nhận mật khẩu")).toBeVisible();
  });

  test("blocks empty submit", async ({ page }) => {
    const btn = page.getByRole("button", { name: "Đăng ký" });
    await expect(btn).toBeDisabled();
  });

  test("rejects short password and mismatch", async ({ page }) => {
    await page.getByPlaceholder("Tên hiển thị").fill("newuser1");
    await page.getByPlaceholder("Email").fill("new@x.com");
    await page.getByPlaceholder("Mật khẩu", { exact: true }).fill("short");
    await page.getByPlaceholder("Xác nhận mật khẩu").fill("different");
    await expect(page.getByRole("button", { name: "Đăng ký" })).toBeDisabled();
    await expect(page.getByText("Mật khẩu phải tối thiểu 8 ký tự")).toBeVisible();
    await expect(page.getByText("Mật khẩu xác nhận không khớp")).toBeVisible();
  });

  test("shows inline error when username is taken", async ({ page }) => {
    await page.route("**/api/auth/validate/username", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { available: false } }),
      }),
    );
    await page.getByPlaceholder("Tên hiển thị").fill("takenuser");
    await expect(page.getByTestId("username-status")).toContainText(
      "Tên người dùng đã được sử dụng",
    );
    await expect(page.getByRole("button", { name: "Đăng ký" })).toBeDisabled();
  });

  test("allows submit when username is available", async ({ page }) => {
    await page.route("**/api/auth/validate/username", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { available: true } }),
      }),
    );
    await page.route("**/api/auth/register", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} }),
      }),
    );
    await page.getByPlaceholder("Tên hiển thị").fill("freshuser1");
    await page.getByPlaceholder("Email").fill("fresh@x.com");
    await page.getByPlaceholder("Mật khẩu", { exact: true }).fill("Ronin@123");
    await page.getByPlaceholder("Xác nhận mật khẩu").fill("Ronin@123");
    await expect(page.getByRole("button", { name: "Đăng ký" })).toBeEnabled();
    await page.getByRole("button", { name: "Đăng ký" }).click();
    await expect(page.getByTestId("register-success")).toContainText(
      "Chúng tôi đã gửi một liên kết xác thực tới email của bạn",
    );
  });

  test("shows server error on failed register", async ({ page }) => {
    await page.route("**/api/auth/validate/username", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { available: true } }),
      }),
    );
    await page.route("**/api/auth/register", (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Validation failed",
          errors: { email: ["Email đã được sử dụng."] },
        }),
      }),
    );
    await page.getByPlaceholder("Tên hiển thị").fill("freshuser2");
    await page.getByPlaceholder("Email").fill("used@x.com");
    await page.getByPlaceholder("Mật khẩu", { exact: true }).fill("Ronin@123");
    await page.getByPlaceholder("Xác nhận mật khẩu").fill("Ronin@123");
    await page.getByRole("button", { name: "Đăng ký" }).click();
    await expect(page.getByText("Email đã được sử dụng.")).toBeVisible();
  });

  test("bottom link goes to login", async ({ page }) => {
    const link = page.getByRole("link", { name: "Đăng nhập" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/login");
    await expect(page.getByText("Đã có tài khoản?")).toBeVisible();
  });
});
