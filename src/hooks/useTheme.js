import { useEffect, useState } from "react";

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem("threads-theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // ignore
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    try {
      localStorage.setItem("threads-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}
