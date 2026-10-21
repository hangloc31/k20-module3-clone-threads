// Centralized auth endpoints. VITE_API_URL has no /api suffix;
// paths here always start with /api/... to avoid double-prefix bugs.
import instance from "./axios.js";

export const AUTH_ENDPOINTS = {
  login: "/api/auth/login",
  register: "/api/auth/register",
  refresh: "/api/auth/refresh",
  user: "/api/auth/user",
  validateUsername: "/api/auth/validate/username",
  validateEmail: "/api/auth/validate/email",
  verifyEmail: "/api/auth/verify-email",
  resendVerificationEmail: "/api/auth/resend-verification-email",
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

// Register. Payload: { username, email, password, password_confirmation }.
// Resolves on success (no tokens — account needs email verification).
// Rejects with the axios error so the caller can read response errors.
export async function registerRequest({
  username,
  email,
  password,
  password_confirmation,
}) {
  const response = await instance.post(AUTH_ENDPOINTS.register, {
    username,
    email,
    password,
    password_confirmation,
  });
  return response.data?.data ?? response.data ?? {};
}

// Live-check username availability (debounced by caller).
// 200 + { data: { available: true|false } }; 422 carries field errors.
// Returns { available: boolean } on 200, throws otherwise.
export async function validateUsername(username) {
  const response = await instance.post(AUTH_ENDPOINTS.validateUsername, {
    username,
  });
  const data = response.data?.data ?? response.data ?? {};
  return { available: data.available !== false };
}

// Live-check email availability (debounced by caller).
// 200 + { data: { available: true|false } }; 422 carries field errors.
// Returns { available: boolean } on 200, throws otherwise.
export async function validateEmail(email) {
  const response = await instance.post(AUTH_ENDPOINTS.validateEmail, {
    email,
  });
  const data = response.data?.data ?? response.data ?? {};
  return { available: data.available !== false };
}

// Verify an email address with the token from the verification link.
// 200 → verified; 400 → { message: "Invalid verification token" };
// 422 → { errors: { token: [...] } }. Throws so the caller can show a message.
export async function verifyEmailRequest({ token }) {
  const response = await instance.post(AUTH_ENDPOINTS.verifyEmail, { token });
  return response.data?.data ?? response.data ?? {};
}

// Resend the verification email (requires an access token — the axios
// interceptor attaches the Bearer header for authenticated users).
export async function resendVerificationEmailRequest() {
  const response = await instance.post(AUTH_ENDPOINTS.resendVerificationEmail);
  return response.data?.data ?? response.data ?? {};
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
