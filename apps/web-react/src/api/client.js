/**
 * API client — base fetch helpers.
 * Mirrors the getJson/postJson pattern from the native app.js.
 */

export async function getJson(url) {
  const r = await fetch(url);
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error ?? `请求失败: ${url} (${r.status})`);
  return d;
}

export async function postJson(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {})
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error ?? `请求失败: ${url} (${r.status})`);
  return d;
}
