import { test, expect } from "@playwright/test";

const GENERIC_TEXT = "Nếu email này đã đăng ký";

test.describe("forgot password page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("renders the email field and link back to login", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Quên mật khẩu" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Đăng nhập" }),
    ).toHaveAttribute("href", "/login");
  });

  test("blocks submit with an invalid email", async ({ page }) => {
    await page.getByPlaceholder("Email").fill("not-an-email");
    await expect(
      page.getByRole("button", { name: "Gửi link đặt lại mật khẩu" }),
    ).toBeDisabled();
    await expect(page.getByText("Email không hợp lệ")).toBeVisible();
  });

  test("sends the reset request and shows a generic confirmation", async ({
    page,
  }) => {
    const bodies = [];
    await page.route("**/api/auth/forgot-password", (route) => {
      bodies.push(route.request().postDataJSON());
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Reset link sent to your email",
        }),
      });
    });
    await page.getByPlaceholder("Email").fill("user@x.com");
    await page
      .getByRole("button", { name: "Gửi link đặt lại mật khẩu" })
      .click();
    await expect(page.getByTestId("forgot-status")).toContainText(GENERIC_TEXT);
    expect(bodies).toEqual([{ email: "user@x.com" }]);
  });

  test("shows the same message for an unknown email (no user leak)", async ({
    page,
  }) => {
    await page.route("**/api/auth/forgot-password", (route) =>
      route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Validation failed",
          errors: { email: ["The selected email is invalid."] },
        }),
      }),
    );
    await page.getByPlaceholder("Email").fill("nobody@x.com");
    await page
      .getByRole("button", { name: "Gửi link đặt lại mật khẩu" })
      .click();
    await expect(page.getByTestId("forgot-status")).toContainText(GENERIC_TEXT);
  });

  test("shows an error when the request fails", async ({ page }) => {
    await page.route("**/api/auth/forgot-password", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Server Error" }),
      }),
    );
    await page.getByPlaceholder("Email").fill("user@x.com");
    await page
      .getByRole("button", { name: "Gửi link đặt lại mật khẩu" })
      .click();
    await expect(page.getByRole("alert")).toContainText("Server Error");
  });
});
