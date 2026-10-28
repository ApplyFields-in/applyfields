'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Building,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Printer,
  QrCode,
  Share2,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { PixelAvatar } from '@/components/pixel-avatars';
import { showAppToast } from '@/components/toast-notification-provider';
import type { CompetitiveExamScore } from './competitive-exam-scores-card';

interface CandidateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    handle: string;
    fullName: string;
    avatarUrl?: string | null;
    stateName?: string | null;
    district?: string | null;
    domicileState?: string | null;
    category?: string | null;
    highestDegree?: string | null;
    stream?: string | null;
    institution?: string | null;
    yearOfPassing?: number | string | null;
    score?: number | string | null;
    scoreType?: string | null;
    skills?: string[];
    targetJobTypes?: string[];
    examScores?: CompetitiveExamScore[];
  };
}

export function CandidateCardModal({ isOpen, onClose, candidate }: CandidateCardModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/u/${candidate.handle}`
    : `https://applyfields.com/u/${candidate.handle}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      showAppToast('Public candidate portfolio link copied.');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Verified Candidate Portfolio for ${candidate.fullName}: ${publicUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Verified Candidate Portfolio - ${candidate.fullName}`;
    const body = `Hi,\n\nPlease find my verified academic and competitive credentials on ApplyFields:\n${publicUrl}\n\nRegards,\n${candidate.fullName}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-[#fbfbf9] shadow-2xl my-auto max-h-[95vh] flex flex-col overflow-hidden">
        {/* Top Action Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="size-5 text-[#082046]" />
              <h2 className="text-base sm:text-lg font-bold text-[#082046]">
                Shareable Candidate Portfolio Card
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified record for college counselors, mentors, and recruitment panels.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              title="Print or Export PDF"
            >
              <Printer className="size-3.5" />
              <span>Print / PDF</span>
            </button>

            <Link
              href={`/u/${candidate.handle}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dec9a5] bg-[#F4E8D1] text-xs font-bold text-[#76562d] hover:bg-[#ebd8b7] transition-colors"
            >
              <ExternalLink className="size-3.5" />
              <span>Open Public URL</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Share Shortcuts Tray */}
        <div className="px-5 py-3 bg-[#f8f5ef] border-b border-[#dec9a5]/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Public URL:</span>
            <span className="font-mono text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 select-all font-semibold text-[11px] truncate max-w-[260px] sm:max-w-md">
              {publicUrl}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20ba59] transition-colors"
            >
              <Share2 className="size-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleShareEmail}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
            >
              <Mail className="size-3.5" />
              <span>Email</span>
            </button>
          </div>
        </div>

        {/* Scrollable Preview Card Body (A4/Official Indian Certificate Style) */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          <div className="rounded-2xl border-2 border-[#dec9a5] bg-white p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:shadow-none">
            {/* Header / National Seal Look */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-[#dec9a5]">
              <div className="flex items-start gap-4">
                {candidate.avatarUrl && candidate.avatarUrl !== 'pixel-scholar' ? (
                  <div className="size-16 rounded-xl overflow-hidden border border-[#dec9a5] flex items-center justify-center bg-[#F4E8D1] shrink-0">
                    <PixelAvatar avatarId={candidate.avatarUrl} size={60} />
                  </div>
                ) : (
                  <div className="size-16 rounded-xl bg-[#082046] text-[#F4E8D1] font-bold text-2xl flex items-center justify-center border border-[#dec9a5] shrink-0">
                    {candidate.fullName.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-[#dec9a5] bg-[#F4E8D1] text-[11px] font-bold text-[#76562d]">
                      <ShieldCheck className="size-3 text-[#76562d]" /> Verified Candidate Record
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      ID: AF-2026-{candidate.handle.toUpperCase().slice(0, 8)}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-[#082046] tracking-tight mt-1.5">
                    {candidate.fullName}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 text-[#76562d]" />
                      {[candidate.district, candidate.stateName].filter(Boolean).join(', ') || 'India'}
                    </span>
                    {candidate.domicileState && (
                      <span className="text-slate-400">· Domicile: <strong className="text-slate-700">{candidate.domicileState}</strong></span>
                    )}
                    {candidate.category && (
                      <span className="text-slate-400">· Category: <strong className="text-slate-700">{candidate.category}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right text-[11px] text-slate-400 shrink-0">
                <span className="block font-bold text-[#082046] uppercase tracking-wider">
                  ApplyFields Academic Registry
                </span>
                <span>Active Profile · 2026 Cycle</span>
              </div>
            </div>

            {/* Academic Qualifications Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="size-4 text-[#082046]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#082046]">
                  Primary Academic Qualification
                </h3>
              </div>

              <div className="p-4 rounded-xl border border-[#dec9a5] bg-[#f8f5ef] grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">Degree & Stream</span>
                  <span className="text-sm font-bold text-[#082046]">
                    {[candidate.highestDegree, candidate.stream].filter(Boolean).join(' in ') || 'Graduate'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">College / University</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {candidate.institution || 'Recognized Indian University'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">Year & Score</span>
                  <span className="text-xs font-bold text-[#082046]">
                    {candidate.yearOfPassing ? `Class of ${candidate.yearOfPassing}` : 'Graduated'}
                    {candidate.score != null ? ` · ${candidate.score} ${candidate.scoreType === 'cgpa' ? 'CGPA' : '%'}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Competitive Exam Benchmarks */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Award className="size-4 text-[#082046]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#082046]">
                  Competitive Exam Benchmarks & Ranks
                </h3>
              </div>

              {candidate.examScores && candidate.examScores.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {candidate.examScores.map((exam) => (
                    <div
                      key={exam.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-[#dec9a5] bg-[#F4E8D1] text-[10px] font-bold text-[#76562d]">
                            {exam.examType.replace('_', ' ')}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">{exam.year}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-2">{exam.examName}</h4>
                        {exam.disciplineOrPaper && (
                          <p className="text-[11px] text-slate-500">{exam.disciplineOrPaper}</p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        {exam.allIndiaRank ? (
                          <span className="font-extrabold text-[#082046]">AIR {exam.allIndiaRank}</span>
                        ) : exam.score ? (
                          <span className="font-bold text-[#082046]">{exam.score}</span>
                        ) : (
                          <span className="font-semibold text-emerald-700">Qualified</span>
                        )}

                        {exam.percentile && (
                          <span className="font-bold text-[#0e7bf4]">{exam.percentile} %ile</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No national entrance exam records entered yet.
                </div>
              )}
            </div>

            {/* Skills & Domains */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#082046] mb-2.5">
                  Verified Skills & Languages
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Career Aspiration / Target Sectors */}
            {candidate.targetJobTypes && candidate.targetJobTypes.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#082046] mb-2.5">
                  Target Career Domains & Preferences
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.targetJobTypes.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-md bg-[#F4E8D1] border border-[#dec9a5] text-[#76562d] text-xs font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer / QR / Official Verification Notice */}
            <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span>
                  Profile verified by student declaration. Complies with DPDP Act 2023.
                </span>
              </div>
              <div className="font-mono text-slate-500">
                applyfields.com/u/{candidate.handle}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
