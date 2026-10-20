'use client';

import React, { useState } from 'react';
import { PanCardIntakeForm, type PanIntakeData } from './PanCardIntakeForm';
import { AadhaarIntakeForm, type AadhaarIntakeData } from './AadhaarIntakeForm';
import { MeesevaIntakeForm, type MeesevaIntakeData } from './MeesevaIntakeForm';
import { XeroxIntakeForm, type XeroxIntakeData } from './XeroxIntakeForm';
import { FileCheck, Sparkles, AlertCircle } from 'lucide-react';
import type { CartItem } from '@/lib/cart-context';

export interface CombinedIntakePayload {
  panData?: PanIntakeData;
  aadhaarData?: AadhaarIntakeData;
  meesevaData?: MeesevaIntakeData;
  xeroxData?: XeroxIntakeData;
  generalNotes?: string;
}

interface DynamicIntakeFormProps {
  items: CartItem[];
  onChange: (payload: CombinedIntakePayload) => void;
  onValidityChange?: (isValid: boolean) => void;
}

export function DynamicIntakeForm({
  items,
  onChange,
  onValidityChange,
}: DynamicIntakeFormProps) {
  const [payload, setPayload] = useState<CombinedIntakePayload>({});
  const [generalNotes, setGeneralNotes] = useState('');

  // Classify requirements from cart items
  const hasPan = items.some(
    (it) =>
      it.title.toLowerCase().includes('pan') ||
      it.category.toLowerCase().includes('pan'),
  );

  const hasAadhaar = items.some(
    (it) =>
      it.title.toLowerCase().includes('aadhaar') ||
      it.category.toLowerCase().includes('aadhaar'),
  );

  const hasMeeseva = items.some(
    (it) =>
      it.title.toLowerCase().includes('meeseva') ||
      it.title.toLowerCase().includes('caste') ||
      it.title.toLowerCase().includes('income') ||
      it.title.toLowerCase().includes('certificate') ||
      it.category.toLowerCase().includes('certificate') ||
      it.category.toLowerCase().includes('meeseva'),
  );

  const hasXerox = items.some(
    (it) =>
      it.title.toLowerCase().includes('xerox') ||
      it.title.toLowerCase().includes('print') ||
      it.title.toLowerCase().includes('scan') ||
      it.title.toLowerCase().includes('lamination') ||
      it.category.toLowerCase().includes('printing') ||
      it.category.toLowerCase().includes('xerox'),
  );

  // Fallback if no specific category matched
  const isGenericOnly = !hasPan && !hasAadhaar && !hasMeeseva && !hasXerox;

  function updatePayload(patch: Partial<CombinedIntakePayload>) {
    const next = { ...payload, ...patch };
    setPayload(next);
    onChange(next);
    onValidityChange?.(true);
  }

  return (
    <div className="space-y-6">
      {/* Category Intakes */}
      {hasPan && (
        <PanCardIntakeForm
          initialData={payload.panData}
          onChange={(panData) => updatePayload({ panData })}
        />
      )}

      {hasAadhaar && (
        <AadhaarIntakeForm
          initialData={payload.aadhaarData}
          onChange={(aadhaarData) => updatePayload({ aadhaarData })}
        />
      )}

      {hasMeeseva && (
        <MeesevaIntakeForm
          initialData={payload.meesevaData}
          onChange={(meesevaData) => updatePayload({ meesevaData })}
        />
      )}

      {hasXerox && (
        <XeroxIntakeForm
          initialData={payload.xeroxData}
          onChange={(xeroxData) => updatePayload({ xeroxData })}
        />
      )}

      {/* General Instructions & Candidate specific Notes */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
        <label className="block text-xs font-semibold text-slate-300">
          Special Instructions for the Operator (Optional)
        </label>
        <textarea
          rows={2}
          placeholder="Mention any urgent deadline, specific regional language requirement, or custom instructions..."
          value={generalNotes}
          onChange={(e) => {
            setGeneralNotes(e.target.value);
            updatePayload({ generalNotes: e.target.value });
          }}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
        />
        <p className="text-[11px] text-slate-500">
          This note is securely transmitted to the partner desk alongside your slot reservation.
        </p>
      </div>
    </div>
  );
}
