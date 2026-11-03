/** GET a path, re-fetch when it (or the language) changes, pull-to-refresh. */
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api, type ApiResponse } from './api';
import { useLocale } from './locale';

/**
 * Last successful body per path, in memory. When a fetch fails (flaky network,
 * airplane mode mid-session) we fall back to this so the screen shows the last
 * feed instead of "Could not load". Lives for the session only.
 * ponytail: in-memory, survives navigation but not a cold start; a persistent
 * cache (AsyncStorage) would also cover the first open with no connection.
 */
const lastGood = new Map<string, unknown>();

export function useApi<T>(path: string | null) {
  const { locale } = useLocale();
  const [data, setData] = useState<T | null>(() => (path ? (lastGood.get(path) as T) ?? null : null));
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(path !== null);
  const [refreshing, setRefreshing] = useState(false);

  const apply = useCallback(
    (res: ApiResponse<T>, key: string) => {
      if (res.data !== null) {
        lastGood.set(key, res.data);
        setData(res.data);
        setError(null);
        setStale(false);
      } else if (lastGood.has(key)) {
        setData(lastGood.get(key) as T); // offline: keep showing what we had
        setError(null);
        setStale(true);
      } else {
        setData(null);
        setError(res.error);
        setStale(false);
      }
    },
    [],
  );

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (path === null) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      apply(await api.get<T>(path), path);
      setLoading(false);
      setRefreshing(false);
    },
    [path, apply],
  );

  useEffect(() => {
    let live = true;
    setLoading(true);
    void (async () => {
      if (path === null) {
        setLoading(false);
        return;
      }
      const res = await api.get<T>(path);
      if (!live) return;
      apply(res, path);
      setLoading(false);
    })();
    return () => {
      live = false;
    };
    // locale: re-fetch so content comes back in the newly chosen language.
  }, [path, locale, apply]);

  return { data, error, stale, loading, refreshing, refresh: () => load(true), setData };
}

/** A value that only updates after it has been still for `ms` — real keystroke debounce. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return settled;
}

/** Run `fn` each time the screen comes into focus (e.g. re-fetch Saved/Alerts). */
export function useRefreshOnFocus(fn: () => void): void {
  const ref = useRef(fn);
  ref.current = fn;
  useFocusEffect(
    useCallback(() => {
      ref.current();
    }, []),
  );
}
