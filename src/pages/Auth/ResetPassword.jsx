import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordRequest } from "../../api/auth.js";
import { resetPasswordSchema } from "./schemas.js";

const inputCls =
  "w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none";

const FRIENDLY_MESSAGES = {
  "Invalid or expired token":
    "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
  "Validation failed": "Dữ liệu đặt lại mật khẩu không hợp lệ",
};

const ResetPassword = () => {
  // Token can arrive as a query param (?token=...) or a path param (:token).
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = pathToken || searchParams.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", password_confirmation: "" },
  });

  const onSubmit = async (data) => {
    if (!token) return;
    setLoading(true);
    try {
      await resetPasswordRequest({
        token,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      setDone(true);
    } catch (error) {
      const resp = error.response?.data;
      const serverMessage =
        resp?.errors?.password?.[0] ||
        resp?.errors?.token?.[0] ||
        resp?.message ||
        "";
      setError("root.server", {
        message:
          FRIENDLY_MESSAGES[serverMessage] ||
          serverMessage ||
          "Không đặt lại được mật khẩu, vui lòng thử lại",
      });
    } finally {
      setLoading(false);
    }
  };

  const serverError = errors.root?.server?.message;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 space-y-4"
    >
      <h1 className="text-xl font-bold">Đặt lại mật khẩu</h1>

      {done ? (
        <>
          <p
            data-testid="reset-status"
            role="status"
            className="text-sm rounded-xl bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-3 py-2"
          >
            Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
          </p>
          <Link
            to="/login"
            className="block w-full rounded-xl bg-black text-white dark:bg-white dark:text-black py-2 font-semibold text-center"
          >
            Đăng nhập
          </Link>
        </>
      ) : !token ? (
        <p
          data-testid="reset-status"
          role="alert"
          className="text-sm text-red-600"
        >
          Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn
        </p>
      ) : (
        <>
          <p className="text-sm text-neutral-500">
            Nhập mật khẩu mới để đặt lại mật khẩu của bạn.
          </p>

          {serverError && (
            <p role="alert" className="text-sm text-red-600">
              {serverError}
            </p>
          )}

          <div>
            <input
              type="password"
              placeholder="Mật khẩu mới"
              required
              autoComplete="new-password"
              className={inputCls}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-600 mt-1">
                {errors.password.message}
              </p>
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
              <p className="text-sm text-red-600 mt-1">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full rounded-xl bg-black text-white dark:bg-white dark:text-black py-2 font-semibold disabled:opacity-40"
          >
            {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
          </button>
        </>
      )}

      <p className="text-sm text-center text-neutral-500">
        <Link to="/login" className="font-semibold hover:underline">
          Về trang đăng nhập
        </Link>
      </p>
    </form>
  );
};

export default ResetPassword;
