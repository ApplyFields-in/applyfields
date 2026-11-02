'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Columns,
  ExternalLink,
  Layers,
  Maximize2,
  Minimize2,
  MoveRight,
  PictureInPicture,
  RefreshCw,
  ShieldCheck,
  SplitSquareVertical,
  X,
} from 'lucide-react';
import { usePipApply } from '@/context/pip-apply-context';
import { CandidateProfileCopier } from './candidate-profile-copier';

export function PipApplyCompanion() {
  const {
    isOpen,
    mode,
    target,
    isDocPipSupported,
    isDocPipActive,
    pipWindow,
    closePip,
    setMode,
    toggleSplit,
    openDocumentPip,
    closeDocumentPip,
  } = usePipApply();

  const [activeDockTab, setActiveDockTab] = useState<'portal' | 'copier'>('portal');
  const [iframeKey, setIframeKey] = useState(0);

  if (!isOpen || !target) {
    return null;
  }

  // Extract host/domain
  let domain = '';
  try {
    domain = new URL(target.applyUrl).hostname.replace(/^www\./, '');
  } catch {
    domain = 'official-portal';
  }

  const handleOpenCompanionPopup = () => {
    if (typeof window === 'undefined') return;
    const width = Math.min(1000, window.screen.width * 0.55);
    const height = window.screen.height * 0.85;
    const left = window.screen.width - width - 20;
    const top = 60;
    window.open(
      target.applyUrl,
      'ApplyFieldsOfficialPortal',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
  };

  // If native Document PiP window is active, render Copier via React Portal into pipWindow.document.body
  const renderNativePipPortal = () => {
    if (!isDocPipActive || !pipWindow) return null;
    return createPortal(
      <CandidateProfileCopier isEmbeddedInPipWindow onClose={closeDocumentPip} />,
      pipWindow.document.body
    );
  };

  // Minimized Floating Pill
  if (mode === 'minimized') {
    return (
      <>
        {renderNativePipPortal()}
        <aside
          aria-label="Application Companion Minimized"
          className="fixed bottom-5 right-20 z-50 flex items-center gap-2 rounded-full border border-slate-300 bg-white/95 px-4 py-2 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex size-6 items-center justify-center rounded-full bg-[#082046] text-white">
            <PictureInPicture className="size-3.5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#082046] block max-w-[160px] truncate">
              {target.title}
            </span>
            <span className="text-[10px] text-slate-500">Companion Active</span>
          </div>
          <div className="ml-2 flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() => setMode('docked')}
              className="rounded-md p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              title="Expand Picture-in-Picture window"
            >
              <Maximize2 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={closePip}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              title="Close companion"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </aside>
      </>
    );
  }

  // Split-Screen Mode (Takes 50% side-by-side or docked full split)
  if (mode === 'split') {
    return (
      <>
        {renderNativePipPortal()}
        <aside
          aria-label="Split Screen Apply Companion"
          className="fixed inset-y-0 right-0 z-50 w-full sm:w-[50vw] xl:w-[48vw] border-l border-slate-300 bg-white shadow-2xl flex flex-col animate-in slide-in-from-right-3 duration-200"
        >
          {/* Split Mode Header */}
          <div className="border-b border-slate-200 bg-[#082046] px-4 py-2.5 text-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold block truncate">
                  {target.title}
                </span>
                <span className="text-[10px] text-slate-300 font-mono block truncate">
                  {domain} · Split-Screen Companion
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isDocPipSupported && (
                <button
                  type="button"
                  onClick={openDocumentPip}
                  className="rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 transition flex items-center gap-1"
                  title="Pop out copier to native floating Picture-in-Picture window"
                >
                  <PictureInPicture className="size-3.5" />
                  <span className="hidden md:inline">Pop Out PiP</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenCompanionPopup}
                className="rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 transition flex items-center gap-1"
                title="Open official portal in synchronized side window"
              >
                <ExternalLink className="size-3.5" />
                <span className="hidden md:inline">Companion Window</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('docked')}
                className="rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition"
                title="Switch to floating docked PiP mode"
              >
                <Minimize2 className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={closePip}
                className="rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition"
                title="Close split mode"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Split Mode Body: 40% Copier on left, 60% Official Portal on right (or stacked on mobile) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)] overflow-hidden">
            {/* Copier Panel */}
            <div className="border-r border-slate-200 h-full overflow-hidden flex flex-col bg-[#f8fafc]">
              <CandidateProfileCopier />
            </div>

            {/* Portal iframe View */}
            <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
              {/* Notice bar for iframe restrictions */}
              <div className="border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-900 flex items-center justify-between gap-2 shrink-0">
                <span className="truncate">
                  If the government portal restricts embedding, click <strong>Companion Window</strong>.
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIframeKey((k) => k + 1)}
                    className="text-amber-800 hover:text-amber-950 flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="size-3" />
                    <span>Reload</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCompanionPopup}
                    className="font-bold underline text-amber-950"
                  >
                    Open Window
                  </button>
                </div>
              </div>

              {/* Secure iframe */}
              <div className="flex-1 relative">
                <iframe
                  key={iframeKey}
                  src={target.applyUrl}
                  title={`Official Application Portal - ${target.title}`}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals"
                />
              </div>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Default: Docked Floating Picture-in-Picture Mode
  return (
    <>
      {renderNativePipPortal()}
      <aside
        aria-label="Picture in Picture Apply Companion"
        className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[600px] h-[580px] max-h-[85vh] rounded-2xl border border-slate-300 bg-white shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Docked Header */}
        <div className="border-b border-slate-200 bg-[#082046] px-3.5 py-2.5 text-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold block truncate">
                {target.title}
              </span>
              <span className="text-[10px] text-slate-300 font-mono block truncate">
                {domain} · Apply Companion
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isDocPipSupported && (
              <button
                type="button"
                onClick={openDocumentPip}
                className="rounded-md bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20 transition flex items-center gap-1"
                title="Pop out copier to floating OS Picture-in-Picture window"
              >
                <PictureInPicture className="size-3.5" />
                <span className="hidden sm:inline">PiP Copier</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCompanionPopup}
              className="rounded-md bg-white/10 p-1.5 text-white hover:bg-white/20 transition"
              title="Open official portal in side companion window"
            >
              <ExternalLink className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={toggleSplit}
              className="rounded-md bg-white/10 p-1.5 text-white hover:bg-white/20 transition"
              title="Expand to side-by-side split view"
            >
              <Columns className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setMode('minimized')}
              className="rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition"
              title="Minimize"
            >
              <Minimize2 className="size-3.5" />
            </button>

            <button
              type="button"
              onClick={closePip}
              className="rounded-md p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition"
              title="Close companion"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Dock Mode Tabs: Portal View vs Profile Copier */}
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveDockTab('portal')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                activeDockTab === 'portal'
                  ? 'bg-white text-[#082046] shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Application Portal
            </button>
            <button
              type="button"
              onClick={() => setActiveDockTab('copier')}
              className={`rounded-md px-2.5 py-1 font-semibold transition ${
                activeDockTab === 'copier'
                  ? 'bg-white text-[#082046] shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Profile Copier
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            {activeDockTab === 'portal' ? (
              <button
                type="button"
                onClick={() => setActiveDockTab('copier')}
                className="text-[#0e7bf4] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View My Details to Copy</span>
                <MoveRight className="size-3" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveDockTab('portal')}
                className="text-[#0e7bf4] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Back to Application Portal</span>
                <MoveRight className="size-3" />
              </button>
            )}
          </div>
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-hidden relative">
          {activeDockTab === 'copier' ? (
            <CandidateProfileCopier />
          ) : (
            <div className="flex flex-col h-full bg-slate-100">
              {/* Fallback Banner */}
              <div className="border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-900 flex items-center justify-between gap-2 shrink-0">
                <span className="truncate">
                  Portal blocked in frame? Use companion window.
                </span>
                <button
                  type="button"
                  onClick={handleOpenCompanionPopup}
                  className="font-bold underline text-amber-950 shrink-0"
                >
                  Open Window
                </button>
              </div>

              <div className="flex-1 relative">
                <iframe
                  key={iframeKey}
                  src={target.applyUrl}
                  title={`Official Application Portal - ${target.title}`}
                  className="w-full h-full border-0 bg-white"
                  sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals"
                />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
