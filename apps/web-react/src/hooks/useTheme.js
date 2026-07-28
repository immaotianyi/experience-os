/**
 * useTheme — 明/暗主题切换 Hook。
 *
 * 核心职责：
 *   - 管理 light/dark 主题状态，持久化到 localStorage
 *   - 切换时更新 <html data-theme> 属性驱动 CSS 变量
 *   - 提供 toggle() 方法在两种主题间切换
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
