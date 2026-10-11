import { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import useAuthStore, { selectIsAuthenticated } from "../stores/authStore.js";
import { loginRequest } from "../api/auth.js";
import ThemeToggle from "../components/threads/ThemeToggle.jsx";
import ThreadsLogo from "@/components/threads/ThreadsLogo.jsx";
import { Link } from "react-router";
const LoginPage = () => {
  const [form, setForm] = useState({
    login: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useAuthStore((state) => state.login);

  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  // nếu đã login mà cố vào /login (F5) thì đá luôn, khỏi cần chờ submit
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const canSubmit =
    form.login.trim().length > 0 && form.password.length > 0 && !loading;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { user, accessToken, refreshToken, expiresIn } =
        await loginRequest(form);

      login({ user, accessToken, refreshToken, expiresIn });
      navigate("/", { replace: true });
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error("Login failed:", error.response?.data ?? error.message);
      }
      const status = error.response?.status;
      const data = error.response?.data;
      const fieldMessage =
        data?.errors?.login?.[0] ||
        data?.errors?.password?.[0] ||
        (typeof data?.errors === "object"
          ? Object.values(data.errors).flat()[0]
          : null);
      setError(
        fieldMessage ||
          data?.message ||
          (status === 0 || !status
            ? "Không kết nối được tới server"
            : "Đăng nhập thất bại"),
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col gap-5 items-center justify-center bg-neutral-100 dark:bg-neutral-950 px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="icon" testId="theme-toggle-login" />
      </div>

      <Link to="/" aria-label="Threads home">
        <ThreadsLogo className="w-auto h-10" />
      </Link>
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 space-y-4"
      >
        <h1 className="text-xl font-bold">Đăng nhập</h1>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <input
          type="text"
          name="login"
          value={form.login}
          onChange={handleChange}
          placeholder="Username hoặc Email"
          required
          autoComplete="username"
          className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none"
        />

        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Mật khẩu"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-black text-white dark:bg-white dark:text-black py-2 font-semibold disabled:opacity-40"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
