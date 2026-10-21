import { Link } from "react-router";
import { Bell, Home, PlusSquare, Search, User } from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Trang chủ", to: "/", icon: Home, active: true },
  { id: "search", label: "Tìm kiếm", to: "/search", icon: Search },
  { id: "create", label: "Tạo bài", to: "/create", icon: PlusSquare },
  { id: "activity", label: "Hoạt động", to: "/activity", icon: Bell },
  { id: "profile", label: "Trang cá nhân", to: "/profile", icon: User },
];

// Icon-only navigation for small screens (the desktop sidebar is hidden there).
const MobileNav = () => (
  <nav
    data-testid="mobile-tabbar"
    className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#101010]/95 backdrop-blur py-2"
  >
    {NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      return (
        <Link
          key={item.id}
          to={item.to}
          data-testid={`mobile-nav-${item.id}`}
          aria-label={item.label}
          aria-current={item.active ? "page" : undefined}
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            item.active
              ? "text-neutral-900 dark:text-neutral-100"
              : "text-neutral-500"
          }`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </Link>
      );
    })}
  </nav>
);

export default MobileNav;
