import { test, expect } from "@playwright/test";

test.describe("404 page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/duong-dan-khong-ton-tai");
  });

  test("shows heading and the missing path", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Trang này không tồn tại" }),
    ).toBeVisible();
    await expect(page.getByText("/duong-dan-khong-ton-tai")).toBeVisible();
  });

  test("primary CTA returns home", async ({ page }) => {
    await page.getByRole("link", { name: "Về trang chủ" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("threads-home")).toBeVisible();
  });

  test("secondary link goes to login", async ({ page }) => {
    const link = page.getByRole("link", { name: "Đăng nhập" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/login");
  });

  test("visual snapshot", async ({ page }) => {
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot({ maxDiffPixelRatio: 0.08 });
  });
});
