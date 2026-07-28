/**
 * main — React 应用入口。
 *
 * 核心职责：
 *   - 创建 React 根节点并挂载 App 组件到 #root
 *   - 启用 StrictMode 进行开发期额外检查
 *   - 引入全局样式 styles.css
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
