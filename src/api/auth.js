// Centralized auth endpoints. VITE_API_URL has no /api suffix;
// paths here always start with /api/... to avoid double-prefix bugs.
import instance from "./axios.js";

export const AUTH_ENDPOINTS = {
  login: "/api/auth/login",
  refresh: "/api/auth/refresh",
  user: "/api/auth/user",
};

export async function loginRequest({ login, password }) {
  const response = await instance.post(AUTH_ENDPOINTS.login, {
    login,
    password,
  });
  // Backend envelope: { data: { user, access_token, refresh_token, expires_in } }
  // Guard shape — accept both enveloped and flat responses.
  const payload = response.data?.data ?? response.data ?? {};
  const user = payload.user ?? null;
  const accessToken = payload.access_token ?? payload.accessToken ?? null;
  const refreshToken = payload.refresh_token ?? payload.refreshToken ?? null;
  const expiresIn = payload.expires_in ?? payload.expiresIn ?? null;

  if (!accessToken || !user) {
    throw new Error("Phản hồi đăng nhập không hợp lệ (thiếu token/user)");
  }
  return { user, accessToken, refreshToken, expiresIn };
}

// Get current user info. Backend envelope: { data: { user } | user | {...} }
export async function getUserInfo() {
  const response = await instance.get(AUTH_ENDPOINTS.user);
  const data = response.data?.data ?? response.data ?? {};
  const user = data.user ?? data;
  if (!user || typeof user !== "object" || Array.isArray(user)) {
    throw new Error("Phản hồi user info không hợp lệ");
  }
  return user;
}

// Refresh token pair. Returns { accessToken, refreshToken, expiresIn }.
// Throws when the backend refuses (caller must logout + redirect /login).
export async function refreshTokens(refreshToken) {
  const response = await instance.post(AUTH_ENDPOINTS.refresh, {
    refresh_token: refreshToken,
  });
  const payload = response.data?.data ?? response.data ?? {};
  const accessToken = payload.access_token ?? payload.accessToken ?? null;
  if (!accessToken) {
    throw new Error("Refresh token thất bại");
  }
  return {
    accessToken,
    refreshToken: payload.refresh_token ?? payload.refreshToken ?? refreshToken,
    expiresIn: payload.expires_in ?? payload.expiresIn ?? null,
  };
}
