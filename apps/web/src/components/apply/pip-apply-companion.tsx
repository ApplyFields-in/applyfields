'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, FileText, Maximize2, Minimize2, PictureInPicture, User, X } from 'lucide-react';
import { openOfficialSite, usePipApply, type PipApplyTarget } from '@/context/pip-apply-context';
import { CandidateProfileCopier } from './candidate-profile-copier';

/**
 * Apply helper. The official site always opens in its own browser window (never inside ApplyFields:
 * many portals refuse to load in a frame, and logins, captchas and payments break there). The helper
 * holds the person's details to copy, either floating on top of every window (Chrome / Edge Document
 * Picture-in-Picture) or docked in this tab elsewhere.
 */
export function PipApplyCompanion() {
  const { isOpen, mode, target, isDocPipSupported, isDocPipActive, pipWindow, closePip, setMode, openDocumentPip } =
    usePipApply();

  if (!isOpen || !target) return null;

  // Floating on top: the helper lives in the Picture-in-Picture window; this tab shows a small pill.
  if (isDocPipActive && pipWindow) {
    return (
      <>
        {createPortal(<HelperPanel target={target} floating onClose={closePip} />, pipWindow.document.body)}
        <aside
          aria-label="Apply helper is floating"
          className="fixed bottom-5 right-20 z-50 flex items-center gap-2 rounded-full border border-slate-300 bg-white/95 px-4 py-2 text-xs shadow-2xl"
        >
          <PictureInPicture className="size-4 text-[#0e7bf4]" />
          <span className="max-w-[220px] truncate font-semibold text-[#082046]">Apply helper is floating on top</span>
          <button type="button" onClick={closePip} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Close apply helper">
            <X className="size-3.5" />
          </button>
        </aside>
      </>
    );
  }

  if (mode === 'minimized') {
    return (
      <aside
        aria-label="Apply helper, minimized"
        className="fixed bottom-5 right-20 z-50 flex items-center gap-2 rounded-full border border-slate-300 bg-white/95 px-4 py-2 text-xs shadow-2xl"
      >
        <span className="max-w-[200px] truncate font-semibold text-[#082046]">{target.title}</span>
        <button type="button" onClick={() => setMode('docked')} className="rounded-md p-1 text-slate-600 hover:bg-slate-100" aria-label="Open apply helper">
          <Maximize2 className="size-3.5" />
        </button>
        <button type="button" onClick={closePip} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Close apply helper">
          <X className="size-3.5" />
        </button>
      </aside>
    );
  }

  // Docked in this tab (browsers without floating windows, or after the floating window was closed).
  return (
    <aside
      aria-label="Apply helper"
      className="fixed bottom-5 right-5 z-50 flex h-[600px] max-h-[85vh] w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl sm:w-[420px]"
    >
      <div className="flex shrink-0 items-center justify-end gap-1 border-b border-slate-200 bg-[#082046] px-3 py-2 text-white">
        {isDocPipSupported && (
          <button
            type="button"
            onClick={() => void openDocumentPip(target.title)}
            className="mr-auto flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs hover:bg-white/20"
          >
            <PictureInPicture className="size-3.5" />
            <span>Float on top</span>
          </button>
        )}
        <button type="button" onClick={() => setMode('minimized')} className="rounded-md p-1.5 text-white/80 hover:bg-white/20" aria-label="Minimize">
          <Minimize2 className="size-3.5" />
        </button>
        <button type="button" onClick={closePip} className="rounded-md p-1.5 text-white/80 hover:bg-white/20" aria-label="Close apply helper">
          <X className="size-4" />
        </button>
      </div>
      <HelperPanel target={target} />
    </aside>
  );
}

function HelperPanel({ target, floating = false, onClose }: { target: PipApplyTarget; floating?: boolean; onClose?: () => void }) {
  let domain = '';
  try {
    domain = new URL(target.applyUrl).hostname.replace(/^www\./, '');
  } catch {
    domain = '';
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8fafc]">
      <div className="shrink-0 space-y-2 border-b border-slate-200 bg-white p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Apply helper</p>
            <p className="truncate text-sm font-bold text-[#082046]" title={target.title}>
              {target.title}
            </p>
          </div>
          {floating && onClose && (
            <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Close apply helper">
              <X className="size-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          // The click's own window opens the site, so it works from the floating window too.
          onClick={(e) => openOfficialSite(target.applyUrl, e.currentTarget.ownerDocument.defaultView ?? window)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0e7bf4] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#0c6cd7]"
        >
          <ExternalLink className="size-4" />
          <span>Open the official application{domain ? ` (${domain})` : ''}</span>
        </button>
        {target.notificationPdfUrl && (
          <a href={target.notificationPdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-semibold text-[#0e7bf4] hover:underline">
            <FileText className="size-3.5" /> Official notification (PDF)
          </a>
        )}
        <p className="text-[11px] leading-snug text-slate-500">
          Copy a detail below and paste it into the official form. ApplyFields never fills or submits the form for you,
          and never asks for your portal password or OTP.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <CandidateProfileCopier isEmbeddedInPipWindow={floating} />
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2 text-xs">
        <a href="/profile" target="_blank" rel="noopener" className="flex items-center gap-1 font-semibold text-[#082046] hover:underline">
          <User className="size-3.5" /> My profile
        </a>
        <a href="/documents" target="_blank" rel="noopener" className="flex items-center gap-1 font-semibold text-[#082046] hover:underline">
          <FileText className="size-3.5" /> My documents
        </a>
      </div>
    </div>
  );
}
