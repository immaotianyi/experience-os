/**
 * API client — base fetch helpers.
 * Mirrors the getJson/postJson pattern from the native app.js.
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
