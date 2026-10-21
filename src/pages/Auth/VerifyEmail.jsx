import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { verifyEmailRequest } from "../../api/auth.js";

// Backend messages are English — map the known ones to Vietnamese.
const FRIENDLY_MESSAGES = {
  "Invalid verification token":
    "Link xác thực không hợp lệ hoặc đã hết hạn",
  "Validation failed": "Link xác thực không hợp lệ hoặc đã hết hạn",
};

const cardCls =
  "w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 space-y-4 text-center";

const VerifyEmail = () => {
  // Token can arrive as a path param (/verify-email/:token) or a query
  // param (/verify-email?token=...).
  const { token: pathToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = pathToken || searchParams.get("token") || "";

  const [status, setStatus] = useState("pending"); // pending | success | error
  const [message, setMessage] = useState("");

  // StrictMode runs effects twice in dev — the ref guard keeps the API to a
  // single call per token (the first effect run owns the request).
  const requestedToken = useRef(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Link xác thực không hợp lệ hoặc đã hết hạn");
      return undefined;
    }
    if (requestedToken.current === token) return undefined;
    requestedToken.current = token;

    setStatus("pending");
    setMessage("");

    verifyEmailRequest({ token })
      .then(() => {
        setStatus("success");
      })
      .catch((error) => {
        setStatus("error");
        const resp = error.response?.data;
        const serverMessage = resp?.errors?.token?.[0] || resp?.message || "";
        setMessage(
          FRIENDLY_MESSAGES[serverMessage] ||
            serverMessage ||
            "Không xác thực được email, vui lòng thử lại link mới nhận",
        );
      });

    return undefined;
  }, [token]);

  return (
    <div className={cardCls}>
      <h1 className="text-xl font-bold">Xác thực email</h1>

      {status === "pending" && (
        <p
          data-testid="verify-status"
          role="status"
          className="text-sm text-neutral-500"
        >
          Đang xác thực email...
        </p>
      )}

      {status === "success" && (
        <>
          <p
            data-testid="verify-status"
            role="status"
            className="text-sm rounded-xl bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-3 py-2"
          >
            Email đã được xác thực thành công. Bạn có thể đăng nhập ngay bây
            giờ.
          </p>
          <Link
            to="/login"
            className="block w-full rounded-xl bg-black text-white dark:bg-white dark:text-black py-2 font-semibold"
          >
            Đăng nhập
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <p
            data-testid="verify-status"
            role="alert"
            className="text-sm text-red-600"
          >
            {message}
          </p>
          <Link
            to="/login"
            className="block w-full rounded-xl border border-neutral-300 dark:border-neutral-700 py-2 font-semibold hover:opacity-80"
          >
            Về trang đăng nhập
          </Link>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;
