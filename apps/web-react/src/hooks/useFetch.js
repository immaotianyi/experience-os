/**
 * useFetch — generic GET hook with loading/error/refresh.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { getJson } from "../api/client.js";

export function useFetch(url, options = {}) {
  const [data, setData] = useState(options.initial ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const urlRef = useRef(url);

  const refresh = useCallback(async () => {
    if (!urlRef.current) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getJson(urlRef.current);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    urlRef.current = url;
    refresh();
  }, [url, refresh]);

  return { data, loading, error, refresh, setData };
}
