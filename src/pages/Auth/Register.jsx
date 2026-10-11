import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router";
import useAuthStore, { selectIsAuthenticated } from "../../stores/authStore.js";
import { registerRequest, validateUsername } from "../../api/auth.js";

const USERNAME_DEBOUNCE_MS = 700;

const inputCls =
  "w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none";
const fieldErrorCls = "text-sm text-red-600";

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  // idle | checking | available | taken
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const checkId = useRef(0);

  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  // Live-check username, debounced. Skipped while the field is empty.
  // The "checking" flag is set in handleChange (event), so this effect
  // only syncs with the network — no synchronous setState inside.
  useEffect(() => {
    const value = form.username.trim();
    if (!value) return undefined;
    const id = ++checkId.current;
    const timer = setTimeout(async () => {
      try {
        const { available } = await validateUsername(value);
        if (checkId.current !== id) return; // stale response
        setUsernameStatus(available ? "available" : "taken");
      } catch (error) {
        if (checkId.current !== id) return;
        const msg =
          error.response?.data?.errors?.username?.[0] ||
          error.response?.data?.message;
        setFieldErrors((prev) => ({
          ...prev,
          username: msg || "Không kiểm tra được tên người dùng",
        }));
        setUsernameStatus("taken");
      }
    }, USERNAME_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [form.username]);

  const passwordError =
    form.password && form.password.length < 8
      ? "Mật khẩu phải tối thiểu 8 ký tự"
      : "";
  const mismatchError =
    form.password_confirmation &&
    form.password_confirmation !== form.password
      ? "Mật khẩu xác nhận không khớp"
      : "";

  const canSubmit =
    form.username.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.password.length >= 8 &&
    form.password_confirmation === form.password &&
    form.password_confirmation.length > 0 &&
    usernameStatus !== "taken" &&
    usernameStatus !== "checking" &&
    !loading;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "username") {
      setUsernameStatus(value.trim() ? "checking" : "idle");
    }
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setFormError("");
    setSuccess(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setFormError("");
    setFieldErrors({});
    try {
      await registerRequest({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      setSuccess(true);
      setForm((prev) => ({ ...prev, password: "", password_confirmation: "" }));
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error(
          "Register failed:",
          error.response?.data ?? error.message,
        );
      }
      const data = error.response?.data;
      const errors = data?.errors;
      if (errors && typeof errors === "object") {
        const next = {};
        for (const [key, messages] of Object.entries(errors)) {
          next[key] = Array.isArray(messages) ? messages[0] : String(messages);
        }
        setFieldErrors(next);
        if (!next.username && !next.email && !next.password) {
          setFormError(data?.message || "Đăng ký thất bại");
        }
      } else {
        setFormError(
          data?.message ||
            (!error.response ? "Không kết nối được tới server" : "Đăng ký thất bại"),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // nếu đã login mà cố vào /register thì đá luôn (đặt sau mọi hook)
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <form
      onSubmit={handleRegister}
      className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 space-y-4"
    >
      <h1 className="text-xl font-bold">Đăng ký</h1>

      {success && (
        <p
          data-testid="register-success"
          role="status"
          className="text-sm rounded-xl bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-3 py-2"
        >
          Chúng tôi đã gửi một liên kết xác thực tới email của bạn. Vui lòng
          kiểm tra email để xác thực tài khoản.
        </p>
      )}

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <div>
        <input
          type="text"
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="Tên hiển thị"
          required
          autoComplete="username"
          className={inputCls}
        />
        {usernameStatus === "checking" && (
          <p data-testid="username-status" className="text-sm text-neutral-500 mt-1">
            Đang kiểm tra tên người dùng...
          </p>
        )}
        {usernameStatus === "taken" && !fieldErrors.username && (
          <p data-testid="username-status" className={`${fieldErrorCls} mt-1`}>
            Tên người dùng đã được sử dụng
          </p>
        )}
        {fieldErrors.username && (
          <p className={`${fieldErrorCls} mt-1`}>{fieldErrors.username}</p>
        )}
      </div>

      <div>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          required
          autoComplete="email"
          className={inputCls}
        />
        {fieldErrors.email && (
          <p className={`${fieldErrorCls} mt-1`}>{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Mật khẩu"
          required
          autoComplete="new-password"
          className={inputCls}
        />
        {(passwordError || fieldErrors.password) && (
          <p className={`${fieldErrorCls} mt-1`}>
            {fieldErrors.password || passwordError}
          </p>
        )}
      </div>

      <div>
        <input
          type="password"
          name="password_confirmation"
          value={form.password_confirmation}
          onChange={handleChange}
          placeholder="Xác nhận mật khẩu"
          required
          autoComplete="new-password"
          className={inputCls}
        />
        {mismatchError && (
          <p className={`${fieldErrorCls} mt-1`}>{mismatchError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-xl bg-black text-white dark:bg-white dark:text-black py-2 font-semibold disabled:opacity-40"
      >
        {loading ? "Đang đăng ký..." : "Đăng ký"}
      </button>

      <p className="text-sm text-center text-neutral-500">
        Đã có tài khoản?{" "}
        <Link to="/login" className="font-semibold hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
};

export default Register;
