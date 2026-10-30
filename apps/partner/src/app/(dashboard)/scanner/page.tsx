import { Metadata } from 'next';
import { Suspense } from 'react';
import { ScannerClient } from './scanner-client';

export const metadata: Metadata = {
  title: 'Document Scanner & Asset Resizer | Partner Desk',
  description: 'In-browser photo cropping, signature binarizing, and multi-page certificate PDF bundler.',
};

export default function ScannerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-slate-400">Loading Scanner Workstation...</div>}>
      <ScannerClient />
    </Suspense>
  );
}

