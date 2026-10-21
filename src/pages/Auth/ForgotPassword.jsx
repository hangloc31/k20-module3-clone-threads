import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordRequest } from "../../api/auth.js";
import { forgotPasswordSchema } from "./schemas.js";

const inputCls =
  "w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 outline-none";

// Message shown for every outcome on purpose: revealing which emails exist
// would leak the user list.
const GENERIC_MESSAGE =
  "Nếu email này đã đăng ký, chúng tôi đã gửi link đặt lại mật khẩu tới hộp thư của bạn.";

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await forgotPasswordRequest({ email: data.email.trim() });
      setSent(true);
    } catch (error) {
      const status = error.response?.status;
      if (status === 422) {
        // Email chưa đăng ký — vẫn hiện thông báo chung.
        setSent(true);
      } else {
        setError("root.server", {
          message:
            error.response?.data?.message ||
            "Không gửi được email đặt lại mật khẩu, vui lòng thử lại",
        });
      }
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
      <h1 className="text-xl font-bold">Quên mật khẩu</h1>

      {sent ? (
        <p
          data-testid="forgot-status"
          role="status"
          className="text-sm rounded-xl bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-3 py-2"
        >
          {GENERIC_MESSAGE}
        </p>
      ) : (
        <>
          <p className="text-sm text-neutral-500">
            Nhập email của bạn, chúng tôi sẽ gửi link để đặt lại mật khẩu.
          </p>

          {serverError && (
            <p role="alert" className="text-sm text-red-600">
              {serverError}
            </p>
          )}

          <div>
            <input
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
              className={inputCls}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full rounded-xl bg-black text-white dark:bg-white dark:text-black py-2 font-semibold disabled:opacity-40"
          >
            {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
          </button>
        </>
      )}

      <p className="text-sm text-center text-neutral-500">
        Đã nhớ mật khẩu?{" "}
        <Link to="/login" className="font-semibold hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
};

export default ForgotPassword;
