'use client';

import React, { useState } from 'react';
import {
  Printer,
  UploadCloud,
  FileCheck2,
  Trash2,
  Calculator,
  Layers,
  FileText,
} from 'lucide-react';

export interface XeroxUploadedFile {
  id: string;
  name: string;
  sizeMb: number;
  pageCount: number;
}

export interface XeroxIntakeData {
  files: XeroxUploadedFile[];
  printMode: 'black_and_white' | 'color';
  paperSize: 'A4' | 'Legal' | 'A3';
  sides: 'single_sided' | 'double_sided';
  copies: number;
  finishing: 'none' | 'corner_staple' | 'spiral_binding' | 'hard_cover_project_binding' | 'lamination';
  pickupMode: 'store_visit_slot' | 'express_counter';
  estimatedCost: number;
}

interface XeroxIntakeFormProps {
  initialData?: Partial<XeroxIntakeData>;
  onChange: (data: XeroxIntakeData) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function XeroxIntakeForm({
  initialData,
  onChange,
  onValidationChange,
}: XeroxIntakeFormProps) {
  const [files, setFiles] = useState<XeroxUploadedFile[]>(
    initialData?.files || [
      { id: 'f-1', name: 'Application_Document_Set.pdf', sizeMb: 2.4, pageCount: 8 },
    ],
  );
  const [printMode, setPrintMode] = useState<XeroxIntakeData['printMode']>(
    initialData?.printMode || 'black_and_white',
  );
  const [paperSize, setPaperSize] = useState<XeroxIntakeData['paperSize']>(
    initialData?.paperSize || 'A4',
  );
  const [sides, setSides] = useState<XeroxIntakeData['sides']>(
    initialData?.sides || 'double_sided',
  );
  const [copies, setCopies] = useState<number>(initialData?.copies || 1);
  const [finishing, setFinishing] = useState<XeroxIntakeData['finishing']>(
    initialData?.finishing || 'corner_staple',
  );
  const [pickupMode, setPickupMode] = useState<XeroxIntakeData['pickupMode']>(
    initialData?.pickupMode || 'store_visit_slot',
  );

  // Calculate costs dynamically
  const totalOriginalPages = files.reduce((acc, f) => acc + f.pageCount, 0);
  const pageRate = printMode === 'color' ? 10 : 2;
  const paperMultiplier = paperSize === 'A3' ? 2 : paperSize === 'Legal' ? 1.25 : 1;
  const finishingCost =
    finishing === 'spiral_binding'
      ? 35
      : finishing === 'hard_cover_project_binding'
        ? 150
        : finishing === 'lamination'
          ? 20
          : 0;

  const estimatedCost = Math.round(
    totalOriginalPages * pageRate * paperMultiplier * copies + finishingCost * copies,
  );

  function broadcast(updatedOverrides?: Partial<XeroxIntakeData>) {
    const nextData: XeroxIntakeData = {
      files: updatedOverrides?.files ?? files,
      printMode: updatedOverrides?.printMode ?? printMode,
      paperSize: updatedOverrides?.paperSize ?? paperSize,
      sides: updatedOverrides?.sides ?? sides,
      copies: updatedOverrides?.copies ?? copies,
      finishing: updatedOverrides?.finishing ?? finishing,
      pickupMode: updatedOverrides?.pickupMode ?? pickupMode,
      estimatedCost,
    };
    onChange(nextData);
    onValidationChange?.(nextData.files.length > 0 && nextData.copies >= 1);
  }

  function handleSimulatedUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const newItems: XeroxUploadedFile[] = Array.from(e.target.files).map((file, idx) => ({
      id: `file-${Date.now()}-${idx}`,
      name: file.name,
      sizeMb: Number((file.size / (1024 * 1024)).toFixed(1)),
      // Random realistic page count between 4 and 25 for demonstration
      pageCount: Math.floor(Math.random() * 18) + 4,
    }));
    const nextFiles = [...files, ...newItems];
    setFiles(nextFiles);
    broadcast({ files: nextFiles });
  }

  function removeFile(id: string) {
    const nextFiles = files.filter((f) => f.id !== id);
    setFiles(nextFiles);
    broadcast({ files: nextFiles });
  }

  return (
    <div className="space-y-5 cut-corner-card rounded-[28px] border border-white bg-white p-6 shadow-clay-card text-[#082046]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="cut-corner-badge bg-[#E0EDFB] px-2.5 py-1 text-[11px] font-bold text-[#0E7BF4]">
              High-Speed Xerox &amp; Print Desk
            </span>
            <span className="text-xs text-slate-500 font-medium">Zero-Wait Counter Token</span>
          </div>
          <h3 className="text-base font-black text-[#082046] mt-1.5 tracking-tight">Printing &amp; Finishing Specifications</h3>
        </div>

        <div className="inline-flex items-center gap-1.5 cut-corner-badge bg-[#082046] text-[#38BDF8] px-3.5 py-1.5 text-xs font-bold shadow-sm">
          <Calculator className="h-3.5 w-3.5 text-[#38BDF8]" />
          <span>Estimated: ₹{estimatedCost} ({totalOriginalPages * copies} pages)</span>
        </div>
      </div>

      {/* Drag & Drop File Upload Area */}
      <div>
        <label className="block text-xs font-bold text-[#082046] mb-1.5">
          Upload PDF / Document Files for Printing <span className="text-rose-500">*</span>
        </label>
        <div className="relative border-2 border-dashed border-[#0E7BF4]/30 hover:border-[#0E7BF4] transition-all rounded-2xl p-6 text-center bg-[#F0F4F8] shadow-clay-inset group">
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
            onChange={handleSimulatedUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="h-11 w-11 rounded-2xl bg-white text-[#0E7BF4] shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#082046]">
                Click or drag &amp; drop PDF documents here
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Supports PDF, DOCX, JPG up to 50MB per file with automatic page detection
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded File Pill list */}
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#F0F4F8] px-3.5 py-2 text-xs shadow-sm"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FileText className="h-4 w-4 text-[#0E7BF4] shrink-0" />
                  <span className="font-semibold text-[#082046] truncate max-w-xs">{file.name}</span>
                  <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600 font-mono font-medium">
                    {file.pageCount} pages · {file.sizeMb} MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print Mode & Paper Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#082046] mb-1.5">
            Colour Mode
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'black_and_white', label: 'Black & White', price: '₹2 / page' },
              { id: 'color', label: 'Vibrant Colour', price: '₹10 / page' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setPrintMode(mode.id as XeroxIntakeData['printMode']);
                  broadcast({ printMode: mode.id as XeroxIntakeData['printMode'] });
                }}
                className={`flex flex-col text-left p-3 rounded-xl cut-corner-btn text-xs transition-all ${
                  printMode === mode.id
                    ? 'bg-gradient-to-r from-[#0E7BF4] to-[#082046] text-white shadow-clay-btn-azure'
                    : 'bg-[#F0F4F8] text-[#082046] border border-slate-200 hover:border-[#0E7BF4]/40'
                }`}
              >
                <span className="font-bold">{mode.label}</span>
                <span className={`text-[11px] font-semibold mt-0.5 ${printMode === mode.id ? 'text-[#38BDF8]' : 'text-[#0E7BF4]'}`}>
                  {mode.price}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#082046] mb-1.5">
            Paper Size &amp; Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'A4', label: 'A4 Standard', desc: '80 GSM' },
              { id: 'Legal', label: 'Legal / Deed', desc: 'Court format' },
              { id: 'A3', label: 'A3 Chart', desc: 'Large format' },
            ].map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => {
                  setPaperSize(size.id as XeroxIntakeData['paperSize']);
                  broadcast({ paperSize: size.id as XeroxIntakeData['paperSize'] });
                }}
                className={`flex flex-col text-left p-2.5 rounded-xl cut-corner-btn text-xs transition-all ${
                  paperSize === size.id
                    ? 'bg-gradient-to-r from-[#0E7BF4] to-[#082046] text-white shadow-clay-btn-azure'
                    : 'bg-[#F0F4F8] text-[#082046] border border-slate-200 hover:border-[#0E7BF4]/40'
                }`}
              >
                <span className="font-bold">{size.label}</span>
                <span className={`text-[10px] mt-0.5 ${paperSize === size.id ? 'text-[#E0EDFB]' : 'text-slate-500 font-medium'}`}>
                  {size.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sides, Copies, Finishing */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-[#082046] mb-1">
            Print Sides
          </label>
          <select
            value={sides}
            onChange={(e) => {
              const val = e.target.value as XeroxIntakeData['sides'];
              setSides(val);
              broadcast({ sides: val });
            }}
            className="w-full rounded-xl border border-slate-200 bg-[#F0F4F8] px-3 py-2 text-xs text-[#082046] font-medium shadow-clay-inset focus:border-[#0E7BF4] focus:outline-none focus:ring-2 focus:ring-[#0E7BF4]/20"
          >
            <option value="single_sided">Single-Sided (One page per sheet)</option>
            <option value="double_sided">Double-Sided / Duplex (Paper saver)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#082046] mb-1">
            Number of Complete Copies
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={copies}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value) || 1);
              setCopies(val);
              broadcast({ copies: val });
            }}
            className="w-full rounded-xl border border-slate-200 bg-[#F0F4F8] px-3.5 py-2 text-xs text-[#082046] font-medium shadow-clay-inset focus:border-[#0E7BF4] focus:outline-none focus:ring-2 focus:ring-[#0E7BF4]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#082046] mb-1">
            Finishing &amp; Binding
          </label>
          <select
            value={finishing}
            onChange={(e) => {
              const val = e.target.value as XeroxIntakeData['finishing'];
              setFinishing(val);
              broadcast({ finishing: val });
            }}
            className="w-full rounded-xl border border-slate-200 bg-[#F0F4F8] px-3 py-2 text-xs text-[#082046] font-medium shadow-clay-inset focus:border-[#0E7BF4] focus:outline-none focus:ring-2 focus:ring-[#0E7BF4]/20"
          >
            <option value="none">No Binding (Loose sheets)</option>
            <option value="corner_staple">Corner Staple (Free)</option>
            <option value="spiral_binding">Spiral / Coil Binding (+₹35)</option>
            <option value="hard_cover_project_binding">Hard Cover Golden Embossed (+₹150)</option>
            <option value="lamination">Thermal Lamination (+₹20/sheet)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
