'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Card } from '@applyfields/ui';
import { apiGet, apiPost, apiDelete, API_URL } from '@/lib/api';
import { convertFileToBase64 } from '@/lib/resume-parser';
import type {
  UserDocumentSummary,
  UserDocumentListResponse,
  DocumentReadinessCheck,
} from '@applyfields/types';
import {
  Download,
  FileCheck2,
  FileText,
  FolderLock,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  Camera,
  PenTool,
  Award,
  IdCard,
  Plus,
  Lock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Copy,
  X,
} from 'lucide-react';
import { DocumentPreviewExtractorModal } from '@/components/document-preview-extractor-modal';
import { useLanguage } from '@/lib/i18n/language-context';

interface DocTypeConfig {
  code: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  allowedFormats: string;
  hasIdentifier: boolean;
  identifierPlaceholder?: string;
  identifierLabel?: string;
}

const DOCUMENT_TYPES: DocTypeConfig[] = [
  {
    code: 'tenth_marksheet',
    label: '10th Class Marksheet',
    description: 'Mandatory proof of date of birth and secondary education board matriculation.',
    icon: <GraduationCap className="size-5 text-blue-600" />,
    allowedFormats: 'PDF, JPG, PNG (Max 5MB)',
    hasIdentifier: true,
    identifierLabel: 'Roll / Certificate Number',
    identifierPlaceholder: 'e.g. 10293847',
  },
  {
    code: 'degree_certificate',
    label: 'Graduation / Degree Certificate',
    description: 'B.A, B.Sc, B.Tech, or equivalent provisional or original degree certificate.',
    icon: <Award className="size-5 text-indigo-600" />,
    allowedFormats: 'PDF, JPG, PNG (Max 5MB)',
    hasIdentifier: true,
    identifierLabel: 'Registration / Degree Number',
    identifierPlaceholder: 'e.g. DEG-2022-9812',
  },
  {
    code: 'caste_certificate',
    label: 'Caste / Reservation Certificate',
    description: 'OBC-NCL, SC, ST, or EWS income & asset certificate for reservation claims.',
    icon: <FileCheck2 className="size-5 text-amber-600" />,
    allowedFormats: 'PDF, JPG, PNG (Max 5MB)',
    hasIdentifier: true,
    identifierLabel: 'Certificate Application Number',
    identifierPlaceholder: 'e.g. AP/2026/OBC/44129',
  },
  {
    code: 'photo',
    label: 'Passport Size Photograph',
    description: 'Recent clear photograph with white background (meeting SSC/UPSC pixel guidelines).',
    icon: <Camera className="size-5 text-emerald-600" />,
    allowedFormats: 'JPG, PNG (Max 2MB)',
    hasIdentifier: false,
  },
  {
    code: 'signature',
    label: 'Scanned Signature',
    description: 'Black ink signature on white paper as required by official examination portals.',
    icon: <PenTool className="size-5 text-purple-600" />,
    allowedFormats: 'JPG, PNG (Max 2MB)',
    hasIdentifier: false,
  },
  {
    code: 'resume',
    label: 'Resume / Curriculum Vitae',
    description: 'Structured resume for university admissions, PSU interview panels, and apprenticeships.',
    icon: <FileText className="size-5 text-teal" />,
    allowedFormats: 'PDF (Max 5MB)',
    hasIdentifier: false,
  },
  {
    code: 'identity_proof',
    label: 'Identity Proof (Aadhaar / Voter / PAN)',
    description: 'Masked government photo ID. Sensitive digits are always masked (**** **** 1234).',
    icon: <IdCard className="size-5 text-cyan-600" />,
    allowedFormats: 'PDF, JPG, PNG (Max 5MB)',
    hasIdentifier: true,
    identifierLabel: 'Aadhaar / ID Number',
    identifierPlaceholder: 'e.g. 1234 5678 9012',
  },
];

const POPULAR_OPPORTUNITIES = [
  { slug: 'ssc-cgl-2026', label: 'SSC CGL 2026 (Tier-I)' },
  { slug: 'upsc-cse-2026', label: 'UPSC Civil Services 2026' },
  { slug: 'rrb-ntpc-2026', label: 'RRB NTPC Graduate Level' },
  { slug: 'ibps-po-2026', label: 'IBPS Probationary Officer (CRP XIV)' },
];

export default function DocumentsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const getDocTypeLabel = (code: string, fallback: string) => {
    switch (code) {
      case 'tenth_marksheet':
        return t('doc_type_tenth', fallback);
      case 'degree_certificate':
        return t('doc_type_degree', fallback);
      case 'caste_certificate':
        return t('doc_type_caste', fallback);
      case 'photo':
        return t('doc_type_photo', fallback);
      case 'signature':
        return t('doc_type_signature', fallback);
      case 'resume':
        return t('doc_type_resume', fallback);
      case 'identity_proof':
        return t('doc_type_identity', fallback);
      default:
        return fallback;
    }
  };

  const getDocTypeDesc = (code: string, fallback: string) => {
    switch (code) {
      case 'tenth_marksheet':
        return t('doc_type_tenth_desc', fallback);
      case 'degree_certificate':
        return t('doc_type_degree_desc', fallback);
      case 'caste_certificate':
        return t('doc_type_caste_desc', fallback);
      case 'photo':
        return t('doc_type_photo_desc', fallback);
      case 'signature':
        return t('doc_type_signature_desc', fallback);
      case 'resume':
        return t('doc_type_resume_desc', fallback);
      case 'identity_proof':
        return t('doc_type_identity_desc', fallback);
      default:
        return fallback;
    }
  };
  const [documents, setDocuments] = useState<UserDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAuth = () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('currentUser');
      setIsAuthenticated(Boolean(storedToken || storedUser));
    };

    checkAuth();
    window.addEventListener('auth-changed', checkAuth);
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('auth-changed', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('tenth_marksheet');
  const [docTitle, setDocTitle] = useState('');
  const [docIdentifier, setDocIdentifier] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Preview & Extractor modal state
  const [inspectingDoc, setInspectingDoc] = useState<UserDocumentSummary | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  function handleDocumentUpdated(updated: UserDocumentSummary) {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d)),
    );
    setInspectingDoc(updated);
  }

  // Readiness checker state
  const [selectedOpportunitySlug, setSelectedOpportunitySlug] = useState('ssc-cgl-2026');
  const [readinessData, setReadinessData] = useState<DocumentReadinessCheck | null>(null);
  const [loadingReadiness, setLoadingReadiness] = useState(false);

  // Load documents
  async function fetchDocuments() {
    setLoading(true);
    try {
      const res = await apiGet<UserDocumentListResponse>('/documents');
      if (res?.items) {
        setDocuments(res.items);
      }
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }

  // Load readiness check
  async function fetchReadiness(slug: string) {
    if (!slug) return;
    setLoadingReadiness(true);
    try {
      const res = await apiGet<DocumentReadinessCheck>(`/documents/readiness/${slug}`);
      if (res) {
        setReadinessData(res);
      }
    } catch {
      // fallback
    } finally {
      setLoadingReadiness(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (selectedOpportunitySlug) {
      fetchReadiness(selectedOpportunitySlug);
    }
  }, [selectedOpportunitySlug, documents]);

  function openUploadModal(typeCode: string) {
    if (isAuthenticated === false) {
      router.push('/login?redirect=/documents');
      return;
    }
    const config = DOCUMENT_TYPES.find((d) => d.code === typeCode);
    setSelectedDocType(typeCode);
    setDocTitle(config ? getDocTypeLabel(config.code, config.label) : '');
    setDocIdentifier('');
    setSelectedFile(null);
    setError(null);
    setMessage(null);
    setIsUploadModalOpen(true);
  }

  function handleFileSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose a file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setMessage(null);

    try {
      const fileBase64 = await convertFileToBase64(selectedFile);
      const res = await apiPost<{ ok: boolean; document: UserDocumentSummary }>('/documents', {
        documentTypeCode: selectedDocType,
        title: docTitle.trim() || undefined,
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/pdf',
        fileBase64,
        identifierNumber: docIdentifier.trim() || undefined,
      });

      if (res.error || !res.data) {
        throw new Error(res.error || 'Failed to upload document.');
      }

      setMessage(`${docTitle || 'Document'} securely uploaded and verified!`);
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      await fetchDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(docId: string, fileName: string) {
    try {
      const downloadUrl = `${API_URL}/documents/${docId}/download`;
      // Open signed download URL in new tab or trigger browser download
      window.open(downloadUrl, '_blank');
    } catch {
      setError('Could not download file.');
    }
  }

  async function handleDelete(docId: string, docName: string) {
    if (!confirm(`Are you sure you want to remove "${docName}" from your vault?`)) return;

    try {
      await apiDelete(`/documents/${docId}`);
      setMessage(`"${docName}" removed from vault.`);
      await fetchDocuments();
    } catch {
      setError('Could not remove document.');
    }
  }

  const existingMap = new Map<string, UserDocumentSummary>();
  for (const doc of documents) {
    existingMap.set(doc.document_type_code, doc);
  }

  const uploadedCount = documents.length;
  const readyPercentage = Math.round((uploadedCount / DOCUMENT_TYPES.length) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
          <FolderLock className="size-4" />
          <span>{t('doc_locker_tag', 'Encrypted Citizen Locker')}</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
          {t('doc_title', 'My Documents')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#435775]">
          {t('doc_desc', 'Securely store your educational marksheets, caste certificates, and application assets. Files are encrypted and sensitive numbers like Aadhaar are masked automatically.')}
        </p>
      </div>

      {/* Sign In Required Notice Banner */}
      {isAuthenticated === false && (
        <div className="rounded-3xl border border-[#c4d2e3] bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#0e7bf4]" />
              <h2 className="text-base font-extrabold text-[#082046]">
                Sign In to Proceed with Document Uploads
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#435775] leading-relaxed max-w-2xl">
              You are currently viewing the Encrypted Citizen Locker in preview mode. To securely upload, encrypt, and link your 10th marksheet, degree certificate, or caste proof for 1-click government applications, please sign in to your ApplyFields account.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login?redirect=/documents"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0e7bf4] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0c6cd7] transition"
            >
              <Lock className="size-3.5" />
              <span>Sign In to Proceed</span>
            </Link>
            <Link
              href="/register?redirect=/documents"
              className="inline-flex items-center justify-center rounded-xl border border-[#c4d2e3] bg-white px-4 py-2.5 text-xs font-bold text-[#082046] hover:bg-[#f4f7fb] transition"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs text-emerald-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs text-rose-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Readiness Overview Widget */}
      <Card className="rounded-3xl border border-[#c4d2e3] bg-gradient-to-br from-[#F8FBFF] to-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#0e7bf4]" />
              <h2 className="text-base font-bold text-[#082046]">{t('doc_readiness_title', 'Opportunity Readiness Checker')}</h2>
            </div>
            <p className="text-xs text-[#536780]">
              {t('doc_readiness_desc', 'Verify if your uploaded certificates meet the mandatory requirements for upcoming recruitment drives.')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedOpportunitySlug}
              onChange={(e) => setSelectedOpportunitySlug(e.target.value)}
              className="rounded-xl border border-[#c4d2e3] bg-white px-3 py-2 text-xs font-semibold text-[#082046] shadow-sm outline-none focus:border-[#0e7bf4]"
            >
              {POPULAR_OPPORTUNITIES.map((opp) => (
                <option key={opp.slug} value={opp.slug}>
                  {opp.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Readiness Metric */}
        {readinessData && (
          <div className="mt-5 rounded-2xl border border-[#c4d2e3]/70 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-[#082046]">
                {t('doc_target_label', 'Target')}:{' '}
                <span className="font-extrabold text-[#0e7bf4]">
                  {readinessData.opportunity_title || selectedOpportunitySlug.toUpperCase()}
                </span>
              </div>
              <Badge
                tone={readinessData.ready_count === readinessData.required_count ? 'teal' : 'tea'}
                className="text-xs font-bold"
              >
                {readinessData.ready_count} of {readinessData.required_count} {t('doc_ready_label', 'Documents Ready')} (
                {readinessData.required_count > 0
                  ? Math.round((readinessData.ready_count / readinessData.required_count) * 100)
                  : 100}
                %)
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {readinessData.required_documents.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className={`flex items-center justify-between rounded-xl p-2.5 text-xs border ${
                    item.matched
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                      : 'border-amber-200 bg-amber-50/40 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.matched ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="size-4 shrink-0 text-amber-600" />
                    )}
                    <span className="font-medium truncate">{item.name}</span>
                  </div>
                  {!item.matched && (
                    isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => openUploadModal('tenth_marksheet')}
                        className="ml-2 shrink-0 rounded-lg bg-amber-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-amber-700"
                      >
                        {t('doc_btn_upload', 'Upload')}
                      </button>
                    ) : (
                      <Link
                        href="/login?redirect=/documents"
                        className="ml-2 shrink-0 rounded-lg bg-[#082046] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#0e7bf4] transition flex items-center gap-1"
                      >
                        <Lock className="size-3" />
                        <span>Sign In</span>
                      </Link>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Document Vault Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#082046]">{t('doc_required_heading', 'Required Applicant Documents')}</h2>
          <span className="text-xs font-semibold text-[#536780]">
            {uploadedCount} of {DOCUMENT_TYPES.length} {t('doc_slots_filled', 'slots filled')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOCUMENT_TYPES.map((typeConfig) => {
            const uploaded = existingMap.get(typeConfig.code);

            return (
              <Card
                key={typeConfig.code}
                className={`relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition ${
                  uploaded
                    ? 'border-emerald-200/90 bg-white'
                    : 'border-dashed border-[#c4d2e3] bg-[#F8FBFF]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-xl border border-[#c4d2e3]/60 bg-white p-2.5 shadow-sm">
                      {typeConfig.icon}
                    </div>

                    {uploaded ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="size-3" />
                        {t('doc_status_uploaded', 'Uploaded')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                        {t('doc_status_empty', 'Empty Slot')}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-[#082046]">{getDocTypeLabel(typeConfig.code, typeConfig.label)}</h3>
                  <p className="mt-1 text-xs text-[#536780] leading-relaxed">
                    {getDocTypeDesc(typeConfig.code, typeConfig.description)}
                  </p>

                  {uploaded && (
                    <div className="mt-3 rounded-2xl bg-[#F0F4F8] p-3 text-xs space-y-2 border border-slate-200/60">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-bold text-[#082046]">
                          {uploaded.title || uploaded.file_name}
                        </span>
                        <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700 border border-slate-200">
                          {uploaded.file_name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMG'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100/70 rounded-lg px-2 py-0.5">
                          <Sparkles className="size-3 text-amber-600" />
                          <span>{uploaded.details?.extracted_fields?.length || 6} {t('doc_fields_extracted', 'Fields Extracted')}</span>
                        </span>

                        {uploaded.source === 'digilocker' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 rounded-lg px-2 py-0.5">
                            <ShieldCheck className="size-3 text-emerald-600" />
                            <span>DigiLocker</span>
                          </span>
                        )}
                      </div>

                      {uploaded.masked_identifier && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#0e7bf4] font-mono font-semibold">
                          <Lock className="size-3 shrink-0" />
                          <span className="truncate">ID: {uploaded.masked_identifier}</span>
                        </div>
                      )}

                      <div className="text-[11px] text-[#536780] flex items-center justify-between border-t border-slate-200/80 pt-1.5">
                        <span>
                          {uploaded.size_bytes
                            ? `${(uploaded.size_bytes / 1024).toFixed(1)} KB`
                            : t('doc_verified', 'Document verified')}
                        </span>
                        <span>
                          {new Date(uploaded.updated_at || uploaded.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 border-t border-[#c4d2e3]/50 pt-3 flex items-center justify-between gap-2">
                  {uploaded ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingDoc(uploaded);
                          setIsInspectorOpen(true);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0e7bf4] py-2 px-3 text-xs font-bold text-white shadow-sm hover:bg-[#0c6cd7] transition"
                      >
                        <Eye className="size-3.5" />
                        <span>{t('doc_btn_preview_copy', 'Preview & Copy')}</span>
                        <Sparkles className="size-3 text-amber-300" />
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownload(uploaded.id, uploaded.file_name || 'doc.pdf')}
                          title="Download document"
                          className="rounded-xl border border-[#c4d2e3] p-2 text-[#536780] hover:text-[#082046] hover:bg-[#F0F4F8] transition"
                        >
                          <Download className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openUploadModal(typeConfig.code)}
                          title="Replace file"
                          className="rounded-xl border border-[#c4d2e3] p-2 text-[#536780] hover:text-[#082046] hover:bg-[#F0F4F8] transition"
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(uploaded.id, uploaded.title || typeConfig.label)
                          }
                          title="Delete from locker"
                          className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </>
                  ) : isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => openUploadModal(typeConfig.code)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#082046] py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#061835] transition"
                    >
                      <UploadCloud className="size-3.5" />
                      <span>{t('doc_btn_upload', 'Upload')} {getDocTypeLabel(typeConfig.code, typeConfig.label).split(' ')[0]}</span>
                    </button>
                  ) : (
                    <Link
                      href="/login?redirect=/documents"
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#082046] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0e7bf4] transition"
                    >
                      <Lock className="size-3.5" />
                      <span>Sign In to Upload {typeConfig.label.split(' ')[0]}</span>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Security and Privacy Notice */}
      <Card className="rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="size-5 shrink-0 text-[#0e7bf4] mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#082046] uppercase tracking-wider">
              {t('doc_privacy_guarantee_title', 'Citizen Data Privacy & Masking Guarantee')}
            </h4>
            <p className="text-xs text-[#536780] leading-relaxed">
              {t('doc_privacy_guarantee_desc', 'Your certificates are stored strictly within our private, access-controlled Supabase storage bucket and delivered via short-lived signed URLs. National identifiers (Aadhaar, PAN) are automatically masked to the final 4 digits to prevent identity leakage.')}
            </p>
          </div>
        </div>
      </Card>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#c4d2e3] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#c4d2e3]/60 pb-3">
              <h3 className="text-base font-bold text-[#082046]">{t('doc_modal_upload_title', 'Upload Document')}</h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg p-1 text-[#536780] hover:bg-[#F0F4F8]"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#082046]">{t('doc_modal_type', 'Document Type')}</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => {
                    setSelectedDocType(e.target.value);
                    const cfg = DOCUMENT_TYPES.find((d) => d.code === e.target.value);
                    if (cfg) setDocTitle(getDocTypeLabel(cfg.code, cfg.label));
                  }}
                  className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                >
                  {DOCUMENT_TYPES.map((cfg) => (
                    <option key={cfg.code} value={cfg.code}>
                      {getDocTypeLabel(cfg.code, cfg.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082046]">{t('doc_modal_title', 'Document Title')}</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. 10th Class SSC Board Certificate"
                  required
                  className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                />
              </div>

              {DOCUMENT_TYPES.find((d) => d.code === selectedDocType)?.hasIdentifier && (
                <div>
                  <label className="block text-xs font-bold text-[#082046]">
                    {DOCUMENT_TYPES.find((d) => d.code === selectedDocType)?.identifierLabel ||
                      t('doc_modal_id', 'Certificate / ID Number')}
                  </label>
                  <input
                    type="text"
                    value={docIdentifier}
                    onChange={(e) => setDocIdentifier(e.target.value)}
                    placeholder={
                      DOCUMENT_TYPES.find((d) => d.code === selectedDocType)?.identifierPlaceholder ||
                      'e.g. 1234 5678 9012'
                    }
                    className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs font-mono text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                  <p className="mt-1 text-[11px] text-[#536780]">
                    Only the last 4 digits will be displayed in your profile (e.g. **** **** 9012).
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#082046]">Select File</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelection}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                />
                <p className="mt-1 text-[11px] text-[#536780]">
                  Supported formats: PDF, JPG, PNG (up to 5MB).
                </p>
              </div>

              {selectedFile && (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-900 flex items-center justify-between">
                  <span className="font-semibold truncate">{selectedFile.name}</span>
                  <span className="text-[11px] font-mono text-blue-700">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#c4d2e3]/60">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-xl border border-[#c4d2e3] px-4 py-2 text-xs font-semibold text-[#536780] hover:bg-[#F0F4F8]"
                >
                  {t('btn_cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="rounded-xl bg-[#082046] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#061835] disabled:opacity-50"
                >
                  {isUploading ? t('profile_btn_saving', 'Uploading...') : t('doc_modal_btn_submit', 'Upload & Encrypt')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Document Preview & Side-by-Side Smart Extractor Modal */}
      <DocumentPreviewExtractorModal
        document={inspectingDoc}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        onDocumentUpdated={handleDocumentUpdated}
      />
    </div>
  );
}
