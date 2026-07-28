/**
 * platform — 平台兼容/健康 API。
 *
 * 核心职责：
 *   - 查询各平台（VS Code、JetBrains、Web 等）的健康状态
 *   - 启动指定平台的适配服务
 */
import { getJson, postJson } from "./client.js";

export const fetchPlatformHealth = () =>
  getJson("/api/platforms");

export const startPlatform = (name, options = {}) =>
  postJson(`/api/platforms/${encodeURIComponent(name)}/start`, options);
