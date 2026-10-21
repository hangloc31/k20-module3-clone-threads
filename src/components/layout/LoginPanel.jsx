import { Link } from "react-router";

// Right-hand panel shown to guests: "Đăng nhập để xem thêm".
const LoginPanel = () => (
  <aside
    data-testid="login-panel"
    className="hidden lg:block w-[320px] shrink-0"
  >
    <div className="sticky top-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] p-5 space-y-4">
      <h2 className="text-[16px] font-bold">Đăng nhập để xem thêm</h2>
      <p className="text-sm text-neutral-500">
        Đăng nhập để xem toàn bộ bài viết, trả lời bình luận và theo dõi những
        người bạn quan tâm.
      </p>
      <Link
        to="/login"
        data-testid="panel-login-btn"
        className="block w-full rounded-xl bg-black text-white dark:bg-white dark:text-black py-2 font-semibold text-center"
      >
        Đăng nhập
      </Link>
      <Link
        to="/register"
        data-testid="panel-register-btn"
        className="block w-full rounded-xl border border-neutral-300 dark:border-neutral-700 py-2 font-semibold text-center hover:bg-neutral-50 dark:hover:bg-neutral-800"
      >
        Tạo tài khoản
      </Link>
    </div>
  </aside>
);

export default LoginPanel;
