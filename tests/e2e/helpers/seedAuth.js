// Seeds the persisted zustand auth store so a test can act as a signed-in
// user without hitting the login endpoint.
export const seedAuth = (
  page,
  { emailVerified = false, accessToken = "seeded-access-token" } = {},
) =>
  page.addInitScript(
    ({ verified, token }) => {
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
            accessToken: token,
            refreshToken: "seeded-refresh-token",
            expiresIn: 3600,
            expiresAt: Date.now() + 3600 * 1000,
          },
          version: 0,
        }),
      );
    },
    { verified: emailVerified, token: accessToken },
  );
