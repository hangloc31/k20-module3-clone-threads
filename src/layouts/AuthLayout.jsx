import { Link, Outlet } from "react-router";
import ThreadsLogo from "../components/threads/ThreadsLogo.jsx";
import ThemeToggle from "../components/threads/ThemeToggle.jsx";

// Shared shell for auth screens (/login, later /register, /forgot-password):
// centered column, logo on top, theme toggle top-right, page via Outlet.
const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col gap-5 items-center justify-center bg-neutral-100 dark:bg-neutral-950 px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle variant="icon" testId="theme-toggle-login" />
      </div>

      <Link to="/" aria-label="Threads home">
        <ThreadsLogo className="w-auto h-10" />
      </Link>
      <Outlet />
    </div>
  );
};

export default AuthLayout;
