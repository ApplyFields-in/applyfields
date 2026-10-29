'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { BookingDetail } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  Camera,
  Crop,
  Download,
  FileCheck,
  FileText,
  Printer,
  RefreshCw,
  Sliders,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';

export interface ResizerPreset {
  id: string;
  name: string;
  agency: string;
  targetWidth: number;
  targetHeight: number;
  minKB: number;
  maxKB: number;
  aspectRatio: string;
  notes: string;
}

export const KIOSK_PRESETS: ResizerPreset[] = [
  {
    id: 'ssc-photo',
    name: 'SSC Passport Photo',
    agency: 'Staff Selection Commission (CGL / CHSL / MTS)',
    targetWidth: 200,
    targetHeight: 230,
    minKB: 20,
    maxKB: 50,
    aspectRatio: '3.5 x 4.5 cm (200x230 px)',
    notes: 'White background, date of photo within 3 months, eyes clearly visible.',
  },
  {
    id: 'ssc-sig',
    name: 'SSC Candidate Signature',
    agency: 'Staff Selection Commission',
    targetWidth: 140,
    targetHeight: 60,
    minKB: 10,
    maxKB: 20,
    aspectRatio: '140 x 60 px',
    notes: 'Black ink on white paper only. Signature in capital letters will be rejected.',
  },
  {
    id: 'upsc-photo',
    name: 'UPSC Passport Photo',
    agency: 'Union Public Service Commission (CSE / NDA / CDS)',
    targetWidth: 350,
    targetHeight: 350,
    minKB: 20,
    maxKB: 300,
    aspectRatio: '1:1 Square (Min 350x350 px)',
    notes: 'Name of candidate and date of photo printed at the bottom.',
  },
  {
    id: 'upsc-sig',
    name: 'UPSC Candidate Signature',
    agency: 'Union Public Service Commission',
    targetWidth: 350,
    targetHeight: 350,
    minKB: 20,
    maxKB: 300,
    aspectRatio: '1:1 Square (Min 350x350 px)',
    notes: 'Signature in running hand with dark blue or black ink.',
  },
  {
    id: 'ibps-photo',
    name: 'IBPS / Banking Photo',
    agency: 'IBPS / SBI (PO / Clerk / SO)',
    targetWidth: 200,
    targetHeight: 230,
    minKB: 20,
    maxKB: 50,
    aspectRatio: '200 x 230 px',
    notes: 'Color passport photograph with light/white background.',
  },
  {
    id: 'ibps-thumb',
    name: 'IBPS Left Thumb Impression',
    agency: 'IBPS / SBI Banking',
    targetWidth: 240,
    targetHeight: 240,
    minKB: 20,
    maxKB: 50,
    aspectRatio: '240 x 240 px (3x3 cm)',
    notes: 'Clear impression with blue or black ink on white sheet.',
  },
  {
    id: 'meeseva-doc',
    name: 'MeeSeva Certificate Scan',
    agency: 'State Revenue & MeeSeva Kiosks',
    targetWidth: 800,
    targetHeight: 1050,
    minKB: 50,
    maxKB: 150,
    aspectRatio: 'A4 Proportion (800x1050 px)',
    notes: 'Caste, Income, or Residence certificate scans under 150KB.',
  },
];

interface KioskToolsProps {
  bookings: BookingDetail[];
  onSelectBookingForSlip?: (booking: BookingDetail) => void;
}

export function KioskTools({ bookings, onSelectBookingForSlip }: KioskToolsProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('ssc-photo');
  const [customWidth, setCustomWidth] = useState<number>(200);
  const [customHeight, setCustomHeight] = useState<number>(230);
  const [customMaxKB, setCustomMaxKB] = useState<number>(50);
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Image processing states
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedDimensions, setProcessedDimensions] = useState<{ width: number; height: number } | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null);

  // Acknowledgement slip generator state
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [activeSlipBooking, setActiveSlipBooking] = useState<BookingDetail | null>(null);
  const [manualSlipData, setManualSlipData] = useState({
    candidateName: 'Rahul V. Sharma',
    mobileNumber: '+91 98450 12345',
    category: 'OBC-NCL',
    serviceName: 'Staff Selection Commission - CGL Examination 2026',
    applicationRef: 'SSC-CGL-2026-94821',
    centerName: 'MeeSeva Center #402 - Gandhi Road',
    operatorName: 'Suresh Babu (ID: KSK-042)',
    examFeePaise: 10000,
    kioskFeePaise: 5000,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activePreset = KIOSK_PRESETS.find((p) => p.id === selectedPresetId) || KIOSK_PRESETS[0];

  const targetW = isCustom ? customWidth : activePreset.targetWidth;
  const targetH = isCustom ? customHeight : activePreset.targetHeight;
  const minTargetKB = isCustom ? 10 : activePreset.minKB;
  const maxTargetKB = isCustom ? customMaxKB : activePreset.maxKB;

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalFile(file);

    const objectUrl = URL.createObjectURL(file);
    setOriginalPreviewUrl(objectUrl);

    // Measure dimensions
    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.width, height: img.height });
      processImage(img, targetW, targetH, minTargetKB, maxTargetKB);
    };
    img.src = objectUrl;
  };

  // Resize and compress via HTML5 Canvas binary search
  const processImage = (
    img: HTMLImageElement,
    w: number,
    h: number,
    minKB: number,
    maxKB: number,
  ) => {
    setProcessing(true);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setProcessing(false);
      return;
    }

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // White background fill (standard for passport photos)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Center crop or fit
    const imgAspect = img.width / img.height;
    const canvasAspect = w / h;
    let renderW = w;
    let renderH = h;
    let offsetX = 0;
    let offsetY = 0;

    if (imgAspect > canvasAspect) {
      renderW = h * imgAspect;
      offsetX = (w - renderW) / 2;
    } else {
      renderH = w / imgAspect;
      offsetY = (h - renderH) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

    // Binary search compression to hit between minKB and maxKB
    const targetMaxBytes = maxKB * 1024;
    const targetMinBytes = minKB * 1024;

    let minQuality = 0.05;
    let maxQuality = 0.98;
    let bestBlob: Blob | null = null;
    let bestQuality = 0.85;

    const testQuality = (quality: number): Promise<Blob | null> => {
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
      });
    };

    (async () => {
      for (let i = 0; i < 7; i++) {
        const mid = (minQuality + maxQuality) / 2;
        const blob = await testQuality(mid);
        if (!blob) break;

        bestBlob = blob;
        bestQuality = mid;

        if (blob.size > targetMaxBytes) {
          maxQuality = mid;
        } else if (blob.size < targetMinBytes && mid < 0.95) {
          minQuality = mid;
        } else {
          // In desired range
          break;
        }
      }

      if (bestBlob) {
        setProcessedBlob(bestBlob);
        setProcessedDimensions({ width: w, height: h });
        if (processedUrl) URL.revokeObjectURL(processedUrl);
        setProcessedUrl(URL.createObjectURL(bestBlob));
        if (originalFile) {
          const ratio = Math.round((1 - bestBlob.size / originalFile.size) * 100);
          setCompressionRatio(ratio);
        }
      }
      setProcessing(false);
    })();
  };

  // Re-run when preset changes and we have an existing original image
  useEffect(() => {
    if (!originalPreviewUrl) return;
    const img = new Image();
    img.onload = () => {
      processImage(img, targetW, targetH, minTargetKB, maxTargetKB);
    };
    img.src = originalPreviewUrl;
  }, [selectedPresetId, customWidth, customHeight, customMaxKB, isCustom]);

  // Trigger download of processed compliant JPEG
  const handleDownload = () => {
    if (!processedUrl || !processedBlob) return;
    const a = document.createElement('a');
    a.href = processedUrl;
    const suffix = isCustom ? 'custom' : activePreset.id;
    a.download = `compliant_${suffix}_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Open slip for booking
  const openSlipForBooking = (b: BookingDetail) => {
    setActiveSlipBooking(b);
    setManualSlipData((prev) => ({
      ...prev,
      candidateName: b.user_note?.split('\n')[0] || 'Citizen Applicant',
      serviceName: b.service_name || 'Government Application Assistance',
      applicationRef: `APF-BK-${b.id.slice(0, 8).toUpperCase()}`,
      centerName: b.partner_business_name || 'Official Partner Kiosk',
      kioskFeePaise: b.quoted_paise || 5000,
    }));
    setSlipModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-teal/20 bg-canvas p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-teal/10 text-teal shrink-0">
            <Crop className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-teal">
                MeeSeva & CSC Kiosk Processing Terminal
              </h3>
              <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal">
                Offline Client-Side Security
              </span>
            </div>
            <p className="text-xs text-teal/70 mt-0.5 max-w-xl">
              Strict government portal file bounds validation without external converters. Photos, signatures, and printable citizen slips remain 100% private in browser memory.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveSlipBooking(null);
            setSlipModalOpen(true);
          }}
          className={cn(buttonClass({ variant: 'primary', size: 'sm' }), 'gap-1.5 shrink-0')}
        >
          <Printer className="size-4" /> Generate Printable Slip
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Preset Selector & Controls (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 sm:p-5 space-y-4 border-teal/15">
            <div className="flex items-center justify-between border-b border-teal/10 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-2">
                <Sliders className="size-3.5" /> Portal Upload Presets
              </h4>
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className="text-[11px] font-semibold text-teal hover:underline"
              >
                {isCustom ? 'Use Government Presets' : 'Custom Dimensions'}
              </button>
            </div>

            {!isCustom ? (
              <div className="space-y-2">
                {KIOSK_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition-all text-xs flex items-start justify-between gap-3',
                      selectedPresetId === preset.id
                        ? 'border-teal bg-teal/5 ring-1 ring-teal/30 shadow-xs'
                        : 'border-teal/10 bg-canvas/40 hover:border-teal/30 hover:bg-canvas',
                    )}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-teal">{preset.name}</div>
                      <div className="text-[11px] text-teal/70 font-mono">
                        {preset.targetWidth} x {preset.targetHeight} px | {preset.minKB}-{preset.maxKB} KB
                      </div>
                      <div className="text-[10px] text-teal/60">{preset.agency}</div>
                    </div>
                    {selectedPresetId === preset.id && (
                      <CheckCircle2 className="size-4 text-teal shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-canvas/70 rounded-xl border border-teal/10 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-teal mb-1">
                    Target Width (px)
                  </label>
                  <input
                    type="number"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value) || 200)}
                    className="w-full rounded-lg border border-teal/20 bg-white px-3 py-1.5 font-mono text-teal"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-teal mb-1">
                    Target Height (px)
                  </label>
                  <input
                    type="number"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value) || 230)}
                    className="w-full rounded-lg border border-teal/20 bg-white px-3 py-1.5 font-mono text-teal"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-teal mb-1">
                    Maximum File Size (KB)
                  </label>
                  <input
                    type="number"
                    value={customMaxKB}
                    onChange={(e) => setCustomMaxKB(Number(e.target.value) || 50)}
                    className="w-full rounded-lg border border-teal/20 bg-white px-3 py-1.5 font-mono text-teal"
                  />
                </div>
              </div>
            )}

            {/* Portal Note */}
            <div className="rounded-xl bg-tea/30 p-3 border border-teal/10 text-[11px] text-teal/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-teal">
                <Info className="size-3.5" /> Portal Regulatory Specification:
              </div>
              <p>{isCustom ? 'Custom parameters applied.' : activePreset.notes}</p>
            </div>
          </Card>
        </div>

        {/* Right Column: Upload, Canvas Resizer, and Download (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-4 sm:p-5 border-teal/15 space-y-5">
            <div className="flex items-center justify-between border-b border-teal/10 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-2">
                <Camera className="size-3.5" /> Document & Photo Compressor
              </h4>
              <span className="text-[11px] font-mono text-teal/70">
                Target: {targetW}×{targetH}px | {minTargetKB}–{maxTargetKB}KB
              </span>
            </div>

            {/* Hidden native input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            {!originalPreviewUrl ? (
              /* Drop / Upload Zone */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-teal/30 bg-cream/20 p-8 text-center space-y-3 hover:border-teal hover:bg-cream/40 transition-all"
              >
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal/10 text-teal">
                  <Upload className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-teal">
                    Upload Candidate Photo or Signature
                  </p>
                  <p className="text-[11px] text-teal/60">
                    Supports JPG, PNG, WEBP from mobile cameras or flatbed scanners
                  </p>
                </div>
                <button
                  type="button"
                  className={cn(buttonClass({ variant: 'secondary', size: 'sm' }), 'mt-2')}
                >
                  Browse Image
                </button>
              </div>
            ) : (
              /* Preview Comparison Grid */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Original Image */}
                  <div className="rounded-xl border border-teal/10 bg-canvas/60 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-teal/70">
                      <span>Original Upload</span>
                      {originalFile && (
                        <span className="font-mono">
                          {(originalFile.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center h-48 bg-white/60 rounded-lg overflow-hidden border border-teal/10">
                      <img
                        src={originalPreviewUrl}
                        alt="Original"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    {originalDimensions && (
                      <div className="text-[10px] text-teal/60 text-center font-mono">
                        {originalDimensions.width} × {originalDimensions.height} px
                      </div>
                    )}
                  </div>

                  {/* Processed Compliant Output */}
                  <div className="rounded-xl border border-teal/30 bg-teal/5 p-3 space-y-2 relative">
                    <div className="flex items-center justify-between text-[11px] font-bold text-teal">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="size-3.5 text-teal" /> Portal Compliant
                      </span>
                      {processedBlob && (
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-teal/20 text-teal">
                          {(processedBlob.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-center h-48 bg-white rounded-lg overflow-hidden border border-teal/20 shadow-inner">
                      {processing ? (
                        <div className="text-xs text-teal/70 flex items-center gap-2">
                          <RefreshCw className="size-4 animate-spin text-teal" /> Calibrating...
                        </div>
                      ) : processedUrl ? (
                        <img
                          src={processedUrl}
                          alt="Processed Output"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : null}
                    </div>

                    {processedDimensions && (
                      <div className="text-[10px] text-teal font-mono text-center font-bold">
                        {processedDimensions.width} × {processedDimensions.height} px (JPEG)
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification Badge */}
                {processedBlob && !processing && (
                  <div className="rounded-xl bg-teal/10 p-3 flex items-center justify-between border border-teal/20 text-xs">
                    <div className="flex items-center gap-2 text-teal font-bold">
                      <ShieldCheck className="size-4 shrink-0" />
                      <span>
                        Verified: {((processedBlob.size / 1024)).toFixed(1)} KB is strictly within [{minTargetKB}KB – {maxTargetKB}KB]
                      </span>
                    </div>
                    {compressionRatio !== null && compressionRatio > 0 && (
                      <span className="text-[10px] font-mono text-teal/80 bg-white/80 px-2 py-0.5 rounded">
                        Reduced by {compressionRatio}%
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={buttonClass({ variant: 'secondary', size: 'sm' })}
                  >
                    Upload Another Image
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!processedBlob || processing}
                    className={cn(buttonClass({ variant: 'primary', size: 'sm' }), 'gap-1.5')}
                  >
                    <Download className="size-4" /> Download Compliant Image
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Slips for Active Bookings */}
          {bookings.length > 0 && (
            <Card className="p-4 sm:p-5 border-teal/15 space-y-3">
              <div className="flex items-center justify-between border-b border-teal/10 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-1.5">
                  <FileText className="size-3.5" /> Recent Citizen Assistance Queue (1-Click Slips)
                </h4>
                <span className="text-[10px] text-teal/60">Ready to print</span>
              </div>

              <div className="divide-y divide-teal/10 max-h-48 overflow-y-auto">
                {bookings.slice(0, 5).map((b) => (
                  <div
                    key={b.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-teal truncate">
                        {b.service_name || 'Assistance Request'}
                      </div>
                      <div className="text-[10px] text-teal/60 font-mono">
                        #{b.id.slice(0, 8)} • {b.partner_business_name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSlipForBooking(b)}
                      className={cn(
                        buttonClass({ variant: 'secondary', size: 'sm' }),
                        'text-xs py-1 px-2.5 gap-1 shrink-0',
                      )}
                    >
                      <Printer className="size-3" /> Print Slip
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Printable Citizen Acknowledgement Slip Modal */}
      {slipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
          <div className="w-full max-w-3xl rounded-3xl border border-teal/20 bg-white p-6 shadow-2xl space-y-6 my-auto print:border-none print:shadow-none print:p-0 print:max-w-none">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between print:hidden border-b border-teal/10 pb-4">
              <div className="flex items-center gap-2">
                <Printer className="size-5 text-teal" />
                <h3 className="text-sm font-bold text-teal">
                  Official Citizen Acknowledgement Slip Preview
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={cn(buttonClass({ variant: 'primary', size: 'sm' }), 'gap-1.5')}
                >
                  <Printer className="size-4" /> Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSlipModalOpen(false)}
                  className={buttonClass({ variant: 'secondary', size: 'sm' })}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Editable Configuration Bar (Hidden in Print) */}
            <div className="print:hidden rounded-xl bg-canvas p-3 border border-teal/10 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-teal/70 block">Candidate Name</label>
                <input
                  type="text"
                  value={manualSlipData.candidateName}
                  onChange={(e) =>
                    setManualSlipData({ ...manualSlipData, candidateName: e.target.value })
                  }
                  className="w-full rounded border border-teal/20 bg-white px-2 py-1 text-teal text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-teal/70 block">Mobile Number</label>
                <input
                  type="text"
                  value={manualSlipData.mobileNumber}
                  onChange={(e) =>
                    setManualSlipData({ ...manualSlipData, mobileNumber: e.target.value })
                  }
                  className="w-full rounded border border-teal/20 bg-white px-2 py-1 text-teal text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-teal/70 block">Application / Reg #</label>
                <input
                  type="text"
                  value={manualSlipData.applicationRef}
                  onChange={(e) =>
                    setManualSlipData({ ...manualSlipData, applicationRef: e.target.value })
                  }
                  className="w-full rounded border border-teal/20 bg-white px-2 py-1 text-teal text-xs font-mono"
                />
              </div>
            </div>

            {/* PRINTABLE SLIP CONTAINER (A4 Layout) */}
            <div
              id="citizen-slip-print-area"
              className="border-2 border-stone-800 bg-white p-6 sm:p-8 space-y-6 text-stone-900 rounded-xl print:border-2 print:border-black print:p-6"
            >
              {/* Slip Header */}
              <div className="border-b-2 border-stone-800 pb-4 text-center space-y-1">
                <div className="inline-block px-3 py-0.5 border border-stone-800 text-[11px] font-black uppercase tracking-widest text-stone-900 mb-1">
                  MeeSeva & CSC Partner Facilitation Network
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-stone-900">
                  Government Application Assistance Acknowledgement
                </h2>
                <p className="text-xs font-medium text-stone-600">
                  Official Citizen Submission & Facilitation Counter Slip • Issued in accordance with IT Citizen Service Guidelines
                </p>
              </div>

              {/* Top Reference Metadata Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-100 p-3 border border-stone-300 text-xs font-mono">
                <div>
                  <span className="block text-[10px] text-stone-500 uppercase">Acknowledgement #</span>
                  <strong className="text-stone-900">{manualSlipData.applicationRef}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-500 uppercase">Date & Time</span>
                  <span className="text-stone-900">{new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-500 uppercase">Kiosk Center</span>
                  <span className="text-stone-900 truncate block">{manualSlipData.centerName}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-500 uppercase">Operator ID</span>
                  <span className="text-stone-900">{manualSlipData.operatorName}</span>
                </div>
              </div>

              {/* Applicant & Service Details Table */}
              <div className="border border-stone-300 divide-y divide-stone-200 text-xs">
                <div className="grid grid-cols-3 p-2.5 bg-stone-50 font-bold">
                  <div className="col-span-1 text-stone-600 uppercase text-[11px]">Particulars</div>
                  <div className="col-span-2 text-stone-900 uppercase text-[11px]">Recorded Citizen Submission Details</div>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <div className="text-stone-600 font-semibold">Applicant Name</div>
                  <div className="col-span-2 font-bold text-stone-900">{manualSlipData.candidateName}</div>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <div className="text-stone-600 font-semibold">Contact Mobile</div>
                  <div className="col-span-2 font-mono text-stone-900">{manualSlipData.mobileNumber}</div>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <div className="text-stone-600 font-semibold">Application Category</div>
                  <div className="col-span-2 text-stone-900 font-medium">{manualSlipData.category}</div>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <div className="text-stone-600 font-semibold">Target Examination / Service</div>
                  <div className="col-span-2 font-bold text-stone-900">{manualSlipData.serviceName}</div>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <div className="text-stone-600 font-semibold">Submission Status</div>
                  <div className="col-span-2">
                    <span className="inline-block bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 text-[10px] uppercase rounded">
                      Application Submitted & Uploads Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Fee & Payment Breakdown */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Fee Collection Summary
                </h4>
                <table className="w-full border border-stone-300 text-xs text-left">
                  <thead className="bg-stone-100 border-b border-stone-300 text-[11px] uppercase">
                    <tr>
                      <th className="p-2 text-stone-600">Item Description</th>
                      <th className="p-2 text-stone-600">Payment Status</th>
                      <th className="p-2 text-right text-stone-600">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    <tr>
                      <td className="p-2 font-medium">Government Exam / Portal Application Fee</td>
                      <td className="p-2 text-emerald-700 font-semibold">Direct Portal Gateway</td>
                      <td className="p-2 text-right font-mono font-medium">₹{(manualSlipData.examFeePaise / 100).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Kiosk Facilitation, Scanning & Document Resizing</td>
                      <td className="p-2 text-stone-700 font-semibold">Cash / UPI at Kiosk Counter</td>
                      <td className="p-2 text-right font-mono font-medium">₹{(manualSlipData.kioskFeePaise / 100).toFixed(2)}</td>
                    </tr>
                    <tr className="bg-stone-50 font-bold border-t border-stone-400">
                      <td className="p-2" colSpan={2}>Total Amount Collected at Counter</td>
                      <td className="p-2 text-right font-mono text-sm">
                        ₹{((manualSlipData.examFeePaise + manualSlipData.kioskFeePaise) / 100).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* QR Verification & Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-stone-300 p-3 bg-stone-50 items-center">
                <div className="flex flex-col items-center justify-center p-2 bg-white border border-stone-300 rounded">
                  {/* Clean SVG QR Code Representation */}
                  <svg
                    viewBox="0 0 100 100"
                    className="size-24 text-stone-900"
                    fill="currentColor"
                  >
                    {/* Top Left Finder */}
                    <rect x="5" y="5" width="26" height="26" fill="black" />
                    <rect x="9" y="9" width="18" height="18" fill="white" />
                    <rect x="13" y="13" width="10" height="10" fill="black" />

                    {/* Top Right Finder */}
                    <rect x="69" y="5" width="26" height="26" fill="black" />
                    <rect x="73" y="9" width="18" height="18" fill="white" />
                    <rect x="77" y="13" width="10" height="10" fill="black" />

                    {/* Bottom Left Finder */}
                    <rect x="5" y="69" width="26" height="26" fill="black" />
                    <rect x="9" y="73" width="18" height="18" fill="white" />
                    <rect x="13" y="77" width="10" height="10" fill="black" />

                    {/* Timing & Alignment bars */}
                    <rect x="35" y="10" width="4" height="4" fill="black" />
                    <rect x="43" y="10" width="4" height="4" fill="black" />
                    <rect x="51" y="10" width="4" height="4" fill="black" />
                    <rect x="59" y="10" width="4" height="4" fill="black" />
                    <rect x="10" y="35" width="4" height="4" fill="black" />
                    <rect x="10" y="43" width="4" height="4" fill="black" />
                    <rect x="10" y="51" width="4" height="4" fill="black" />
                    <rect x="10" y="59" width="4" height="4" fill="black" />

                    {/* Data patterns */}
                    <rect x="35" y="35" width="8" height="8" fill="black" />
                    <rect x="50" y="35" width="8" height="8" fill="black" />
                    <rect x="65" y="35" width="8" height="8" fill="black" />
                    <rect x="35" y="50" width="8" height="8" fill="black" />
                    <rect x="50" y="50" width="8" height="8" fill="black" />
                    <rect x="65" y="50" width="8" height="8" fill="black" />
                    <rect x="35" y="65" width="8" height="8" fill="black" />
                    <rect x="50" y="65" width="8" height="8" fill="black" />
                    <rect x="65" y="65" width="8" height="8" fill="black" />
                    <rect x="45" y="78" width="6" height="6" fill="black" />
                    <rect x="55" y="78" width="6" height="6" fill="black" />
                    <rect x="65" y="78" width="6" height="6" fill="black" />
                    <rect x="78" y="45" width="6" height="6" fill="black" />
                    <rect x="78" y="55" width="6" height="6" fill="black" />
                    <rect x="78" y="65" width="6" height="6" fill="black" />
                  </svg>
                  <span className="text-[8px] font-mono font-bold text-stone-500 mt-1 uppercase">
                    Scan for E-Verification
                  </span>
                </div>

                <div className="sm:col-span-2 text-[10px] text-stone-600 space-y-1">
                  <div className="font-bold text-stone-900 uppercase">Important Instructions:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Preserve this physical acknowledgement slip until the issue of hall ticket / interview call.</li>
                    <li>Official exam admit cards and correction window alerts will be notified on your registered mobile number.</li>
                    <li>For application status tracking or grievance redressal, contact your MeeSeva / CSC center with Acknowledgement #{manualSlipData.applicationRef}.</li>
                  </ul>
                </div>
              </div>

              {/* Seal & Signatures Row */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-center">
                <div className="space-y-12">
                  <div className="border-b border-stone-400 pb-2"></div>
                  <div className="text-stone-700 font-semibold uppercase text-[10px]">
                    Applicant's Signature
                  </div>
                </div>
                <div className="space-y-12">
                  <div className="border-b border-stone-400 pb-2"></div>
                  <div className="text-stone-700 font-semibold uppercase text-[10px]">
                    Authorized Kiosk Seal & Operator Signature
                  </div>
                </div>
              </div>

              {/* Watermark / Footer note */}
              <div className="text-center text-[9px] text-stone-400 pt-2 border-t border-stone-200">
                Generated via ApplyFields Kiosk Service Terminal • System Integrity Verified • www.applyfields.com
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

