import { test, expect } from "@playwright/test";

const seedAuth = (page, { emailVerified }) => {
  return page.addInitScript(
    ({ verified }) => {
      window.localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: {
              id: 42,
              name: "banner_user",
              username: "banner_user",
              email: "banner@x.com",
              email_verified_at: verified ? "2026-10-20T10:00:00.000000Z" : null,
            },
            accessToken: "seeded-access-token",
            refreshToken: "seeded-refresh-token",
            expiresIn: 3600,
            expiresAt: Date.now() + 3600 * 1000,
          },
          version: 0,
        }),
      );
    },
    { verified: emailVerified },
  );
};

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
      calls.push(route.request().method());
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
    expect(calls).toEqual(["POST"]);
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
