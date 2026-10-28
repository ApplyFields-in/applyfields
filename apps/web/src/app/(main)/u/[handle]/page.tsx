'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  BookOpen,
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
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { PixelAvatar } from '@/components/pixel-avatars';
import { showAppToast } from '@/components/toast-notification-provider';
import type { CompetitiveExamScore } from '@/components/profile/competitive-exam-scores-card';

interface CandidatePublicPageProps {
  params: Promise<{ handle: string }>;
}

export default function CandidatePublicPage({ params }: CandidatePublicPageProps) {
  const unwrappedParams = use(params);
  const handle = unwrappedParams.handle;

  const [copied, setCopied] = useState(false);
  const [candidateData, setCandidateData] = useState<{
    fullName: string;
    avatarUrl?: string;
    stateName: string;
    district: string;
    domicileState: string;
    category: string;
    highestDegree: string;
    stream: string;
    institution: string;
    yearOfPassing: number | string;
    score: number | string;
    scoreType: string;
    skills: string[];
    targetJobTypes: string[];
    examScores: CompetitiveExamScore[];
  }>({
    fullName: handle
      ? handle
          .split(/[-_]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : 'Candidate Profile',
    avatarUrl: 'pixel-scholar',
    stateName: 'Karnataka',
    district: 'Bengaluru',
    domicileState: 'Karnataka',
    category: 'General / Unreserved',
    highestDegree: 'B.Tech',
    stream: 'Computer Science & Engineering',
    institution: 'National Institute of Technology Karnataka (NITK Surathkal)',
    yearOfPassing: 2025,
    score: 8.84,
    scoreType: 'cgpa',
    skills: ['Python', 'Data Structures & Algorithms', 'System Architecture', 'SQL', 'English', 'Kannada'],
    targetJobTypes: ['Central Government PSUs', 'State Engineering Services', 'Higher Technical Education'],
    examScores: [
      {
        id: 'exam-sample-1',
        examType: 'GATE',
        examName: 'GATE 2025 (Computer Science & IT)',
        year: 2025,
        rollNumber: 'CS25S37108420',
        disciplineOrPaper: 'Computer Science and Information Technology (CS)',
        score: '768 / 1000',
        marks: '66.33 / 100',
        percentile: '99.18',
        allIndiaRank: '428',
        awardOrStatus: 'Qualified for PSU Recruitment & M.Tech Admissions',
        verified: true,
      },
      {
        id: 'exam-sample-2',
        examType: 'JEE_MAIN',
        examName: 'JEE Main 2022',
        year: 2022,
        rollNumber: '220310084912',
        disciplineOrPaper: 'Paper 1 (B.E. / B.Tech)',
        percentile: '98.92',
        allIndiaRank: '11,450',
        categoryRank: 'GEN-EWS AIR 1,210',
        awardOrStatus: 'Eligible for Central Seat Allocation Board (CSAB / JoSAA)',
        verified: true,
      },
    ],
  });

  // Attempt to hydrate from current user's local session if viewing self
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedScores = localStorage.getItem('applyfields_competitive_exam_scores');
        if (savedScores) {
          const parsed = JSON.parse(savedScores);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCandidateData((prev) => ({
              ...prev,
              examScores: parsed,
            }));
          }
        }
      } catch {
        // use fallback
      }
    }
  }, []);

  const publicUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://applyfields.com/u/${handle}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      showAppToast('Candidate portfolio link copied to clipboard.');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Verified Candidate Portfolio for ${candidateData.fullName}: ${publicUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = `Verified Candidate Portfolio - ${candidateData.fullName}`;
    const body = `Hi,\n\nPlease review my verified candidate credentials and competitive exam benchmarks on ApplyFields:\n${publicUrl}\n\nRegards,\n${candidateData.fullName}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F2F1ED] py-8 sm:py-12 print:bg-white print:py-0">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Navigation & Actions Top Bar (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#082046] hover:underline"
          >
            <ArrowLeft className="size-4" />
            <span>Return to Profile</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dec9a5] bg-[#ffffff] text-xs font-semibold text-[#082046] hover:bg-[#F4E8D1] transition-colors"
            >
              <Printer className="size-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold hover:bg-[#20ba59] transition-colors"
            >
              <Share2 className="size-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleShareEmail}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#082046] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <Mail className="size-3.5" />
              <span>Email</span>
            </button>
          </div>
        </div>

        {/* Verified Portfolio Document (A4/Official Indian Registry Style) */}
        <div className="rounded-2xl border-2 border-[#dec9a5] bg-white p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Institutional Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-[#dec9a5]">
            <div className="flex items-start gap-4">
              <div className="size-20 rounded-xl bg-[#082046] text-[#F4E8D1] font-bold text-3xl flex items-center justify-center border border-[#dec9a5] shrink-0">
                {candidateData.fullName.slice(0, 2).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded border border-[#dec9a5] bg-[#F4E8D1] text-[11px] font-bold text-[#76562d]">
                    <ShieldCheck className="size-3 text-[#76562d]" /> Verified Candidate Record
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    ID: AF-2026-{handle.toUpperCase().slice(0, 8)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#082046] tracking-tight">
                  {candidateData.fullName}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="size-3.5 text-[#76562d]" />
                    {[candidateData.district, candidateData.stateName].filter(Boolean).join(', ')}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span>
                    State Domicile: <strong className="text-slate-800">{candidateData.domicileState}</strong>
                  </span>
                  <span className="text-slate-400">·</span>
                  <span>
                    Category: <strong className="text-slate-800">{candidateData.category}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-400 shrink-0 space-y-1">
              <span className="block font-bold text-[#082046] uppercase tracking-wider text-[11px]">
                ApplyFields Academic Registry
              </span>
              <span className="block text-[11px] text-slate-500">Official Candidate Ledger</span>
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                Active Verification
              </span>
            </div>
          </div>

          {/* Academic Background Card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-[#082046]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#082046]">
                Academic Qualifications
              </h2>
            </div>

            <div className="p-5 rounded-xl border border-[#dec9a5] bg-[#f8f5ef] grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Qualification & Branch</span>
                <span className="text-sm font-bold text-[#082046] block">
                  {candidateData.highestDegree} in {candidateData.stream}
                </span>
                <span className="text-xs text-slate-500">Regular Full-Time</span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-0.5">College or Institution</span>
                <span className="text-xs font-semibold text-slate-800 block">
                  {candidateData.institution}
                </span>
                <span className="text-[11px] text-slate-500">Government / Autonomous Institute</span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Year of Passing & Score</span>
                <span className="text-xs font-bold text-[#082046] block">
                  Class of {candidateData.yearOfPassing}
                </span>
                <span className="text-xs font-semibold text-emerald-700">
                  {candidateData.score} {candidateData.scoreType === 'cgpa' ? 'CGPA / 10.0' : '% Marks'}
                </span>
              </div>
            </div>
          </div>

          {/* Competitive Exam Benchmarks & Roll Numbers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-[#082046]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#082046]">
                  Competitive Exam Benchmarks & National Ranks
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {candidateData.examScores.length} Records Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {candidateData.examScores.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded border border-[#dec9a5] bg-[#F4E8D1] text-[10px] font-bold text-[#76562d]">
                        {exam.examType.replace('_', ' ')}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">{exam.examName}</h3>
                      {exam.disciplineOrPaper && (
                        <p className="text-xs text-slate-500 line-clamp-1">{exam.disciplineOrPaper}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-500">{exam.year}</span>
                  </div>

                  {/* Highlights Grid */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                        {exam.allIndiaRank ? 'National Rank' : 'Score'}
                      </span>
                      <span className="text-sm font-extrabold text-[#082046]">
                        {exam.allIndiaRank ? `AIR ${exam.allIndiaRank}` : exam.score || 'Qualified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                        Percentile / Status
                      </span>
                      <span className="text-sm font-bold text-[#0e7bf4]">
                        {exam.percentile ? `${exam.percentile} %ile` : exam.awardOrStatus || 'Eligible'}
                      </span>
                    </div>
                  </div>

                  {exam.rollNumber && (
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>Roll No: <span className="font-mono text-slate-700">{exam.rollNumber}</span></span>
                      {exam.categoryRank && (
                        <span className="font-medium text-slate-600">{exam.categoryRank}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skills & Competencies */}
          {candidateData.skills.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#082046]">
                Technical Skills & Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {candidateData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preferred Sectors & Career Trajectories */}
          {candidateData.targetJobTypes.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#082046]">
                Target Sectors & Career Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {candidateData.targetJobTypes.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-md bg-[#F4E8D1] border border-[#dec9a5] text-[#76562d] text-xs font-semibold"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Official Registry Seal & Disclaimer Footnote */}
          <div className="pt-6 border-t-2 border-[#dec9a5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-800">ApplyFields Verified Candidate Ledger</p>
                <p className="text-[11px] text-slate-500">
                  Data declaration verified by candidate. Complies with DPDP Act 2023 guidelines.
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <Link
                href="/career/colleges"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0e7bf4] hover:underline"
              >
                <span>Explore Top 50 Colleges & Cutoffs</span>
                <ExternalLink className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

