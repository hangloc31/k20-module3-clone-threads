import { useState } from "react";
import { Link, useLocation } from "react-router";
import ThreadsLogo from "./ThreadsLogo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const iconCls = "w-6 h-6";

const Icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={iconCls}>
      <path d="M12 3l9 8h-2v9h-5v-6h-4v6H5v-9H3l9-8Z" />
    </svg>
  ),
  homeOutline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconCls}>
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  create: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconCls}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconCls}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" strokeLinecap="round" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconCls}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconCls}>
      <path d="M12 20s-7-4.3-9-9c-1.2-2.8.5-6 3.5-6 2 0 3.5 1.2 4.2 2.6h2.6C14 6.2 15.5 5 17.5 5c3 0 4.7 3.2 3.5 6-2 4.7-9 9-9 9Z" strokeLinejoin="round" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconCls}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
    </svg>
  ),
  insights: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconCls}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 17v-5M12 17V7M16 17v-8" strokeLinecap="round" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  ),
};

// Order mirrors the screenshot: Trang chủ, Thread mới, Tìm kiếm,
// Tin nhắn, Hoạt động, Trang cá nhân, Thông tin chi tiết.
const items = [
  { key: "home", label: "Trang chủ", to: "/", icon: Icons.homeOutline, activeIcon: Icons.home },
  { key: "create", label: "Thread mới", to: "/login", icon: Icons.create },
  { key: "search", label: "Tìm kiếm", to: "/search", icon: Icons.search },
  { key: "messages", label: "Tin nhắn", to: "/login", icon: Icons.messages },
  { key: "activity", label: "Hoạt động", to: "/login", icon: Icons.activity },
  { key: "profile", label: "Trang cá nhân", to: "/login", icon: Icons.profile },
  { key: "insights", label: "Thông tin chi tiết", to: "/login", icon: Icons.insights },
];

export default function LeftNav() {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* Desktop full sidebar (matches screenshot) */}
      <aside
        data-testid="threads-sidebar"
        className="hidden lg:flex fixed left-0 top-0 h-screen w-[260px] flex-col px-4 py-6 z-40 bg-white text-neutral-900 dark:bg-[#101010] dark:text-neutral-100"
      >
        <Link to="/" aria-label="Threads home" className="px-2">
          <ThreadsLogo variant="full" className="h-7 w-auto" />
        </Link>

        <nav aria-label="Primary" className="mt-8 flex flex-col gap-1">
          {items.map((it) => {
            const active = it.key === "home" && pathname === "/";
            return (
              <Link
                key={it.key}
                to={it.to}
                aria-label={it.label}
                aria-current={active ? "page" : undefined}
                data-testid={`nav-${it.key}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-colors ${
                  active
                    ? "bg-neutral-100 dark:bg-neutral-800 font-bold"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-900 font-medium"
                }`}
              >
                {active && it.activeIcon ? it.activeIcon : it.icon}
                {it.label}
              </Link>
            );
          })}
        </nav>

        <Link
          to="/login"
          data-testid="sidebar-login-btn"
          className="mt-6 flex items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 py-2.5 text-[15px] font-bold"
        >
          Đăng nhập
        </Link>

        <div className="flex-1" />

        <div className="relative">
          {moreOpen && (
            <div
              data-testid="more-menu"
              className="absolute bottom-12 left-0 w-60 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2 shadow-xl"
            >
              <ThemeToggle variant="menu-item" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-label="Xem thêm"
            data-testid="nav-more"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 w-full"
          >
            {Icons.more}
            Xem thêm
          </button>
        </div>
      </aside>

      {/* Tablet icon rail */}
      <nav
        data-testid="threads-leftnav"
        aria-label="Primary compact"
        className="hidden md:flex lg:hidden fixed left-0 top-0 h-screen w-[76px] flex-col items-center justify-between py-5 bg-white dark:bg-black border-r border-neutral-200 dark:border-neutral-800 z-40"
      >
        <Link to="/" aria-label="Threads home">
          <ThreadsLogo variant="glyph" className="w-7 h-7" />
        </Link>

        <div className="flex flex-col items-center gap-1">
          {items.map((it) => (
            <Link
              key={it.key}
              to={it.to}
              title={it.label}
              aria-label={it.label}
              data-testid={`rail-${it.key}`}
              className="p-3 rounded-2xl transition-colors text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white"
            >
              {it.icon}
            </Link>
          ))}
        </div>

        <div className="flex flex-col items-center gap-1">
          <ThemeToggle variant="icon" testId="theme-toggle-rail" />
          <Link
            to="/login"
            data-testid="rail-login"
            className="rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-bold"
            aria-label="Đăng nhập"
            title="Đăng nhập"
          >
            →
          </Link>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        data-testid="threads-tabbar"
        aria-label="Primary mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-black/95 backdrop-blur px-2 py-2"
      >
        {items.slice(0, 6).map((it) => (
          <Link
            key={it.key}
            to={it.to}
            aria-label={it.label}
            data-testid={`tab-${it.key}`}
            className="p-2.5 text-neutral-500 hover:text-black dark:hover:text-white"
          >
            {it.icon}
          </Link>
        ))}
      </nav>
    </>
  );
}
