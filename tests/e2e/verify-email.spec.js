import { test, expect } from "@playwright/test";

test.describe("verify email page", () => {
  test("verifies with a query token and links to login", async ({ page }) => {
    await page.route("**/api/auth/verify-email", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} }),
      }),
    );
    await page.goto("/verify-email?token=valid-token");
    await expect(page.getByTestId("verify-status")).toContainText(
      "Email đã được xác thực thành công",
    );
    await expect(
      page.getByRole("link", { name: "Đăng nhập" }),
    ).toHaveAttribute("href", "/login");
  });

  test("verifies with a path token and calls the API exactly once", async ({
    page,
  }) => {
    const bodies = [];
    await page.route("**/api/auth/verify-email", (route) => {
      bodies.push(route.request().postDataJSON());
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
    await page.goto("/verify-email/path-token-123");
    await expect(page.getByTestId("verify-status")).toContainText(
      "Email đã được xác thực thành công",
    );
    expect(bodies).toEqual([{ token: "path-token-123" }]);
  });

  test("shows an error when the token is invalid", async ({ page }) => {
    await page.route("**/api/auth/verify-email", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Invalid verification token",
        }),
      }),
    );
    await page.goto("/verify-email?token=bad-token");
    await expect(page.getByTestId("verify-status")).toContainText(
      "Link xác thực không hợp lệ hoặc đã hết hạn",
    );
  });

  test("does not call the API when the token is missing", async ({ page }) => {
    const calls = [];
    await page.route("**/api/auth/verify-email", (route) => {
      calls.push(route.request().url());
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} }),
      });
    });
    await page.goto("/verify-email");
    await expect(page.getByTestId("verify-status")).toContainText(
      "Link xác thực không hợp lệ hoặc đã hết hạn",
    );
    expect(calls).toHaveLength(0);
  });
});
