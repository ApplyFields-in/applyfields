'use client';

import React, { useState, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Sliders,
  Scissors,
  Download,
  Send,
  Eye,
  RefreshCw,
  Layers,
  FileCheck2,
  User,
} from 'lucide-react';

interface ProcessedAsset {
  type: 'photo' | 'signature' | 'marks_memo' | 'certificate';
  fileName: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  dimensions: string;
  isCompliant: boolean;
  complianceNotes: string;
}

export function ScannerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams.get('token') || 'TK-043';
  const nameParam = searchParams.get('name') || 'KONGARA VENKATA NAVEEN';
  const serviceParam = searchParams.get('service') || 'SSC CGL 2026 Application Filing';

  // Active Processing Bay
  const [activeBay, setActiveBay] = useState<'photo' | 'signature' | 'documents'>('photo');

  // Photo Tool State
  const [photoPreset, setPhotoPreset] = useState<'ssc' | 'upsc' | 'tgpsc'>('ssc');
  const [photoBrightness, setPhotoBrightness] = useState<number>(100);
  const [photoContrast, setPhotoContrast] = useState<number>(100);
  const [isPhotoReady, setIsPhotoReady] = useState<boolean>(true);

  // Signature Tool State
  const [signatureThreshold, setSignatureThreshold] = useState<number>(128);
  const [isSignatureReady, setIsSignatureReady] = useState<boolean>(true);

  // Documents multi-upload
  const [memoUploaded, setMemoUploaded] = useState<boolean>(true);
  const [casteUploaded, setCasteUploaded] = useState<boolean>(true);

  // Dispatch state
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<boolean>(false);

  const PHOTO_PRESETS = {
    ssc: { label: 'SSC Standard', dims: '200 x 230 px', minKb: 20, maxKb: 50, note: 'Plain white background, no eyewear' },
    upsc: { label: 'UPSC Standard', dims: '350 x 350 px', minKb: 20, maxKb: 300, note: 'Front-facing, 3/4 face coverage' },
    tgpsc: { label: 'TGPSC / State PSC', dims: '150 x 200 px', minKb: 15, maxKb: 40, note: 'Color photograph with stamp date' },
  };

  const handleTransmit = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setDispatchedSuccess(true);
    }, 900);
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-slate-100">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Kiosk Partner Operations</span>
            <span>/</span>
            <span className="text-emerald-400">Document Scanner &amp; Resizer Tool</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl mt-1">
            Government Application Asset Ingestion
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
            Crop, compress, and validate physical passport photos, signatures, and certificates to strict government specifications.
          </p>
        </div>

        {/* Current Working Token Chip */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Active File</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-emerald-400">{tokenParam}</span>
              <span className="text-xs font-bold text-white max-w-[150px] truncate">{nameParam}</span>
            </div>
          </div>
          <Link
            href="/counter"
            className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-750 transition"
          >
            Counter POS
          </Link>
        </div>
      </div>

      {/* Bay Selection Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'photo', label: '1. Passport Photograph Bay', status: 'Compliant (34 KB)' },
          { id: 'signature', label: '2. Candidate Signature Bay', status: 'Compliant (14 KB)' },
          { id: 'documents', label: '3. Certificates & Memos PDF Bay', status: '2 Files Ready' },
        ].map((bay) => (
          <button
            key={bay.id}
            type="button"
            onClick={() => setActiveBay(bay.id as any)}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold transition border shrink-0 ${
              activeBay === bay.id
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-xs'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <span>{bay.label}</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-emerald-400">
              {bay.status}
            </span>
          </button>
        ))}
      </div>

      {/* Main Asset Processing Bay Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT PANE: Active Bay Canvas & Controls (7 Columns) */}
        <div className="space-y-6 lg:col-span-7">
          {/* BAY 1: PASSPORT PHOTO RESIZER */}
          {activeBay === 'photo' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Passport Photograph Resizer &amp; Enhancer</h3>
                  <p className="text-xs text-slate-400">Auto-crop to 200×230 px and enforce 20KB–50KB bounds</p>
                </div>

                {/* Preset Selector */}
                <div className="flex items-center gap-1.5">
                  {(['ssc', 'upsc', 'tgpsc'] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPhotoPreset(preset)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase transition border ${
                        photoPreset === preset
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Viewport Canvas Simulation */}
              <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-slate-800 bg-slate-950 p-6">
                {/* Photo Preview Container */}
                <div
                  className="flex size-56 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-emerald-500/60 bg-slate-900 p-2 relative overflow-hidden"
                  style={{
                    filter: `brightness(${photoBrightness}%) contrast(${photoContrast}%)`,
                  }}
                >
                  <div className="text-center space-y-2">
                    <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                      <User className="size-10 text-emerald-400" />
                    </div>
                    <p className="text-[11px] font-bold text-white uppercase tracking-wider">Candidate Portrait</p>
                    <span className="font-mono text-[10px] text-emerald-400 block">
                      {PHOTO_PRESETS[photoPreset].dims}
                    </span>
                  </div>

                  {/* Compliance Watermark Badge */}
                  <span className="absolute bottom-2 left-2 right-2 rounded bg-emerald-500/90 py-0.5 text-center text-[10px] font-black uppercase tracking-wider text-slate-950">
                    Aspect Ratio Locked
                  </span>
                </div>

                {/* Sliders & Calibration */}
                <div className="flex-1 space-y-4 w-full text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 font-bold mb-1">
                      <span>Brightness &amp; Background Exposure:</span>
                      <span className="font-mono text-emerald-400">{photoBrightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={70}
                      max={140}
                      value={photoBrightness}
                      onChange={(e) => setPhotoBrightness(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 font-bold mb-1">
                      <span>Contrast / Face Sharpness:</span>
                      <span className="font-mono text-emerald-400">{photoContrast}%</span>
                    </div>
                    <input
                      type="range"
                      min={70}
                      max={140}
                      value={photoContrast}
                      onChange={(e) => setPhotoContrast(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-[11px] text-slate-300 space-y-1">
                    <p className="font-bold text-emerald-400">
                      Standard: {PHOTO_PRESETS[photoPreset].label}
                    </p>
                    <p className="text-slate-400">Resolution: {PHOTO_PRESETS[photoPreset].dims}</p>
                    <p className="text-slate-400">
                      File Size: {PHOTO_PRESETS[photoPreset].minKb} KB to {PHOTO_PRESETS[photoPreset].maxKb} KB
                    </p>
                    <p className="text-slate-400 italic">{PHOTO_PRESETS[photoPreset].note}</p>
                  </div>
                </div>
              </div>

              {/* Bay Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoBrightness(100);
                    setPhotoContrast(100);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 font-bold text-slate-300 hover:bg-slate-750"
                >
                  Reset Adjustments
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBay('signature')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  <span>Approve &amp; Next: Signature Bay</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* BAY 2: SIGNATURE BINARIZER */}
          {activeBay === 'signature' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Signature Crop &amp; Ink Binarizer</h3>
                  <p className="text-xs text-slate-400">Removes paper shadows and ruled lines; enforces 140×60 px (10–20 KB)</p>
                </div>
                <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  140 x 60 px
                </span>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4">
                {/* Signature Preview */}
                <div className="flex h-28 w-full items-center justify-center rounded-xl border border-slate-700 bg-white p-4">
                  <div className="text-center font-serif text-2xl font-black text-slate-950 italic tracking-wider">
                    {nameParam.split(' ').map((n) => n[0]).join('. ')}. Naveen
                  </div>
                </div>

                {/* Binarization Slider */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300 font-bold">
                    <span>Black Ink Extraction Threshold:</span>
                    <span className="font-mono text-emerald-400">{signatureThreshold} / 255</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    value={signatureThreshold}
                    onChange={(e) => setSignatureThreshold(Number(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-800"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Lighter Ink (Preserves Strokes)</span>
                    <span>Darker Clean (Eliminates Paper Texture)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveBay('photo')}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 font-bold text-slate-300 hover:bg-slate-750"
                >
                  Back to Photo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBay('documents')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400 transition"
                >
                  <span>Approve &amp; Next: Documents Bay</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* BAY 3: CERTIFICATES & MEMO PDF BUNDLER */}
          {activeBay === 'documents' && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Certificates &amp; 10th Memo PDF Bundler</h3>
                  <p className="text-xs text-slate-400">Combine multiple physical scans into compliant &lt;300 KB single PDFs</p>
                </div>
                <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Total: 485 KB
                </span>
              </div>

              <div className="space-y-3">
                {/* File 1: 10th Memo */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-xs">
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-emerald-400" />
                    <div>
                      <p className="font-bold text-white">10th SSC Marks Memo (DOB Proof)</p>
                      <p className="font-mono text-[10px] text-slate-400">ssc_10th_memo_1628104921.pdf · 245 KB</p>
                    </div>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Compliant
                  </span>
                </div>

                {/* File 2: Caste / EWS Certificate */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 p-3 text-xs">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-emerald-400" />
                    <div>
                      <p className="font-bold text-white">OBC Non-Creamy Layer Certificate</p>
                      <p className="font-mono text-[10px] text-slate-400">obc_ncl_cert_2026.pdf · 240 KB</p>
                    </div>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Compliant
                  </span>
                </div>

                {/* Additional Scan Dropzone */}
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-center">
                  <Upload className="mx-auto size-6 text-slate-500" />
                  <p className="mt-1 text-xs font-bold text-slate-300">Scan Additional Supporting Document</p>
                  <p className="text-[10px] text-slate-500">Flatbed Scanner feed or local PDF/JPEG</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveBay('signature')}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 font-bold text-slate-300 hover:bg-slate-750"
                >
                  Back to Signature
                </button>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="size-4" />
                  All 3 Bays Ready for Transmission
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANE: Pre-Flight Verification & Transmission Station (5 Columns) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Pre-Flight Compliance Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Pre-Flight Portal Check</h3>
              </div>
              <span className="font-mono text-xs text-emerald-400 font-bold">100% Passed</span>
            </div>

            {/* Checklist */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-800/50 p-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Passport Photo Verified</p>
                  <p className="text-[11px] text-slate-400">Dimensions: 200×230 px | Size: 34.2 KB (Within 20–50KB)</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-800/50 p-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Candidate Signature Verified</p>
                  <p className="text-[11px] text-slate-400">Dimensions: 140×60 px | Black Ballpoint Ink | Size: 14.8 KB</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-800/50 p-2.5">
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Supporting Documents Bundled</p>
                  <p className="text-[11px] text-slate-400">10th Memo &amp; Caste Certificate combined size under 500 KB</p>
                </div>
              </div>
            </div>

            {/* File Info */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Citizen File:</span>
                <span className="font-bold text-white">{nameParam}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Service:</span>
                <span className="font-bold text-white truncate max-w-[180px]">{serviceParam}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Token:</span>
                <span className="font-mono font-bold text-emerald-400">{tokenParam}</span>
              </div>
            </div>

            {/* Transmit Action */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleTransmit}
                disabled={isDispatching || dispatchedSuccess}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
              >
                {isDispatching ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Compressing &amp; Transmitting...</span>
                  </>
                ) : dispatchedSuccess ? (
                  <>
                    <CheckCircle2 className="size-4 text-slate-950" />
                    <span>Dispatched to Back-Office!</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4 text-slate-950" />
                    <span>Bundle &amp; Transmit to Back-Office Desk</span>
                  </>
                )}
              </button>

              {dispatchedSuccess && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 space-y-2 animate-in fade-in">
                  <p className="font-bold">File Dispatched to ApplyFields Service Desk</p>
                  <p className="text-[11px] text-emerald-400/80">
                    Your file is now live in the central filing workstation queue. You can monitor filing progress and receive OTP verification alerts in the Orders Pipeline.
                  </p>
                  <Link
                    href="/orders"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                  >
                    <span>View in Orders Pipeline</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
