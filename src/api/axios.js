import axios from "axios";
import useAuthStore from "../stores/authStore";
import { AUTH_ENDPOINTS, refreshTokens } from "./auth.js";

// Single source of truth: VITE_API_URL must NOT include trailing /api.
// All endpoint paths below include the /api prefix.
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://threads.f8team.dev",
  headers: {
    "Content-Type": "application/json",
  },
});

// Endpoints that must NEVER receive the user's access token: they are the
// ones that issue or reset a session. Everything else — including
// /api/auth/user and /api/auth/resend-verification-email — is authenticated
// and needs the Bearer header.
// Resolved at request time: auth.js and axios.js import each other, so
// AUTH_ENDPOINTS is not safe to read while a module body is still running.
const publicAuthPaths = () => [
  AUTH_ENDPOINTS.login,
  AUTH_ENDPOINTS.register,
  AUTH_ENDPOINTS.refresh,
  AUTH_ENDPOINTS.validateUsername,
  AUTH_ENDPOINTS.validateEmail,
  AUTH_ENDPOINTS.verifyEmail,
  AUTH_ENDPOINTS.forgotPassword,
  AUTH_ENDPOINTS.resetPassword,
];

const isPublicAuthPath = (url = "") =>
  publicAuthPaths().some((path) => url.includes(path));

instance.interceptors.request.use(
  (config) => {
    // Don't attach stale tokens to the public auth endpoints (login/refresh)
    if (isPublicAuthPath(config.url)) return config;
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Only handle 401 once per request, skip public auth endpoints to avoid
    // loops (login/refresh must never trigger a refresh).
    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isPublicAuthPath(original.url)
    ) {
      original._retry = true;
      const { refreshToken, logout } = useAuthStore.getState();

      // Try refresh if we have a refresh token; backend contract:
      // POST /api/auth/refresh { refresh_token } -> { access_token, ... }
      if (refreshToken && !isRefreshing) {
        isRefreshing = true;
        try {
          const next = await refreshTokens(refreshToken);
          useAuthStore.setState({
            accessToken: next.accessToken,
            refreshToken: next.refreshToken,
            expiresIn: next.expiresIn,
            expiresAt:
              typeof next.expiresIn === "number"
                ? Date.now() + next.expiresIn * 1000
                : useAuthStore.getState().expiresAt,
          });
          original.headers.Authorization = `Bearer ${next.accessToken}`;
          return instance(original);
        } catch {
          // fall through to logout + redirect
        } finally {
          isRefreshing = false;
        }
      }

      logout();
      // Refresh failed (or no refresh token): force back to /login
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default instance;
