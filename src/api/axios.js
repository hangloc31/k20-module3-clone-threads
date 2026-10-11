import axios from "axios";
import useAuthStore from "../stores/authStore";

// Single source of truth: VITE_API_URL must NOT include trailing /api.
// All endpoint paths below include the /api prefix.
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://threads.f8team.dev",
  headers: {
    "Content-Type": "application/json",
  },
});

const isAuthPath = (url = "") => url.includes("/auth/");

instance.interceptors.request.use(
  (config) => {
    // Don't attach stale tokens to auth endpoints (login/refresh)
    if (isAuthPath(config.url)) return config;
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

    // Only handle 401 once per request, skip auth endpoints to avoid loops
    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthPath(original.url)
    ) {
      original._retry = true;
      const { refreshToken, logout } = useAuthStore.getState();

      // Try refresh if we have a refresh token; backend contract:
      // POST /api/auth/refresh { refresh_token } -> { access_token, ... }
      if (refreshToken && !isRefreshing) {
        isRefreshing = true;
        try {
          const res = await axios.post(
            `${instance.defaults.baseURL}/api/auth/refresh`,
            { refresh_token: refreshToken },
          );
          const payload = res.data?.data ?? res.data;
          const nextToken =
            payload?.access_token ?? payload?.accessToken ?? null;
          if (nextToken) {
            useAuthStore.setState({
              accessToken: nextToken,
              expiresIn: payload?.expires_in ?? payload?.expiresIn ?? null,
              expiresAt:
                typeof (payload?.expires_in ?? payload?.expiresIn) ===
                "number"
                  ? Date.now() +
                    (payload.expires_in ?? payload.expiresIn) * 1000
                  : useAuthStore.getState().expiresAt,
            });
            original.headers.Authorization = `Bearer ${nextToken}`;
            return instance(original);
          }
        } catch {
          // fall through to logout
        } finally {
          isRefreshing = false;
        }
      }

      logout();
    }

    return Promise.reject(error);
  },
);

export default instance;
