import { Link } from "react-router";
import {
  Bell,
  Home,
  PlusSquare,
  Search,
  User,
} from "lucide-react";
import ThemeToggle from "../threads/ThemeToggle.jsx";

const NAV_ITEMS = [
  { id: "home", label: "Trang chủ", to: "/", icon: Home, active: true },
  { id: "search", label: "Tìm kiếm", to: "/search", icon: Search },
  { id: "create", label: "Tạo bài", to: "/create", icon: PlusSquare },
  { id: "activity", label: "Hoạt động", to: "/activity", icon: Bell },
  { id: "profile", label: "Trang cá nhân", to: "/profile", icon: User },
];

const iconBtn =
  "flex items-center justify-center rounded-full transition hover:bg-neutral-100 dark:hover:bg-neutral-800";

export const SidebarItems = NAV_ITEMS;

const Sidebar = () => {
  return (
    <aside
      data-testid="app-sidebar"
      className="hidden md:flex fixed inset-y-0 left-0 w-20 flex-col items-center gap-2 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#101010] py-4 z-30"
    >
      <Link to="/" aria-label="Threads home" className="mb-2">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 2.5c5 0 9.5 4 9.5 9 0 3-1.6 5.4-4 6.6v-4.1c1.4-.9 2.3-2.3 2.3-4 0-4.3-3.5-7.8-7.8-7.8S4.2 5.6 4.2 9.9c0 3.6 3.3 6.5 7.8 6.5v3.6c-5.9 0-10.5-4.4-10.5-10.1C1.5 6.5 6 2.5 12 2.5Z" />
        </svg>
      </Link>

      <nav className="flex flex-col items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              data-testid={`nav-${item.id}`}
              aria-label={item.label}
              aria-current={item.active ? "page" : undefined}
              className={`${iconBtn} h-11 w-11 ${
                item.active
                  ? "text-neutral-900 dark:text-neutral-100 font-bold"
                  : "text-neutral-500"
              }`}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-2">
        <ThemeToggle variant="icon" testId="theme-toggle-sidebar" />
      </div>
    </aside>
  );
};

export default Sidebar;
