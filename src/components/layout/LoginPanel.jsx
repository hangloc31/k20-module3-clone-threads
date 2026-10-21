import { Link } from "react-router";

// Right-hand card for guests: title + description + login button +
// username-login link + legal footer (mirrors the screenshot frame).
const LoginPanel = () => (
  <aside className="hidden lg:block w-[360px] shrink-0">
    <div
      data-testid="threads-login-panel"
      className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-8 text-center"
    >
      <h2 className="text-[22px] leading-8 font-bold">
        Đăng nhập hoặc đăng ký Threads
      </h2>
      <p className="mt-3 text-[15px] leading-6 text-neutral-500">
        Xem mọi người đang nói về điều gì và tham gia cuộc trò chuyện.
      </p>
      <Link
        to="/login"
        data-testid="panel-login-btn"
        className="mt-6 flex items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 px-4 py-3.5 text-[15px] font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700"
      >
        Đăng nhập
      </Link>
      <Link
        to="/login"
        data-testid="panel-username-login"
        className="mt-5 inline-block text-[15px] text-neutral-500 hover:underline"
      >
        Đăng nhập bằng tên người dùng
      </Link>
    </div>

    <footer className="mt-4 px-4 text-center text-[13px] leading-5 text-neutral-500">
      <p className="flex items-center justify-center gap-2">
        <span>© 2026</span>
        <a
          className="hover:underline"
          href="https://help.instagram.com/769983657850450"
        >
          Điều khoản của Threads
        </a>
      </p>
      <p className="flex items-center justify-center gap-2">
        <a
          className="hover:underline"
          href="https://help.instagram.com/515230437301944"
        >
          Chính sách quyền riêng tư
        </a>
        <a
          className="hover:underline"
          href="https://help.instagram.com/1896641480634370/"
        >
          Chính sách cookie
        </a>
      </p>
      <p>
        <button type="button" className="hover:underline">
          Báo cáo sự cố
        </button>
      </p>
    </footer>
  </aside>
);

export default LoginPanel;
