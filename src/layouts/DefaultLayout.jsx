import { Link, Outlet } from "react-router";
import useAuthStore, { selectIsAuthenticated } from "../stores/authStore.js";
import Sidebar from "../components/layout/Sidebar.jsx";
import LoginPanel from "../components/layout/LoginPanel.jsx";
import SuggestPanel from "../components/layout/SuggestPanel.jsx";
import LoginBanner from "../components/layout/LoginBanner.jsx";

// App shell: navigation on the left, page content in the middle and the
// right column (suggestions / login) on large screens.
const DefaultLayout = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return (
    <div
      data-testid="threads-home"
      className="min-h-screen bg-white text-neutral-900 dark:bg-[#101010] dark:text-neutral-100"
    >
      <Sidebar />

      <div className="md:pl-[76px] lg:pl-[260px]">
        <div className="mx-auto flex max-w-[1080px] justify-center gap-3.5 px-4">
          <div className="w-full max-w-[640px] min-w-0">
            <Outlet />
          </div>

          <div className="pt-14">
            <div className="sticky top-17">
              {isAuthenticated ? <SuggestPanel /> : <LoginPanel />}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom login banner is mobile-only now; desktop uses the right panel */}
      {!isAuthenticated && (
        <div className="md:hidden">
          <LoginBanner />
        </div>
      )}
    </div>
  );
};

export default DefaultLayout;
