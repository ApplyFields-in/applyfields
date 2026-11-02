'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type PipMode = 'docked' | 'split' | 'minimized';

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
  toggleSplit: () => void;
  openDocumentPip: () => Promise<boolean>;
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

  useEffect(() => {
    if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
      setIsDocPipSupported(true);
    }
  }, []);

  const openPip = useCallback((newTarget: PipApplyTarget) => {
    setTarget(newTarget);
    setIsOpen(true);
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

  const toggleSplit = useCallback(() => {
    setMode((current) => (current === 'split' ? 'docked' : 'split'));
  }, []);

  const closeDocumentPip = useCallback(() => {
    if (docPipWindowRef.current && !docPipWindowRef.current.closed) {
      docPipWindowRef.current.close();
    }
    docPipWindowRef.current = null;
    setIsDocPipActive(false);
    setPipWindow(null);
  }, []);

  const openDocumentPip = useCallback(async (): Promise<boolean> => {
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

      pipWin.document.title = target?.title
        ? `ApplyFields Copier — ${target.title}`
        : 'ApplyFields Profile Copier';

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
        toggleSplit,
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

