import { test, expect } from "@playwright/test";

test.describe("reset password page", () => {
  test("resets the password with a query token", async ({ page }) => {
    const bodies = [];
    await page.route("**/api/auth/reset-password", (route) => {
      bodies.push(route.request().postDataJSON());
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
    await page.goto("/reset-password?token=valid-token");
    await page.getByPlaceholder("Mật khẩu mới").fill("Ronin@12345");
    await page.getByPlaceholder("Xác nhận mật khẩu").fill("Ronin@12345");
    await page.getByRole("button", { name: "Đặt lại mật khẩu" }).click();
    await expect(page.getByTestId("reset-status")).toContainText(
      "Đặt lại mật khẩu thành công",
    );
    await expect(
      page.getByRole("link", { name: "Đăng nhập", exact: true }),
    ).toHaveAttribute("href", "/login");
    expect(bodies).toEqual([
      {
        token: "valid-token",
        password: "Ronin@12345",
        password_confirmation: "Ronin@12345",
      },
    ]);
  });

  test("resets the password with a path token", async ({ page }) => {
    const bodies = [];
    await page.route("**/api/auth/reset-password", (route) => {
      bodies.push(route.request().postDataJSON());
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
    await page.goto("/reset-password/path-token-123");
    await page.getByPlaceholder("Mật khẩu mới").fill("Ronin@12345");
    await page.getByPlaceholder("Xác nhận mật khẩu").fill("Ronin@12345");
    await page.getByRole("button", { name: "Đặt lại mật khẩu" }).click();
    await expect(page.getByTestId("reset-status")).toContainText(
      "Đặt lại mật khẩu thành công",
    );
    expect(bodies[0]?.token).toBe("path-token-123");
  });

  test("rejects mismatched passwords before calling the API", async ({
    page,
  }) => {
    const calls = [];
    await page.route("**/api/auth/reset-password", (route) => {
      calls.push(route.request().url());
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
    await page.goto("/reset-password?token=valid-token");
    await page.getByPlaceholder("Mật khẩu mới").fill("Ronin@12345");
    await page.getByPlaceholder("Xác nhận mật khẩu").fill("Khac@12345");
    await expect(page.getByText("Mật khẩu xác nhận không khớp")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Đặt lại mật khẩu" }),
    ).toBeDisabled();
    expect(calls).toHaveLength(0);
  });

  test("shows an error when the token is invalid", async ({ page }) => {
    await page.route("**/api/auth/reset-password", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Invalid or expired token",
        }),
      }),
    );
    await page.goto("/reset-password?token=bad-token");
    await page.getByPlaceholder("Mật khẩu mới").fill("Ronin@12345");
    await page.getByPlaceholder("Xác nhận mật khẩu").fill("Ronin@12345");
    await page.getByRole("button", { name: "Đặt lại mật khẩu" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
    );
  });

  test("does not call the API when the token is missing", async ({ page }) => {
    const calls = [];
    await page.route("**/api/auth/reset-password", (route) => {
      calls.push(route.request().url());
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
    await page.goto("/reset-password");
    await expect(page.getByTestId("reset-status")).toContainText(
      "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
    );
    expect(calls).toHaveLength(0);
  });
});
