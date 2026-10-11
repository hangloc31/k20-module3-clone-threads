import useTheme from "../../hooks/useTheme.js";

// Shared light/dark toggle used on every screen (desktop sidebar menu,
// tablet rail, mobile header, login page). Theme itself stays in
// useTheme (documentElement class + localStorage), so a change anywhere
// applies everywhere.
export default function ThemeToggle({
  variant = "icon",
  testId = "theme-toggle",
  className = "",
}) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const label = `Chuyển sang chế độ ${dark ? "sáng" : "tối"}`;

  if (variant === "menu-item") {
    return (
      <button
        type="button"
        onClick={toggle}
        data-testid={testId}
        aria-label={label}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 ${className}`}
      >
        Chế độ {dark ? "sáng" : "tối"}
        <span aria-hidden="true">{dark ? "☀" : "☾"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      data-testid={testId}
      aria-label={label}
      aria-pressed={dark}
      className={`p-2.5 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white ${className}`}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
