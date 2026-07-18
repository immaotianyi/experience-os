/**
 * useTheme — light/dark theme with localStorage persistence.
 */
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "eos-theme";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || "light";
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => prev === "light" ? "dark" : "light");
  }, []);

  return { theme, toggle };
}
