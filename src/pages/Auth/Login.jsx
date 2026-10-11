import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router";
import useAuthStore, { selectIsAuthenticated } from "../../stores/authStore.js";
import { loginRequest } from "../../api/auth.js";

const Login = () => {
  const [form, setForm] = useState({
    login: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useAuthStore((state) => state.login);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);

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

      // Load canonical user info into global state; keep the
      // login-response user as fallback so a /user failure never blocks login.
      try {
        await fetchCurrentUser();
      } catch {
        // fallback user already stored above
      }

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

      <div className="text-right">
        <Link
          to="/forgot-password"
          className="text-sm text-neutral-500 hover:underline"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-black text-white dark:bg-white dark:text-black py-2 font-semibold disabled:opacity-40"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      <p className="text-sm text-center text-neutral-500">
        Bạn chưa có tài khoản?{" "}
        <Link to="/register" className="font-semibold hover:underline">
          Đăng ký
        </Link>
      </p>
    </form>
  );
};

export default Login;
