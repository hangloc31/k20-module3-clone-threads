import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useAuthStore, { selectIsAuthenticated } from "../../stores/authStore.js";
import { loginRequest } from "../../api/auth.js";
import { loginSchema } from "./schemas.js";

const inputCls =
  "w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none";

const Login = () => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { login: "", password: "" },
  });

  const login = useAuthStore((state) => state.login);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);

  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  // nếu đã login mà cố vào /login (F5) thì đá luôn, khỏi cần chờ submit
  if (isAuthenticated) return <Navigate to="/" replace />;

  const serverError = errors.root?.server?.message;

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { user, accessToken, refreshToken, expiresIn } =
        await loginRequest(data);

      login({ user, accessToken, refreshToken, expiresIn });

      // Load canonical user info; keep login-response user as fallback.
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
      const resp = error.response?.data;
      const fieldMessage =
        resp?.errors?.login?.[0] ||
        resp?.errors?.password?.[0] ||
        (typeof resp?.errors === "object"
          ? Object.values(resp.errors).flat()[0]
          : null);
      setError("root.server", {
        message:
          fieldMessage ||
          resp?.message ||
          (status === 0 || !status
            ? "Không kết nối được tới server"
            : "Đăng nhập thất bại"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 space-y-4"
    >
      <h1 className="text-xl font-bold">Đăng nhập</h1>

      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}

      <div>
        <input
          type="text"
          placeholder="Username hoặc Email"
          required
          autoComplete="username"
          className={inputCls}
          {...register("login")}
        />
        {errors.login && (
          <p className="text-sm text-red-600 mt-1">{errors.login.message}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="Mật khẩu"
          required
          autoComplete="current-password"
          className={inputCls}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
        )}
      </div>

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
        disabled={!isValid || loading}
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
