import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useAuthStore, { selectIsAuthenticated } from "../../stores/authStore.js";
import {
  registerRequest,
  validateUsername,
  validateEmail,
} from "../../api/auth.js";
import {
  registerSchema,
  emailSchema,
  USERNAME_DEBOUNCE_MS,
  EMAIL_DEBOUNCE_MS,
} from "./schemas.js";

const inputCls =
  "w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none";
const fieldErrorCls = "text-sm text-red-600";

const KNOWN_SERVER_FIELDS = ["username", "email", "password", "password_confirmation"];

const alwaysValid = () => true;
const isValidEmailFormat = (value) => emailSchema.safeParse(value).success;

// Debounced availability check against a backend validate endpoint.
// - Empty or malformed values skip the network (zod surfaces those messages).
// - Stale responses are dropped via a per-field request id.
// - On failure the field is marked as "taken" so the form cannot be submitted.
const useAvailabilityCheck = ({
  value,
  isValidFormat,
  check,
  field,
  takenMessage,
  failureMessage,
  debounceMs,
  setError,
  clearErrors,
}) => {
  const [checking, setChecking] = useState(false);
  const checkId = useRef(0);

  useEffect(() => {
    const current = (value ?? "").trim();
    if (!current || !isValidFormat(current)) {
      setChecking(false);
      return undefined;
    }
    setChecking(true);
    const id = ++checkId.current;
    const timer = setTimeout(async () => {
      try {
        const { available } = await check(current);
        if (checkId.current !== id) return; // stale response
        setChecking(false);
        if (available) {
          clearErrors(field);
        } else {
          setError(field, { type: "taken", message: takenMessage });
        }
      } catch (error) {
        if (checkId.current !== id) return;
        setChecking(false);
        setError(field, {
          type: "taken",
          message:
            error.response?.data?.errors?.[field]?.[0] ||
            error.response?.data?.message ||
            failureMessage,
        });
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [
    value,
    isValidFormat,
    check,
    field,
    takenMessage,
    failureMessage,
    debounceMs,
    setError,
    clearErrors,
  ]);

  return checking;
};

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
  });

  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const usernameValue = watch("username");
  const emailValue = watch("email");

  // Live-check username availability, debounced.
  const checkingUsername = useAvailabilityCheck({
    value: usernameValue,
    isValidFormat: alwaysValid,
    check: validateUsername,
    field: "username",
    takenMessage: "Tên người dùng đã được sử dụng",
    failureMessage: "Không kiểm tra được tên người dùng",
    debounceMs: USERNAME_DEBOUNCE_MS,
    setError,
    clearErrors,
  });

  // Live-check email availability, debounced. Malformed emails are skipped
  // so the server is not hit with invalid input — zod reports the format.
  const checkingEmail = useAvailabilityCheck({
    value: emailValue,
    isValidFormat: isValidEmailFormat,
    check: validateEmail,
    field: "email",
    takenMessage: "Email đã được sử dụng",
    failureMessage: "Không kiểm tra được email",
    debounceMs: EMAIL_DEBOUNCE_MS,
    setError,
    clearErrors,
  });

  // nếu đã login mà cố vào /register thì đá luôn (đặt sau mọi hook)
  if (isAuthenticated) return <Navigate to="/" replace />;

  const usernameError = errors.username;
  const emailError = errors.email;

  const serverError = errors.root?.server?.message;
  const canSubmit =
    isValid &&
    !checkingUsername &&
    !checkingEmail &&
    usernameError?.type !== "taken" &&
    emailError?.type !== "taken" &&
    !loading;

  const onSubmit = async (data) => {
    setLoading(true);
    clearErrors("root.server");
    try {
      await registerRequest({
        username: data.username.trim(),
        email: data.email.trim(),
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      setSuccess(true);
      reset({
        username: data.username,
        email: data.email,
        password: "",
        password_confirmation: "",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error(
          "Register failed:",
          error.response?.data ?? error.message,
        );
      }
      const resp = error.response?.data;
      const respErrors = resp?.errors;
      let mapped = false;
      if (respErrors && typeof respErrors === "object") {
        for (const [key, messages] of Object.entries(respErrors)) {
          const message = Array.isArray(messages)
            ? messages[0]
            : String(messages);
          if (KNOWN_SERVER_FIELDS.includes(key)) {
            setError(key, { type: "server", message });
            mapped = true;
          }
        }
      }
      if (!mapped) {
        setError("root.server", {
          message:
            resp?.message ||
            (!error.response
              ? "Không kết nối được tới server"
              : "Đăng ký thất bại"),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
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
          kiểm tra email để xác thực tài khoản. Khi mở liên kết, trình duyệt
          sẽ đưa bạn tới trang xác thực và đăng nhập được ngay sau đó.
        </p>
      )}

      {serverError && (
        <p role="alert" className="text-sm text-red-600">
          {serverError}
        </p>
      )}

      <div>
        <input
          type="text"
          placeholder="Tên hiển thị"
          required
          autoComplete="username"
          className={inputCls}
          {...register("username")}
        />
        {checkingUsername && (
          <p data-testid="username-status" className="text-sm text-neutral-500 mt-1">
            Đang kiểm tra tên người dùng...
          </p>
        )}
        {!checkingUsername && usernameError && (
          <p
            data-testid={
              usernameError.type === "taken" ? "username-status" : undefined
            }
            className={`${fieldErrorCls} mt-1`}
          >
            {usernameError.message}
          </p>
        )}
      </div>

      <div>
        <input
          type="email"
          placeholder="Email"
          required
          autoComplete="email"
          className={inputCls}
          {...register("email")}
        />
        {checkingEmail && (
          <p data-testid="email-status" className="text-sm text-neutral-500 mt-1">
            Đang kiểm tra email...
          </p>
        )}
        {!checkingEmail && emailError && (
          <p
            data-testid={emailError.type === "taken" ? "email-status" : undefined}
            className={`${fieldErrorCls} mt-1`}
          >
            {emailError.message}
          </p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="Mật khẩu"
          required
          autoComplete="new-password"
          className={inputCls}
          {...register("password")}
        />
        {errors.password && (
          <p className={`${fieldErrorCls} mt-1`}>{errors.password.message}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          required
          autoComplete="new-password"
          className={inputCls}
          {...register("password_confirmation")}
        />
        {errors.password_confirmation && (
          <p className={`${fieldErrorCls} mt-1`}>
            {errors.password_confirmation.message}
          </p>
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
