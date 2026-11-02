'use client';

import React from 'react';
import { PictureInPicture, Columns, ExternalLink } from 'lucide-react';
import { usePipApply } from '@/context/pip-apply-context';

export interface PipApplyButtonProps {
  title: string;
  applyUrl: string;
  slug?: string;
  pdfUrl?: string | null;
  variant?: 'primary' | 'secondary' | 'badge' | 'inline';
  className?: string;
  children?: React.ReactNode;
}

export function PipApplyButton({
  title,
  applyUrl,
  slug,
  pdfUrl,
  variant = 'primary',
  className,
  children,
}: PipApplyButtonProps) {
  const { openPip } = usePipApply();

  const handleLaunch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openPip({
      title,
      applyUrl,
      slug,
      notificationPdfUrl: pdfUrl,
    });
  };

  if (children) {
    return (
      <button
        type="button"
        onClick={handleLaunch}
        className={className}
      >
        {children}
      </button>
    );
  }

  if (variant === 'primary') {
    return (
      <button
        type="button"
        onClick={handleLaunch}
        className={
          className ||
          'clay-press w-full flex items-center justify-between rounded-xl bg-[#082046] p-3 text-xs font-bold text-white shadow-md hover:bg-[#0e7bf4] transition active:scale-95'
        }
      >
        <span className="flex items-center gap-2">
          <PictureInPicture className="size-4 text-blue-300" />
          <span>Apply in Picture-in-Picture Mode</span>
        </span>
        <span className="text-[10px] font-semibold text-blue-200 bg-white/10 px-2 py-0.5 rounded-md">
          Dual View Copier
        </span>
      </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        type="button"
        onClick={handleLaunch}
        className={
          className ||
          'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#082046] hover:bg-slate-50 transition active:scale-95'
        }
      >
        <PictureInPicture className="size-3.5 text-[#0e7bf4]" />
        <span>Apply in PiP</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLaunch}
      className={
        className ||
        'inline-flex items-center gap-1 text-xs font-semibold text-[#0e7bf4] hover:underline'
      }
    >
      <PictureInPicture className="size-3.5" />
      <span>Picture-in-Picture</span>
    </button>
  );
}
