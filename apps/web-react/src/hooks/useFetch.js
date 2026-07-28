/**
 * useFetch — 带 AbortController 的通用数据获取 Hook。
 *
 * 核心职责：
 *   - 封装 GET 请求，返回 { data, loading, error, refresh, setData }
 *   - URL 变化时自动取消旧请求，防止竞态（stale data overwrite）
 *   - 重取时保留旧数据（stale-while-revalidate），避免骨架屏闪烁
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { getJson } from "../api/client.js";

export function useFetch(url, options = {}) {
  const [data, setData] = useState(options.initial ?? null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);
  const urlRef = useRef(url);
  const abortRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!urlRef.current) {
      setLoading(false);
      return;
    }
    // Abort previous in-flight request to prevent stale data overwriting
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await getJson(urlRef.current, { signal: controller.signal });
      if (!controller.signal.aborted) setData(result);
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Keep stale data visible during refetch (stale-while-revalidate) instead
    // of clearing to null, which caused a full skeleton-screen flash on every
    // refresh. Only set loading=true; the old data stays on screen until the
    // new data arrives, then swaps in seamlessly.
    urlRef.current = url;
    setLoading(true);
    refresh();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [url, refresh]);

  return { data, loading, error, refresh, setData };
}
