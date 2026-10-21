import { Link } from "react-router";

// Bottom login banner for guests on small screens.
const LoginBanner = () => (
  <div
    data-testid="threads-login-banner"
    className="fixed bottom-0 left-0 right-0 z-30 md:left-[76px] border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur"
  >
    <div className="mx-auto max-w-[640px] px-4 py-3 flex items-center gap-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[15px] truncate">
          Log in or sign up for Threads
        </p>
        <p className="text-neutral-500 text-[13px] truncate">
          See what people are talking about and join the conversation.
        </p>
      </div>
      <Link
        to="/login"
        data-testid="banner-login-btn"
        className="shrink-0 rounded-xl border border-neutral-300 dark:border-neutral-700 px-5 py-2 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-900"
      >
        Log in
      </Link>
    </div>
    {/* mobile tabbar offset */}
    <div className="h-[57px] md:hidden" aria-hidden="true" />
  </div>
);

export default LoginBanner;
