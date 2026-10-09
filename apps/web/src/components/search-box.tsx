'use client';

import type { SearchResult, SearchSuggestResponse } from '@applyfields/types';
import { cn } from '@applyfields/ui';
import { ArrowUpRight, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type KeyboardEvent, useEffect, useId, useState } from 'react';
import { apiGet } from '@/lib/api';
import { Highlight, RESULT_META } from '@/lib/format';

type Navigable =
  | { kind: 'suggestion'; text: string; href: string }
  | { kind: 'item'; item: SearchResult; href: string };

/** Top-bar search with query suggestions, related searches and direct item previews while typing. */
export function SearchBox() {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [related, setRelated] = useState<string[]>([]);
  const [items, setItems] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setRelated([]);
      setItems([]);
      return;
    }

    let stale = false;
    const timer = setTimeout(async () => {
      const data = await apiGet<SearchSuggestResponse>(`/search/suggest?q=${encodeURIComponent(query)}&limit=5`);
      if (!stale) {
        setSuggestions(data?.suggestions ?? []);
        setRelated(data?.related ?? []);
        setItems(data?.items ?? []);
        setActive(-1);
      }
    }, 180);

    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [q]);

  // Combine suggestions and items into a flat navigable list for keyboard accessibility
  const navigableList: Navigable[] = [
    ...suggestions.map((s) => ({
      kind: 'suggestion' as const,
      text: s,
      href: `/search?q=${encodeURIComponent(s)}`,
    })),
    ...items.map((it) => ({
      kind: 'item' as const,
      item: it,
      href: it.url,
    })),
  ];

  const show =
    open &&
    q.trim().length >= 2 &&
    (suggestions.length > 0 || related.length > 0 || items.length > 0);

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!show) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, navigableList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && active >= 0 && navigableList[active]) {
      e.preventDefault();
      setOpen(false);
      router.push(navigableList[active].href);
    }
  }

  return (
    <form action="/search" role="search" className="relative hidden max-w-xl flex-1 sm:block">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-teal/80" aria-hidden="true" />
      <input
        name="q"
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        aria-label="Search ApplyFields"
        placeholder="Search jobs, exams, scholarships, services…"
        className="h-10 w-full rounded-full bg-cream pl-10 pr-4 text-sm shadow-pressed outline-none transition-shadow placeholder:text-teal/80 focus:shadow-clay"
      />

      {show && (
        <div
          id={listId}
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-2xl bg-cream p-2 shadow-clay"
        >
          {/* 1. Query Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal/60">
                Suggested searches
              </div>
              <ul className="space-y-0.5">
                {suggestions.map((s, idx) => {
                  const isCurActive = active === idx;
                  return (
                    <li key={`sug-${s}`} id={`${listId}-${idx}`} role="option" aria-selected={isCurActive}>
                      <Link
                        href={`/search?q=${encodeURIComponent(s)}`}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center justify-between rounded-xl px-3 py-2 text-sm text-teal hover:bg-tea',
                          isCurActive && 'bg-tea',
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <Search className="size-3.5 text-teal/70" />
                          <Highlight text={s} query={q} />
                        </span>
                        <ArrowUpRight className="size-3.5 text-teal/50" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* 2. Related Topic Pills */}
          {related.length > 0 && (
            <div className="mb-2 border-t border-line/60 px-3 pt-2">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal/60">
                <Sparkles className="size-3 text-teal" /> Related topics
              </div>
              <div className="flex flex-wrap gap-1.5">
                {related.map((rel) => (
                  <Link
                    key={`rel-${rel}`}
                    href={`/search?q=${encodeURIComponent(rel)}`}
                    onClick={() => setOpen(false)}
                    className="clay-press rounded-full bg-tea/60 px-2.5 py-1 text-xs font-semibold text-teal hover:bg-tea"
                  >
                    {rel}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 3. Direct Item Previews */}
          {items.length > 0 && (
            <div className="border-t border-line/60 pt-2">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal/60">
                Direct results
              </div>
              <ul className="space-y-0.5">
                {items.map((r, itemIdx) => {
                  const globalIdx = suggestions.length + itemIdx;
                  const isCurActive = active === globalIdx;
                  return (
                    <li key={r.url} id={`${listId}-${globalIdx}`} role="option" aria-selected={isCurActive}>
                      <Link
                        href={r.url}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'block rounded-xl px-3 py-2 hover:bg-tea',
                          isCurActive && 'bg-tea',
                        )}
                      >
                        <span className="line-clamp-1 text-sm font-semibold text-teal">
                          <Highlight text={r.title} query={q} />
                        </span>
                        <span className="line-clamp-1 text-xs text-teal/80">
                          {RESULT_META[r.type].label}
                          {r.subtitle && ` · ${r.subtitle}`}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
