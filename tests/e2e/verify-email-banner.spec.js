import { test, expect } from "@playwright/test";
import { seedAuth } from "./helpers/seedAuth.js";

test.describe("unverified email banner", () => {
  test("shows the banner for a signed-in user without a verified email", async ({
    page,
  }) => {
    await seedAuth(page, { emailVerified: false });
    await page.goto("/");
    const banner = page.getByTestId("verify-email-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Email của bạn chưa được xác thực");
    await expect(banner).toContainText("banner@x.com");
  });

  test("hides the banner once the email is verified", async ({ page }) => {
    await seedAuth(page, { emailVerified: true });
    await page.goto("/");
    await expect(page.getByTestId("verify-email-banner")).toHaveCount(0);
  });

  test("resends the verification email", async ({ page }) => {
    await seedAuth(page, { emailVerified: false });
    const calls = [];
    await page.route("**/api/auth/resend-verification-email", (route) => {
      calls.push({
        method: route.request().method(),
        authorization: route.request().headers().authorization ?? null,
      });
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
    expect(calls).toEqual([
      { method: "POST", authorization: "Bearer seeded-access-token" },
    ]);
  });

  test("shows an error when resending fails", async ({ page }) => {
    await seedAuth(page, { emailVerified: false });
    await page.route("**/api/auth/resend-verification-email", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Server Error" }),
      }),
    );
    await page.goto("/");
    await page.getByTestId("resend-verification").click();
    await expect(page.getByRole("alert")).toContainText("Server Error");
  });
});
