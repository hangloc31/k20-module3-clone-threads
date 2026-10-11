import { Link, useLocation } from "react-router";
import ThreadsLogo from "../components/threads/ThreadsLogo.jsx";
import ThemeToggle from "../components/threads/ThemeToggle.jsx";

const NotFound = () => {
  const { pathname } = useLocation();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white text-neutral-900 dark:bg-[#101010] dark:text-neutral-100 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="icon" testId="theme-toggle-404" />
      </div>

      {/* Ghost numerals backdrop */}
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute font-black leading-none tracking-tighter text-neutral-100 dark:text-neutral-900 text-[38vw] md:text-[24rem]"
      >
        404
      </span>

      <main className="relative flex flex-col items-center text-center max-w-md">
        <ThreadsLogo
          variant="glyph"
          className="w-14 h-14 text-neutral-400 dark:text-neutral-600 animate-thread-float"
        />
        <h1 className="mt-6 text-2xl font-bold">Trang này không tồn tại</h1>
        <p className="mt-2 text-[15px] text-neutral-500">
          Sợi chỉ này bị đứt rồi.
        </p>
        <p className="mt-1 text-sm text-neutral-500 break-all">
          Không tìm thấy{" "}
          <code className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 font-mono text-[13px]">
            &quot;{pathname}&quot;
          </code>
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 w-full">
          <Link
            to="/"
            className="w-full sm:w-auto rounded-xl bg-black text-white dark:bg-white dark:text-black px-8 py-2.5 text-[15px] font-bold transition-transform active:scale-95"
          >
            Về trang chủ
          </Link>
          <Link
            to="/login"
            className="text-sm text-neutral-500 hover:underline"
          >
            Đăng nhập
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
