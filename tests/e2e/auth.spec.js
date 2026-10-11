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
});
