'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type PipMode = 'docked' | 'minimized';

/**
 * Opens the official application site in a real browser window, never inside ApplyFields: many
 * official portals (UPSC, NTA/NEET/JEE, APPSC, banks) refuse to load inside another site, and
 * logins, captchas and payments break in frames. `noopener` so the portal cannot reach back into
 * our tab. `from` = the window that holds the click (the floating helper's own window when the
 * button is pressed there).
 */
export function openOfficialSite(url: string, from: Window = window): void {
  const scr = from.screen;
  const width = Math.round(scr.availWidth * 0.62);
  from.open(url, '_blank', `noopener,noreferrer,popup,width=${width},height=${scr.availHeight},left=${scr.availWidth - width},top=0`);
}

export interface PipApplyTarget {
  title: string;
  applyUrl: string;
  slug?: string;
  notificationPdfUrl?: string | null;
}

export interface PipApplyContextValue {
  isOpen: boolean;
  mode: PipMode;
  target: PipApplyTarget | null;
  isDocPipSupported: boolean;
  isDocPipActive: boolean;
  pipWindow: Window | null;
  openPip: (target: PipApplyTarget) => void;
  closePip: () => void;
  setMode: (mode: PipMode) => void;
  openDocumentPip: (title?: string) => Promise<boolean>;
  closeDocumentPip: () => void;
}

const PipApplyContext = createContext<PipApplyContextValue | undefined>(undefined);

export function PipApplyProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PipMode>('docked');
  const [target, setTarget] = useState<PipApplyTarget | null>(null);
  const [isDocPipSupported, setIsDocPipSupported] = useState(false);
  const [isDocPipActive, setIsDocPipActive] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const docPipWindowRef = useRef<Window | null>(null);
  // openPip is defined before openDocumentPip; this ref hands it the latest one.
  const openDocumentPipRef = useRef<(title?: string) => Promise<boolean>>(async () => false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
      setIsDocPipSupported(true);
    }
  }, []);

  /**
   * Apply: where the browser can float a window on top (Chrome, Edge), the helper opens floating and
   * the person opens the official site from it, so the copier stays above the form. Elsewhere the
   * official site opens in its own window and the helper stays docked in this tab.
   */
  const openPip = useCallback((newTarget: PipApplyTarget) => {
    setTarget(newTarget);
    setMode('docked');
    setIsOpen(true);
    if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
      void openDocumentPipRef.current(newTarget.title);
    } else {
      openOfficialSite(newTarget.applyUrl);
    }
  }, []);

  const closePip = useCallback(() => {
    setIsOpen(false);
    if (docPipWindowRef.current && !docPipWindowRef.current.closed) {
      docPipWindowRef.current.close();
    }
    docPipWindowRef.current = null;
    setIsDocPipActive(false);
    setPipWindow(null);
  }, []);


  const closeDocumentPip = useCallback(() => {
    if (docPipWindowRef.current && !docPipWindowRef.current.closed) {
      docPipWindowRef.current.close();
    }
    docPipWindowRef.current = null;
    setIsDocPipActive(false);
    setPipWindow(null);
  }, []);

  const openDocumentPip = useCallback(async (title?: string): Promise<boolean> => {
    if (typeof window === 'undefined' || !('documentPictureInPicture' in window)) {
      return false;
    }

    try {
      if (docPipWindowRef.current && !docPipWindowRef.current.closed) {
        docPipWindowRef.current.focus();
        return true;
      }

      const pipWin = await (window as any).documentPictureInPicture.requestWindow({
        width: 440,
        height: 680,
      });

      const name = title ?? target?.title;
      pipWin.document.title = name ? `ApplyFields Apply helper — ${name}` : 'ApplyFields Apply helper';

      // Copy stylesheets
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          if (sheet.href) {
            const link = pipWin.document.createElement('link');
            link.rel = 'stylesheet';
            link.href = sheet.href;
            pipWin.document.head.appendChild(link);
          } else if (sheet.cssRules) {
            const style = pipWin.document.createElement('style');
            Array.from(sheet.cssRules).forEach((rule) => {
              style.appendChild(pipWin.document.createTextNode(rule.cssText));
            });
            pipWin.document.head.appendChild(style);
          }
        } catch {
          // ignore cross-origin sheet restriction
        }
      });

      pipWin.document.body.className =
        'bg-[#f8fafc] text-[#082046] font-sans antialiased m-0 p-0 overflow-y-auto';

      pipWin.addEventListener('pagehide', () => {
        docPipWindowRef.current = null;
        setIsDocPipActive(false);
        setPipWindow(null);
      });

      docPipWindowRef.current = pipWin;
      setPipWindow(pipWin);
      setIsDocPipActive(true);
      return true;
    } catch (err) {
      console.warn('[PipApplyContext] Document Picture-in-Picture window request failed:', err);
      return false;
    }
  }, [target]);

  useEffect(() => {
    openDocumentPipRef.current = openDocumentPip;
  }, [openDocumentPip]);

  return (
    <PipApplyContext.Provider
      value={{
        isOpen,
        mode,
        target,
        isDocPipSupported,
        isDocPipActive,
        pipWindow,
        openPip,
        closePip,
        setMode,
        openDocumentPip,
        closeDocumentPip,
      }}
    >
      {children}
    </PipApplyContext.Provider>
  );
}

export function usePipApply() {
  const ctx = useContext(PipApplyContext);
  if (!ctx) {
    throw new Error('usePipApply must be used within a PipApplyProvider');
  }
  return ctx;
}

