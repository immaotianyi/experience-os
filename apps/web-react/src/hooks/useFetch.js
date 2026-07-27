/**
 * useFetch — generic GET hook with loading/error/refresh.
 * Uses AbortController to cancel stale requests when URL changes.
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
    // Reset data when URL changes to prevent stale data flicker
    setData(options.initial ?? null);
    urlRef.current = url;
    refresh();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [url, refresh]);

  return { data, loading, error, refresh, setData };
}
