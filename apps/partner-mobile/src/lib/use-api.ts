/** GET a path, re-fetch on focus and on pull-to-refresh. */
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from './api';

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [refreshing, setRefreshing] = useState(false);
  const live = useRef(true);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (path === null) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      const res = await api.get<T>(path);
      if (!live.current) return;
      // A failed re-fetch keeps what is on screen; the error shows only when there is nothing.
      if (res.data !== null) {
        setData(res.data);
        setError(null);
      } else setError(res.error);
      setLoading(false);
      setRefreshing(false);
    },
    [path],
  );

  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  // Runs on first focus too, so this is also the initial load. Coming back to a
  // tab after acting on a booking shows the new state.
  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  return { data, error, loading, refreshing, refresh: () => load(true), setData };
}

/** Run `fn` every `ms` while the screen is focused (chat polling). */
export function usePoll(fn: () => void, ms: number): void {
  const ref = useRef(fn);
  ref.current = fn;
  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => ref.current(), ms);
      return () => clearInterval(id);
    }, [ms]),
  );
}
