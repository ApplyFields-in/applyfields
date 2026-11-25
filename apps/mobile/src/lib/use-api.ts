/** GET a path, re-fetch when it (or the language) changes, pull-to-refresh. */
import { useFocusEffect } from 'expo-router';
import { Directory, File, Paths } from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api, type ApiResponse } from './api';
import { cacheable, cacheFileName } from './cacheable';
import { useLocale } from './locale';

/**
 * Last successful body per language + path. In memory for the session, and on
 * disk (app cache dir) for public lists and detail pages (see cacheable.ts), so
 * a cold open on a slow or dead connection shows the last feed at once while the
 * fresh one loads. If the fetch fails, the saved copy stays with `stale` set.
 */
const lastGood = new Map<string, unknown>();
const cacheDir = new Directory(Paths.cache, 'api');
const MAX_FILES = 60;

function readCached(key: string): unknown {
  if (lastGood.has(key)) return lastGood.get(key);
  if (!cacheable(key.slice(key.indexOf('|') + 1))) return undefined;
  try {
    const file = new File(cacheDir, cacheFileName(key));
    if (!file.exists) return undefined;
    const saved = JSON.parse(file.textSync()) as { key: string; data: unknown };
    if (saved.key !== key) return undefined; // hash collision: refetch instead
    lastGood.set(key, saved.data);
    return saved.data;
  } catch {
    return undefined;
  }
}

function writeCached(key: string, path: string, data: unknown): void {
  lastGood.set(key, data);
  if (!cacheable(path)) return;
  try {
    if (!cacheDir.exists) cacheDir.create({ intermediates: true });
    new File(cacheDir, cacheFileName(key)).writeSync(JSON.stringify({ key, data }));
    const files = cacheDir.list().filter((f): f is File => f instanceof File);
    if (files.length > MAX_FILES) {
      files
        .sort((a, b) => (a.modificationTime ?? 0) - (b.modificationTime ?? 0))
        .slice(0, files.length - MAX_FILES)
        .forEach((f) => f.delete());
    }
  } catch {
    // A full or read-only disk only costs the offline copy.
  }
}

/** On sign-out: signed-in lists carry the user's saved flags, so a shared phone shouldn't keep them. */
export function clearApiCache(): void {
  lastGood.clear();
  try {
    if (cacheDir.exists) cacheDir.delete();
  } catch {
    // nothing to clear
  }
}

export function useApi<T>(path: string | null) {
  const { locale } = useLocale();
  const key = path === null ? null : `${locale}|${path}`;
  const [data, setData] = useState<T | null>(() => (key ? ((readCached(key) as T) ?? null) : null));
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(path !== null);
  const [refreshing, setRefreshing] = useState(false);

  const apply = useCallback((res: ApiResponse<T>, key: string, path: string) => {
    if (res.data !== null) {
      writeCached(key, path, res.data);
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
  }, []);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (path === null || key === null) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      apply(await api.get<T>(path), key, path);
      setLoading(false);
      setRefreshing(false);
    },
    [path, key, apply],
  );

  useEffect(() => {
    let live = true;
    if (path === null || key === null) {
      setLoading(false);
      return;
    }
    // New path or language: show its saved copy (if any) straight away, then fetch.
    setData((readCached(key) as T) ?? null);
    setStale(false);
    setLoading(true);
    void (async () => {
      const res = await api.get<T>(path);
      if (!live) return;
      apply(res, key, path);
      setLoading(false);
    })();
    return () => {
      live = false;
    };
  }, [path, key, apply]);

  // A saved copy on screen means no spinner while the fresh one loads.
  return { data, error, stale, loading: loading && data === null, refreshing, refresh: () => load(true), setData };
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
