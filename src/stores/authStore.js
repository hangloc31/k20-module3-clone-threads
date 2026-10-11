import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getUserInfo } from "../api/auth.js";

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
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresIn: null,
          expiresAt: null,
        }),
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

export default useAuthStore;
