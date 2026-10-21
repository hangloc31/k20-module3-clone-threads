import { test, expect } from "@playwright/test";

const fulfillAvailable = (route, available) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, data: { available } }),
  });

const mockUsername = (page, available = true) =>
  page.route("**/api/auth/validate/username", (route) =>
    fulfillAvailable(route, available),
  );

const mockEmail = (page, available = true) =>
  page.route("**/api/auth/validate/email", (route) =>
    fulfillAvailable(route, available),
  );

const fillForm = async (page, { username, email, password = "Ronin@123" }) => {
  await page.getByPlaceholder("Tên hiển thị").fill(username);
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Mật khẩu", { exact: true }).fill(password);
  await page.getByPlaceholder("Xác nhận mật khẩu").fill(password);
};

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
    await mockEmail(page);
    await page.getByPlaceholder("Tên hiển thị").fill("newuser1");
    await page.getByPlaceholder("Email").fill("new@x.com");
    await page.getByPlaceholder("Mật khẩu", { exact: true }).fill("short");
    await page.getByPlaceholder("Xác nhận mật khẩu").fill("different");
    await expect(page.getByRole("button", { name: "Đăng ký" })).toBeDisabled();
    await expect(page.getByText("Mật khẩu phải tối thiểu 8 ký tự")).toBeVisible();
    await expect(page.getByText("Mật khẩu xác nhận không khớp")).toBeVisible();
  });

  test("shows inline error when username is taken", async ({ page }) => {
    await mockUsername(page, false);
    await page.getByPlaceholder("Tên hiển thị").fill("takenuser");
    await expect(page.getByTestId("username-status")).toContainText(
      "Tên người dùng đã được sử dụng",
    );
    await expect(page.getByRole("button", { name: "Đăng ký" })).toBeDisabled();
  });

  test("shows inline error when email is taken", async ({ page }) => {
    await mockUsername(page);
    await mockEmail(page, false);
    await fillForm(page, { username: "freshuser3", email: "taken@x.com" });
    await expect(page.getByTestId("email-status")).toContainText(
      "Email đã được sử dụng",
    );
    await expect(page.getByRole("button", { name: "Đăng ký" })).toBeDisabled();
  });

  test("blocks submit when the email check fails", async ({ page }) => {
    await mockUsername(page);
    await page.route("**/api/auth/validate/email", (route) => route.abort());
    await fillForm(page, { username: "freshuser4", email: "broken@x.com" });
    await expect(page.getByTestId("email-status")).toContainText(
      "Không kiểm tra được email",
    );
    await expect(page.getByRole("button", { name: "Đăng ký" })).toBeDisabled();
  });

  test("skips the email check for malformed emails", async ({ page }) => {
    const emailRequests = [];
    await page.route("**/api/auth/validate/email", (route) => {
      emailRequests.push(route.request().url());
      return fulfillAvailable(route, true);
    });
    await page.getByPlaceholder("Email").fill("not-an-email");
    await expect(page.getByText("Email không hợp lệ")).toBeVisible();
    await expect(page.getByTestId("email-status")).toHaveCount(0);
    expect(emailRequests).toHaveLength(0);
  });

  test("allows submit when username is available", async ({ page }) => {
    await mockUsername(page);
    await mockEmail(page);
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
    await mockUsername(page);
    await mockEmail(page);
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

  test("signs the user in and lands on the feed when tokens are returned", async ({
    page,
  }) => {
    await mockUsername(page);
    await mockEmail(page);
    await page.route("**/api/auth/register", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "User registered successfully. Please verify your email.",
          data: {
            user: {
              id: 999,
              name: "freshuser5",
              username: "freshuser5",
              email: "fresh5@x.com",
              verified: false,
            },
            access_token: "access-token-abc",
            refresh_token: "refresh-token-abc",
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
          data: {
            id: 999,
            name: "freshuser5",
            username: "freshuser5",
            email: "fresh5@x.com",
            email_verified_at: null,
          },
        }),
      }),
    );

    await fillForm(page, {
      username: "freshuser5",
      email: "fresh5@x.com",
    });
    await page.getByRole("button", { name: "Đăng ký" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("verify-email-banner")).toBeVisible();
    await expect(page.getByTestId("verify-email-banner")).toContainText(
      "fresh5@x.com",
    );
  });

  test("keeps the success message when the backend returns no tokens", async ({
    page,
  }) => {
    await mockUsername(page);
    await mockEmail(page);
    await page.route("**/api/auth/register", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} }),
      }),
    );
    await fillForm(page, { username: "freshuser6", email: "fresh6@x.com" });
    await page.getByRole("button", { name: "Đăng ký" }).click();
    await expect(page.getByTestId("register-success")).toBeVisible();
  });

  test("bottom link goes to login", async ({ page }) => {
    const link = page.getByRole("link", { name: "Đăng nhập" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/login");
    await expect(page.getByText("Đã có tài khoản?")).toBeVisible();
  });
});
