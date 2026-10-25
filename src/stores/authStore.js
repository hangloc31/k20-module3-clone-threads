import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getUserInfo, isEmailVerified, logoutRequest } from "../api/auth.js";

const isExpired = (expiresAt) =>
  typeof expiresAt === "number" && Date.now() >= expiresAt;

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresIn: null,
      expiresAt: null,
      login: ({ user, accessToken, refreshToken, expiresIn }) =>
        set({
          user,
          accessToken,
          refreshToken,
          expiresIn,
          expiresAt:
            typeof expiresIn === "number"
              ? Date.now() + expiresIn * 1000
              : null,
        }),
      // Local-only: drop the session without touching the network. The axios
      // interceptor calls this on a failed refresh, so it must stay offline
      // (a request here would loop through the same interceptor).
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresIn: null,
          expiresAt: null,
        }),
      // Explicit sign-out: revoke the session on the server first, then clear
      // locally no matter what. Never let a failing network keep a user in.
      signOut: async () => {
        try {
          await logoutRequest();
        } catch {
          // Expired token / offline: local cleanup below is what matters.
        }
        get().logout();
      },
      // Fetch current user info (/api/auth/user) into global state.
      // Throws on failure — caller decides (login flow keeps the
      // login-response user as fallback so it never gets stuck).
      fetchCurrentUser: async () => {
        const user = await getUserInfo();
        set({ user });
        return user;
      },
      // Derived helper (not persisted as boolean): valid token + not expired
      isLoggedIn: () => {
        const { accessToken, expiresAt } = get();
        if (!accessToken) return false;
        if (isExpired(expiresAt)) return false;
        return true;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresIn: state.expiresIn,
        expiresAt: state.expiresAt,
      }),
      // Clear stale auth on rehydrate if expired
      onRehydrateStorage: () => (state) => {
        if (state && isExpired(state.expiresAt)) {
          state.logout?.();
        }
      },
    },
  ),
);

// Selector compatible with existing `useAuthStore((s) => s.isAuthenticated)` usage:
// derive instead of reading a persisted boolean.
export const selectIsAuthenticated = (s) =>
  typeof s.isLoggedIn === "function"
    ? s.isLoggedIn()
    : Boolean(s.accessToken);

// Email verification (not the blue badge — see isEmailVerified in api/auth.js).
export const selectIsEmailVerified = (s) => isEmailVerified(s.user);

export default useAuthStore;
