'use client';

import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

/** Phone/tablet menu: a button that slides the sidebar in from the left. */
export function MobileDrawer({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // the menu stays open only on the page where it was opened → navigating closes it
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const setOpen = (value: boolean) => setOpenedOn(value ? pathname : null);

  // close with the Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenedOn(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="clay-press grid size-10 place-items-center rounded-full bg-cream text-teal shadow-clay"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-teal/40"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-card">
            {children}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-6 grid size-9 place-items-center rounded-full bg-cream/10 text-cream"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
