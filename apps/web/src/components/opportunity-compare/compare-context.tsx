'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { OpportunityType } from '@applyfields/types';

export interface CompareItem {
  slug: string;
  title: string;
  organization: string;
  type: OpportunityType;
  vacancies?: number | null;
  location?: string;
  qualification?: string;
  salary_text?: string | null;
  application_end?: string | null;
  days_left?: number | null;
}

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => boolean;
  removeItem: (slug: string) => void;
  toggleItem: (item: CompareItem) => void;
  clear: () => void;
  hasItem: (slug: string) => boolean;
}

const CompareContext = createContext<CompareContextType | null>(null);

const STORAGE_KEY = 'applyfields_compare_items_v1';

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed.slice(0, 2));
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }
    setMounted(true);
  }, []);

  const save = useCallback((newItems: CompareItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch {
      // Ignore
    }
  }, []);

  const addItem = useCallback(
    (item: CompareItem): boolean => {
      if (items.some((i) => i.slug === item.slug)) return true;
      if (items.length >= 2) {
        // Replace second item if 2 are already present
        const next = [items[0], item];
        save(next);
        return true;
      }
      const next = [...items, item];
      save(next);
      return true;
    },
    [items, save],
  );

  const removeItem = useCallback(
    (slug: string) => {
      const next = items.filter((i) => i.slug !== slug);
      save(next);
    },
    [items, save],
  );

  const toggleItem = useCallback(
    (item: CompareItem) => {
      if (items.some((i) => i.slug === item.slug)) {
        removeItem(item.slug);
      } else {
        addItem(item);
      }
    },
    [items, addItem, removeItem],
  );

  const clear = useCallback(() => {
    save([]);
  }, [save]);

  const hasItem = useCallback(
    (slug: string) => {
      return items.some((i) => i.slug === slug);
    },
    [items],
  );

  return (
    <CompareContext.Provider
      value={{
        items: mounted ? items : [],
        addItem,
        removeItem,
        toggleItem,
        clear,
        hasItem,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    return {
      items: [],
      addItem: () => false,
      removeItem: () => {},
      toggleItem: () => {},
      clear: () => {},
      hasItem: () => false,
    };
  }
  return ctx;
}
