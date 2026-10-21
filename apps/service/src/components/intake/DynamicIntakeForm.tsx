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
      <div className="cut-corner-card rounded-[24px] border border-white bg-white p-5 space-y-2 shadow-clay-card">
        <label className="block text-xs font-black text-[#082046]">
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
          className="w-full rounded-xl bg-[#edf2f8] border border-[#d5deea] p-3 text-xs text-[#082046] placeholder-[#7896bc] focus:border-[#0e7bf4] focus:outline-none font-medium shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]"
        />
        <p className="text-[11px] text-[#526987]">
          This note is securely transmitted to the partner desk alongside your slot reservation.
        </p>
      </div>
    </div>
  );
}
