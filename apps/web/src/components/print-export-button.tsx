'use client';

import { useState } from 'react';
import { Download, Printer, Check } from 'lucide-react';

interface PrintExportButtonProps {
  label?: string;
  documentTitle?: string;
  className?: string;
  variant?: 'outline' | 'solid';
}

export function PrintExportButton({
  label = 'Print / Save PDF',
  documentTitle,
  className = '',
  variant = 'outline',
}: PrintExportButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    setDownloading(true);
    if (documentTitle && typeof document !== 'undefined') {
      const originalTitle = document.title;
      document.title = documentTitle;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
        setDownloading(false);
      }, 1000);
    } else {
      window.print();
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={downloading}
      title="Print this document or save as high-resolution PDF"
      className={`print:hidden inline-flex min-h-9 items-center gap-2 rounded-md px-3.5 text-xs font-semibold transition-all cursor-pointer shadow-sm ${
        variant === 'solid'
          ? 'border border-[#dec9a5] bg-[#F4E8D1] text-[#082046] hover:bg-[#ebdcc0]'
          : 'border border-[#dec9a5] bg-[#f8f5ef] text-[#082046] hover:bg-[#ffffff]'
      } ${className}`}
    >
      {downloading ? (
        <>
          <Check className="size-3.5 text-emerald-600 animate-in zoom-in-50" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Printer className="size-3.5 text-[#0e7bf4]" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

