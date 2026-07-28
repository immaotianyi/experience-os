/**
 * client — API 客户端基础工具。
 *
 * 核心职责：
 *   - 提供 getJson/postJson 两个通用 HTTP 请求函数
 *   - 统一设置 Accept/content-type 头，自动解析 JSON
 *   - 非 2xx 响应或 d.error 时抛出 Error
 */

export async function getJson(url, { signal } = {}) {
  const r = await fetch(url, { signal, headers: { "Accept": "application/json" } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error ?? `请求失败: ${url} (${r.status})`);
  return d;
}

export async function postJson(url, body, { signal } = {}) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error ?? `请求失败: ${url} (${r.status})`);
  return d;
}
