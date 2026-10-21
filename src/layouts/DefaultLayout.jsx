import { Outlet } from "react-router";
import useAuthStore, { selectIsAuthenticated } from "../stores/authStore.js";
import Sidebar from "../components/layout/Sidebar.jsx";
import MobileNav from "../components/layout/MobileNav.jsx";
import LoginPanel from "../components/layout/LoginPanel.jsx";

// App shell: icon-only sidebar on the left, page content in the middle and
// the login panel on the right for guests.
const DefaultLayout = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return (
    <div
      data-testid="threads-home"
      className="min-h-screen bg-white text-neutral-900 dark:bg-[#101010] dark:text-neutral-100"
    >
      <Sidebar />

      <div className="md:pl-20">
        <div className="mx-auto flex max-w-[1080px] justify-center gap-6 px-4">
          <main className="w-full max-w-[640px] min-w-0 pb-20 md:pb-0">
            <Outlet />
          </main>

          {!isAuthenticated && <LoginPanel />}
        </div>
      </div>

      <MobileNav />
    </div>
  );
};

export default DefaultLayout;
