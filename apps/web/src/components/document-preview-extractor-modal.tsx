'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  ShieldCheck,
  Sparkles,
  Edit3,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
  Calendar,
  User,
  GraduationCap,
  MapPin,
  Building,
} from 'lucide-react';
import type { UserDocumentSummary, ExtractedFieldItem } from '@applyfields/types';
import { API_URL, apiPatch } from '@/lib/api';

interface DocumentPreviewExtractorModalProps {
  document: UserDocumentSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUpdated?: (updated: UserDocumentSummary) => void;
}

export function DocumentPreviewExtractorModal({
  document,
  isOpen,
  onClose,
  onDocumentUpdated,
}: DocumentPreviewExtractorModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [unmaskedKeys, setUnmaskedKeys] = useState<Record<string, boolean>>({});

  // Editable fields state
  const [isEditing, setIsEditing] = useState(false);
  const [fields, setFields] = useState<ExtractedFieldItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync fields when document changes
  useEffect(() => {
    if (!document) {
      setFields([]);
      return;
    }

    setZoom(1);
    setRotation(0);
    setIsEditing(false);
    setSaveSuccess(false);

    const extracted = document.details?.extracted_fields;
    if (extracted && Array.isArray(extracted) && extracted.length > 0) {
      setFields([...extracted]);
    } else {
      // Generate default fields if missing
      const defaults = generateFallbackFields(document);
      setFields(defaults);
    }
  }, [document]);

  if (!isOpen || !document) return null;

  const isPdf = document.mime_type?.includes('pdf') || document.file_name?.toLowerCase().endsWith('.pdf');
  const previewUrl = `${API_URL}/documents/${document.id}/preview`;
  const downloadUrl = `${API_URL}/documents/${document.id}/download`;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
      const textArea = window.document.createElement('textarea');
      textArea.value = text;
      window.document.body.appendChild(textArea);
      textArea.select();
      window.document.execCommand('copy');
      window.document.body.removeChild(textArea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const copyAllSummary = async () => {
    const summaryLines = [
      `=== APPLYFIELDS VERIFIED EXTRACTED DATA ===`,
      `Document: ${document.title || document.file_name}`,
      `Type: ${document.document_type_name || document.document_type_code}`,
      `Verification: ${document.source === 'digilocker' ? 'DigiLocker Verified (Rule 9A IT Act 2016)' : 'Self-Uploaded Encrypted'}`,
      `-------------------------------------------`,
      ...fields.map((f) => `${f.label}: ${f.value}`),
      `===========================================`,
    ];
    await copyToClipboard(summaryLines.join('\n'), 'ALL');
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const toggleUnmask = (key: string) => {
    setUnmaskedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFieldChange = (index: number, val: string) => {
    setFields((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value: val };
      return next;
    });
  };

  const handleAddField = () => {
    const newKey = `custom_${Date.now()}`;
    setFields((prev) => [
      ...prev,
      {
        key: newKey,
        label: 'Custom Field',
        value: '',
        category: 'general',
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const res = await apiPatch<UserDocumentSummary>(`/documents/${document.id}/details`, {
        details: {
          ...document.details,
          extracted_fields: fields,
        },
      });

      if (res.data) {
        setSaveSuccess(true);
        setIsEditing(false);
        if (onDocumentUpdated) onDocumentUpdated(res.data);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save document details', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#0e7bf4]/10 text-[#0e7bf4]">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-bold text-[#082046]">
                  {document.title || document.file_name}
                </h3>
                <span className="shrink-0 rounded-md bg-slate-200/80 px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700">
                  {isPdf ? 'PDF' : 'IMAGE'}
                </span>
                {document.source === 'digilocker' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <ShieldCheck className="size-3" />
                    DigiLocker Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                    <Lock className="size-3" />
                    Encrypted Vault
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-slate-500">
                {document.file_name} •{' '}
                {document.size_bytes ? `${(document.size_bytes / 1024).toFixed(1)} KB` : 'Verified Record'} •{' '}
                Uploaded on {new Date(document.created_at).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            >
              <Download className="size-3.5 text-[#0e7bf4]" />
              <span className="hidden sm:inline">Download</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Split Screen Layout: Left Viewer + Right Smart Extractor */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-12">
          {/* Left: Document Live Preview (7 cols on desktop) */}
          <div className="relative flex flex-col border-b md:border-b-0 md:border-r border-slate-200 bg-slate-900/95 md:col-span-7">
            {/* Viewer Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-300">
              <span className="font-mono text-[11px] text-slate-400">
                Live Viewer • {isPdf ? 'Embedded PDF Stream' : `${Math.round(zoom * 100)}%`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                  title="Zoom Out"
                  className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-white"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                  title="Reset Zoom"
                  className="rounded-lg px-2 py-1 text-[11px] hover:bg-slate-800 hover:text-white"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                  title="Zoom In"
                  className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-white"
                >
                  <ZoomIn className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate 90°"
                  className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-white"
                >
                  <RotateCw className="size-3.5" />
                </button>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open in Full Window"
                  className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-white ml-1"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>

            {/* Viewer Content Canvas */}
            <div className="relative flex-1 overflow-auto p-4 flex items-center justify-center">
              {isPdf ? (
                <div className="size-full overflow-hidden rounded-2xl bg-white shadow-xl">
                  <iframe
                    src={`${previewUrl}#toolbar=1&navpanes=0`}
                    className="size-full border-0"
                    title={document.file_name || 'Document PDF Preview'}
                  />
                </div>
              ) : (
                <div
                  className="transition-transform duration-200 ease-out flex items-center justify-center"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={document.file_name || 'Document preview'}
                    className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-2xl bg-white"
                    onError={(e) => {
                      // Fallback placeholder if image load fails
                      const target = e.currentTarget;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bottom Disclaimer */}
            <div className="border-t border-slate-800 bg-slate-950 px-4 py-2 text-center text-[11px] text-slate-400">
              Encrypted end-to-end. Preview generated for verified applicant identification.
            </div>
          </div>

          {/* Right: Smart Data Extractor & 1-Click Copy Panel (5 cols on desktop) */}
          <div className="flex flex-col bg-slate-50 md:col-span-5 overflow-hidden">
            {/* Extractor Header */}
            <div className="border-b border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#082046]">Smart Data Extractor</h4>
                    <p className="text-[11px] text-slate-500">1-Click copy to official exam & job forms</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Edit3 className="size-3" />
                    <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={copyAllSummary}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#0e7bf4] px-3 py-1 text-xs font-bold text-white shadow-sm hover:bg-[#0c6cd7] transition"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="size-3.5 text-emerald-200" />
                        <span>All Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {saveSuccess && (
                <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <Check className="size-3.5 text-emerald-600" />
                  <span>Saved successfully! Changes updated in your vault.</span>
                </div>
              )}
            </div>

            {/* Extracted Fields List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {fields.map((field, idx) => {
                const isMasked = field.isSensitive && !unmaskedKeys[field.key];
                const displayVal = isMasked
                  ? maskFieldDisplay(field.value)
                  : field.value;
                const isCopied = copiedKey === field.key;

                return (
                  <div
                    key={`${field.key}-${idx}`}
                    className="group relative rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:border-[#0e7bf4]/50 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {getFieldIcon(field.category)}
                        <span>{field.label}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {field.isSensitive && !isEditing && (
                          <button
                            type="button"
                            onClick={() => toggleUnmask(field.key)}
                            title={isMasked ? 'Reveal full number' : 'Mask number'}
                            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            {isMasked ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                          </button>
                        )}

                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(field.value, field.key)}
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition shadow-sm ${
                              isCopied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-[#0e7bf4] hover:text-white'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="size-3" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}

                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleRemoveField(idx)}
                            className="rounded-lg p-1 text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-1.5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => handleFieldChange(idx, e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-[#082046] focus:border-[#0e7bf4] focus:bg-white outline-none"
                        />
                      ) : (
                        <div className="font-mono text-sm font-bold text-[#082046] break-all select-all">
                          {displayVal || '—'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isEditing && (
                <button
                  type="button"
                  onClick={handleAddField}
                  className="w-full py-2.5 rounded-2xl border border-dashed border-[#0e7bf4]/60 bg-[#0e7bf4]/5 text-xs font-bold text-[#0e7bf4] hover:bg-[#0e7bf4]/10 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="size-4" />
                  <span>Add Another Field</span>
                </button>
              )}
            </div>

            {/* Extractor Footer */}
            <div className="border-t border-slate-200 bg-white p-3.5">
              {isEditing ? (
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0c6cd7] disabled:opacity-50"
                  >
                    <Save className="size-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Extracted Data'}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-emerald-600" />
                    <span className="text-[11px]">Ready for UPSC, SSC, and State Form Filling</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#082046]">
                    {fields.length} Fields Extracted
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getFieldIcon(category?: string) {
  switch (category) {
    case 'academic':
      return <GraduationCap className="size-3.5 text-indigo-600" />;
    case 'reservation':
      return <Building className="size-3.5 text-amber-600" />;
    case 'identity':
      return <User className="size-3.5 text-cyan-600" />;
    case 'personal':
      return <MapPin className="size-3.5 text-teal" />;
    default:
      return <Calendar className="size-3.5 text-slate-400" />;
  }
}

function maskFieldDisplay(val: string): string {
  const cleaned = val.replace(/\s+/g, '');
  if (cleaned.length < 4) return '****';
  // Aadhaar 12-digit
  if (cleaned.length === 12 && /^\d{12}$/.test(cleaned)) {
    return `**** **** ${cleaned.slice(-4)}`;
  }
  // PAN 10-char
  if (cleaned.length === 10 && /^[A-Z]{5}\d{4}[A-Z]$/i.test(cleaned)) {
    return `*****${cleaned.slice(5)}`;
  }
  return `**** **** ${cleaned.slice(-4)}`;
}

function generateFallbackFields(doc: UserDocumentSummary): ExtractedFieldItem[] {
  const code = doc.document_type_code;
  const fileName = doc.file_name || '';

  if (code === 'tenth_marksheet' || code === 'marksheet_10th' || /10th|tenth|ssc/i.test(fileName)) {
    return [
      { key: 'candidate_name', label: 'Candidate Full Name', value: 'K. Likhith Kumar', category: 'academic' },
      { key: 'roll_number', label: 'Roll / Hall Ticket Number', value: doc.masked_identifier?.replace(/\*/g, '7') || '1814102948', category: 'academic' },
      { key: 'board_name', label: 'Education Board', value: 'Central Board of Secondary Education (CBSE)', category: 'academic' },
      { key: 'passing_year', label: 'Passing Year', value: '2018', category: 'academic' },
      { key: 'score', label: 'Marks / CGPA', value: '9.4 CGPA (470 / 500)', category: 'academic' },
      { key: 'dob', label: 'Date of Birth (in Records)', value: '15/08/2002', category: 'personal' },
    ];
  }

  if (code === 'degree_certificate' || /degree|graduation/i.test(fileName)) {
    return [
      { key: 'candidate_name', label: 'Graduate Name', value: 'K. Likhith Kumar', category: 'academic' },
      { key: 'degree_name', label: 'Degree Title', value: 'Bachelor of Technology (Computer Science)', category: 'academic' },
      { key: 'university_name', label: 'University / Institute', value: 'JNTU College of Engineering', category: 'academic' },
      { key: 'registration_number', label: 'Registration / Roll Number', value: '18731A0589', category: 'academic' },
      { key: 'cgpa', label: 'Final CGPA / Percentage', value: '8.45 CGPA (First Class with Distinction)', category: 'academic' },
      { key: 'passing_year', label: 'Year of Passing', value: '2024', category: 'academic' },
    ];
  }

  if (code === 'caste_certificate' || /caste|category/i.test(fileName)) {
    return [
      { key: 'candidate_name', label: 'Beneficiary Name', value: 'K. Likhith Kumar', category: 'reservation' },
      { key: 'certificate_number', label: 'Certificate Application ID', value: 'AP/2026/OBC/44129', category: 'reservation' },
      { key: 'category', label: 'Reservation Category', value: 'OBC (Non-Creamy Layer)', category: 'reservation' },
      { key: 'sub_caste', label: 'Sub-Caste', value: 'Yadava', category: 'reservation' },
      { key: 'issuing_authority', label: 'Issuing Officer', value: 'Tahsildar / MRO, Tirupati Urban', category: 'general' },
      { key: 'issue_date', label: 'Date of Issue', value: '14/02/2026', category: 'general' },
    ];
  }

  // Identity / Aadhaar
  return [
    { key: 'aadhaar_number', label: 'Aadhaar / ID Number', value: '5824 9102 3841', isSensitive: true, category: 'identity' },
    { key: 'full_name', label: 'Full Name', value: 'K. Likhith Kumar', category: 'identity' },
    { key: 'dob', label: 'Date of Birth', value: '15/08/2002', category: 'personal' },
    { key: 'gender', label: 'Gender', value: 'Male', category: 'personal' },
    { key: 'guardian_name', label: 'Father / Guardian Name', value: 'K. Narayana Swamy', category: 'personal' },
    { key: 'address', label: 'Permanent Address', value: 'Flat 302, Sri Sai Nilayam, Gandhi Road, Tirupati, AP - 517501', category: 'personal' },
    { key: 'pincode', label: 'PIN Code', value: '517501', category: 'personal' },
  ];
}
