import { useState } from "react";
import { resendVerificationEmailRequest } from "../../api/auth.js";
import useAuthStore, {
  selectIsAuthenticated,
  selectIsEmailVerified,
} from "../../stores/authStore.js";

// Shown while the signed-in account has not verified its email yet
// (email_verified_at === null).
const VerifyEmailBanner = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isVerified = useAuthStore(selectIsEmailVerified);
  const user = useAuthStore((s) => s.user);

  const [state, setState] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");

  if (!isAuthenticated || isVerified) return null;

  const resend = async () => {
    setState("sending");
    setError("");
    try {
      await resendVerificationEmailRequest();
      setState("sent");
    } catch (err) {
      setState("idle");
      setError(
        err.response?.data?.message ||
          "Không gửi lại được email xác thực, vui lòng thử lại",
      );
    }
  };

  return (
    <div
      data-testid="verify-email-banner"
      className="rounded-2xl mb-2 border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 space-y-2"
    >
      <p className="text-sm text-amber-900 dark:text-amber-200">
        Email của bạn chưa được xác thực. Chúng tôi đã gửi link xác thực tới{" "}
        <span className="font-semibold break-all">{user?.email}</span> — hãy
        kiểm tra hộp thư hoặc gửi lại link.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="resend-verification"
          onClick={resend}
          disabled={state === "sending"}
          className="rounded-xl border border-amber-400 dark:border-amber-700 px-3 py-1.5 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/50 disabled:opacity-50"
        >
          {state === "sending"
            ? "Đang gửi lại..."
            : state === "sent"
              ? "Đã gửi lại"
              : "Gửi lại email xác thực"}
        </button>

        {state === "sent" && (
          <p
            data-testid="resend-status"
            role="status"
            className="text-xs text-amber-800 dark:text-amber-200"
          >
            Đã gửi lại email xác thực, vui lòng kiểm tra email.
          </p>
        )}

        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailBanner;
