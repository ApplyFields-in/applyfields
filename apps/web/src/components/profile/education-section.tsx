'use client';

import React, { useState, useRef } from 'react';
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  FileText,
  UploadCloud,
  Wand2,
  Check,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type {
  UserEducation,
  EducationLevel,
  EducationStatus,
  ScoreType,
  UserResumeDocument,
  ResumeApiResponse,
  ExtractedEducationItem,
} from '@applyfields/types';
import { apiPost, apiPut, apiDelete, apiGet } from '@/lib/api';
import { showAppToast } from '@/components/toast-notification-provider';
import { convertFileToBase64 } from '@/lib/resume-parser';
import { useLanguage } from '@/lib/i18n/language-context';

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  '10th': '10th / Secondary (SSC)',
  '12th': '12th / Intermediate (HSC)',
  iti: 'ITI (Vocational Training)',
  diploma: 'Polytechnic Diploma',
  graduate: "Bachelor's Degree (Graduation)",
  post_graduate: "Master's Degree (Post-Graduation)",
  phd: 'Doctorate (Ph.D / M.Phil)',
};

interface EducationSectionProps {
  educations: UserEducation[];
  onEducationsChange: (next: UserEducation[]) => void;
}

export function EducationSection({
  educations,
  onEducationsChange,
}: EducationSectionProps) {
  const { t } = useLanguage();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [eduLevel, setEduLevel] = useState<EducationLevel>('graduate');
  const [eduDegree, setEduDegree] = useState('');
  const [eduStream, setEduStream] = useState('');
  const [eduBoard, setEduBoard] = useState('');
  const [eduInstitution, setEduInstitution] = useState('');
  const [eduYear, setEduYear] = useState<string>(new Date().getFullYear().toString());
  const [eduScore, setEduScore] = useState<string>('');
  const [eduScoreType, setEduScoreType] = useState<ScoreType>('percentage');
  const [eduStatus, setEduStatus] = useState<EducationStatus>('completed');

  // Resume Upload & Extraction State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResumeDropzone, setShowResumeDropzone] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedEducations, setExtractedEducations] = useState<ExtractedEducationItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setEduLevel('graduate');
    setEduDegree('');
    setEduStream('');
    setEduBoard('');
    setEduInstitution('');
    setEduYear(new Date().getFullYear().toString());
    setEduScore('');
    setEduScoreType('percentage');
    setEduStatus('completed');
    setError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: UserEducation) => {
    setEditingId(item.id);
    setEduLevel(item.level);
    setEduDegree(item.degree || '');
    setEduStream(item.stream || '');
    setEduBoard(item.board_or_university || '');
    setEduInstitution(item.institution_name || '');
    setEduYear(item.year_of_passing != null ? item.year_of_passing.toString() : '');
    setEduScore(item.score != null ? item.score.toString() : '');
    setEduScoreType(item.score_type || 'percentage');
    setEduStatus(item.status || 'completed');
    setError(null);
    setShowModal(true);
  };

  const handleSaveEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      level: eduLevel,
      degree: eduDegree.trim() || undefined,
      stream: eduStream.trim() || undefined,
      board_or_university: eduBoard.trim() || undefined,
      institution_name: eduInstitution.trim() || undefined,
      year_of_passing: eduYear ? parseInt(eduYear, 10) : undefined,
      score: eduScore ? parseFloat(eduScore) : undefined,
      score_type: eduScoreType,
      status: eduStatus,
    };

    try {
      if (editingId) {
        const res = await apiPut<UserEducation>(`/me/education/${editingId}`, payload);
        if (res.data) {
          const next = educations.map((item) => (item.id === editingId ? res.data! : item));
          onEducationsChange(next);
          setShowModal(false);
          showAppToast('Educational qualification updated successfully.');
        } else {
          setError(res.error || 'Failed to update qualification');
        }
      } else {
        const res = await apiPost<UserEducation>('/me/education', payload);
        if (res.data) {
          const next = [res.data, ...educations];
          onEducationsChange(next);
          setShowModal(false);
          showAppToast('Educational qualification added successfully.');
        } else {
          setError(res.error || 'Failed to add qualification');
        }
      }
    } catch {
      setError('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (confirm(`Delete qualification "${label}"?`)) {
      try {
        const res = await apiDelete(`/me/education/${id}`);
        if (!res.error) {
          const next = educations.filter((e) => e.id !== id);
          onEducationsChange(next);
          showAppToast('Qualification removed.');
        } else {
          showAppToast(res.error || 'Failed to remove qualification');
        }
      } catch {
        showAppToast('Failed to remove qualification');
      }
    }
  };

  // Resume file selected
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const base64 = await convertFileToBase64(file);
      const res = await apiPost<ResumeApiResponse>('/me/resume', {
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        base64,
      });

      if (res.data?.qualifications && res.data.qualifications.length > 0) {
        setExtractedEducations(res.data.qualifications);
        showAppToast(`AI extracted ${res.data.qualifications.length} qualification(s) from your resume.`);
      } else {
        showAppToast('No structured qualifications detected in this file.');
      }
    } catch {
      showAppToast('Failed to parse resume file.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImportExtracted = async () => {
    if (extractedEducations.length === 0) return;
    setIsImporting(true);

    let addedCount = 0;
    const current = [...educations];

    for (const item of extractedEducations) {
      try {
        const res = await apiPost<UserEducation>('/me/education', {
          level: (item.level as EducationLevel) || 'graduate',
          degree: item.degree || undefined,
          stream: item.stream || undefined,
          board_or_university: item.board_or_university || undefined,
          institution_name: item.institution_name || undefined,
          year_of_passing: item.year_of_passing ?? undefined,
          score: item.score ?? undefined,
          score_type: (item.score_type as ScoreType) || 'percentage',
          status: item.status || 'completed',
        });
        if (res.data) {
          current.unshift(res.data);
          addedCount++;
        }
      } catch {
        // continue
      }
    }

    setIsImporting(false);
    onEducationsChange(current);
    setExtractedEducations([]);
    setShowResumeDropzone(false);
    showAppToast(`Imported ${addedCount} qualification(s) to your profile!`);
  };

  return (
    <section id="education-section" className="rounded-3xl border border-[#c4d2e3] bg-white p-6 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="size-5 text-[#0E7BF4]" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Educational Qualifications
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Degrees and marks required to pass qualification filters for SSC, UPSC, Bank PO, and State exams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowResumeDropzone(!showResumeDropzone)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Wand2 className="size-3.5 text-[#0E7BF4]" />
            <span>AI Resume Parser</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#082046] hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Add Qualification</span>
          </button>
        </div>
      </div>

      {/* AI Resume Dropzone Drawer */}
      {showResumeDropzone && (
        <div className="mt-4 p-5 rounded-2xl bg-[#F8FBFF] border border-blue-200/80 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-[#082046] flex items-center gap-1.5">
                <Wand2 className="size-4 text-[#0E7BF4]" />
                Auto-Extract Qualifications from Resume
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Upload your resume (PDF, DOCX, or Image). Our local AI parser extracts degree, branch, college, and CGPA automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowResumeDropzone(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="size-4" />
            </button>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center cursor-pointer hover:bg-blue-50/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
              onChange={handleFileSelected}
              className="hidden"
            />
            {isExtracting ? (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#0E7BF4]">
                <Loader2 className="size-5 animate-spin" />
                <span>Reading document & parsing degrees…</span>
              </div>
            ) : (
              <div className="space-y-1">
                <UploadCloud className="size-6 text-[#0E7BF4] mx-auto" />
                <p className="text-xs font-semibold text-slate-800">
                  Click or drag your Resume / CV here
                </p>
                <p className="text-[10px] text-slate-400">PDF, DOCX, Images up to 10MB</p>
              </div>
            )}
          </div>

          {extractedEducations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-blue-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#082046]">
                  Found {extractedEducations.length} Qualifications:
                </span>
                <button
                  type="button"
                  onClick={handleImportExtracted}
                  disabled={isImporting}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0E7BF4] text-white text-xs font-bold hover:bg-blue-600 disabled:opacity-50"
                >
                  {isImporting ? 'Importing…' : 'Import All to Profile'}
                </button>
              </div>
              <div className="space-y-2">
                {extractedEducations.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        {item.degree || item.level} {item.stream ? `in ${item.stream}` : ''}
                      </span>
                      <span className="text-slate-500 block text-[11px]">
                        {item.institution_name || item.board_or_university} {item.year_of_passing ? `· Class of ${item.year_of_passing}` : ''} {item.score != null ? `· Score: ${item.score}` : ''}
                      </span>
                    </div>
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Qualifications List / Empty State */}
      {educations.length === 0 ? (
        <div className="mt-5 py-10 text-center space-y-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="size-12 rounded-2xl bg-white text-slate-400 mx-auto flex items-center justify-center border border-slate-200">
            <GraduationCap className="size-6 text-[#0E7BF4]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No Qualifications Added Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Add your 10th, 12th, or graduation details so jobs and exams can confirm your eligibility.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#082046] text-white text-xs font-semibold hover:bg-slate-800"
          >
            Add Highest Qualification
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {educations.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-[#ffffff] hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md border border-[#c4d2e3] bg-[#EDF2F8] text-[11px] font-bold text-[#082046]">
                    {EDUCATION_LEVEL_LABELS[item.level] || item.level}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 capitalize">
                    {item.status || 'Completed'}
                  </span>
                  {item.year_of_passing && (
                    <span className="text-xs font-mono text-slate-500">
                      Class of {item.year_of_passing}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-extrabold text-[#082046]">
                  {item.degree || EDUCATION_LEVEL_LABELS[item.level] || item.level}
                  {item.stream ? ` in ${item.stream}` : ''}
                </h4>

                <p className="text-xs text-slate-600">
                  {item.institution_name || item.board_or_university || 'Institution not specified'}
                </p>

                {item.score != null && (
                  <p className="text-xs font-semibold text-emerald-700 pt-0.5">
                    Score: {item.score} {item.score_type === 'cgpa' ? 'CGPA / 10.0' : '%'}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(item)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Edit Qualification"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id, item.degree || item.level)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Remove Qualification"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Qualification Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-5 text-[#0E7BF4]" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingId ? 'Edit Educational Qualification' : 'Add Educational Qualification'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveEducation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Education Level *</label>
                <select
                  value={eduLevel}
                  onChange={(e) => setEduLevel(e.target.value as EducationLevel)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                  required
                >
                  {Object.entries(EDUCATION_LEVEL_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Degree Title</label>
                  <input
                    type="text"
                    value={eduDegree}
                    onChange={(e) => setEduDegree(e.target.value)}
                    placeholder="e.g. B.Tech / B.Sc / BA / M.Com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stream / Branch</label>
                  <input
                    type="text"
                    value={eduStream}
                    onChange={(e) => setEduStream(e.target.value)}
                    placeholder="e.g. Computer Science / Mechanical / Commerce"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  College or Institution Name *
                </label>
                <input
                  type="text"
                  value={eduInstitution}
                  onChange={(e) => setEduInstitution(e.target.value)}
                  placeholder="e.g. NITK Surathkal / University of Delhi"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Board or Affiliating University</label>
                <input
                  type="text"
                  value={eduBoard}
                  onChange={(e) => setEduBoard(e.target.value)}
                  placeholder="e.g. CBSE / VTU / State Board"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Year of Passing</label>
                  <input
                    type="number"
                    value={eduYear}
                    onChange={(e) => setEduYear(e.target.value)}
                    placeholder="2025"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Score / Percentage</label>
                  <input
                    type="text"
                    value={eduScore}
                    onChange={(e) => setEduScore(e.target.value)}
                    placeholder="e.g. 84.5 or 8.8"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Score Format</label>
                  <select
                    value={eduScoreType}
                    onChange={(e) => setEduScoreType(e.target.value as ScoreType)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="cgpa">CGPA (out of 10.0)</option>
                    <option value="gpa">GPA (out of 4.0)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={eduStatus}
                  onChange={(e) => setEduStatus(e.target.value as EducationStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                >
                  <option value="completed">Completed / Awarded</option>
                  <option value="pursuing">Currently Pursuing (Final Year)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0E7BF4] text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving && <Loader2 className="size-3.5 animate-spin" />}
                  <span>{saving ? 'Saving…' : editingId ? 'Update Qualification' : 'Add to Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
