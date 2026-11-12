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
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import { PixelAvatar } from '@/components/pixel-avatars';
import { showAppToast } from '@/components/toast-notification-provider';
import { apiGet } from '@/lib/api';
import type { PublicProfileResponse, UserCompetitiveExamScore } from '@applyfields/types';

interface CandidatePublicPageProps {
  params: Promise<{ handle: string }>;
}

export default function CandidatePublicPage({ params }: CandidatePublicPageProps) {
  const unwrappedParams = use(params);
  const handle = unwrappedParams.handle;

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);

  useEffect(() => {
    async function loadPublicProfile() {
      setLoading(true);
      try {
        const data = await apiGet<PublicProfileResponse>(`/users/public/${encodeURIComponent(handle)}`);
        setProfile(data);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    if (handle) {
      loadPublicProfile();
    }
  }, [handle]);

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
    const name = profile?.fullName || `@${handle}`;
    const text = `Verified Candidate Portfolio for ${name}: ${publicUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareEmail = () => {
    const name = profile?.fullName || `@${handle}`;
    const subject = `Verified Candidate Portfolio - ${name}`;
    const body = `Hi,\n\nPlease review my verified candidate credentials and competitive exam benchmarks on ApplyFields:\n${publicUrl}\n\nRegards,\n${name}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="size-8 animate-spin text-[#0E7BF4]" />
          <p className="text-sm font-semibold">Loading verified candidate profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm text-center space-y-4">
          <div className="size-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
            <ShieldAlert className="size-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Profile Not Available</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              The profile <span className="font-mono font-semibold text-slate-800">@{handle}</span> does not exist or has been made private by its owner under DPDP privacy settings.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#0E7BF4] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
            >
              Explore Opportunities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fullName = profile.fullName || `@${handle}`;
  const skills = profile.skills || [];
  const targetJobTypes = profile.targetJobTypes || [];
  const examScores = profile.examScores || [];

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
                {fullName.slice(0, 2).toUpperCase()}
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
                  {fullName}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="size-3.5 text-[#76562d]" />
                    {[profile.district, profile.stateName].filter(Boolean).join(', ') || 'India'}
                  </span>
                  {profile.stateName && (
                    <>
                      <span className="text-slate-400">·</span>
                      <span>
                        State Domicile: <strong className="text-slate-800">{profile.domicileState || profile.stateName}</strong>
                      </span>
                    </>
                  )}
                  {profile.category && (
                    <>
                      <span className="text-slate-400">·</span>
                      <span>
                        Category: <strong className="text-slate-800">{profile.category}</strong>
                      </span>
                    </>
                  )}
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

            {profile.highestDegree || profile.institution ? (
              <div className="p-5 rounded-xl border border-[#dec9a5] bg-[#f8f5ef] grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Qualification & Branch</span>
                  <span className="text-sm font-bold text-[#082046] block">
                    {profile.highestDegree || 'Graduate'} {profile.stream ? `in ${profile.stream}` : ''}
                  </span>
                  <span className="text-xs text-slate-500">Regular Full-Time</span>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-slate-500 block mb-0.5">College or Institution</span>
                  <span className="text-xs font-semibold text-slate-800 block">
                    {profile.institution || 'Verified Higher Education Institution'}
                  </span>
                  <span className="text-[11px] text-slate-500">Recognized Institution</span>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-slate-500 block mb-0.5">Year of Passing & Score</span>
                  <span className="text-xs font-bold text-[#082046] block">
                    {profile.yearOfPassing ? `Class of ${profile.yearOfPassing}` : 'Completed'}
                  </span>
                  {profile.score != null && (
                    <span className="text-xs font-semibold text-emerald-700">
                      {profile.score} {profile.scoreType === 'cgpa' ? 'CGPA / 10.0' : '% Marks'}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500">
                No verified educational degrees listed publicly.
              </div>
            )}
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
                {examScores.length} Records Verified
              </span>
            </div>

            {examScores.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {examScores.map((exam: UserCompetitiveExamScore) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded border border-[#dec9a5] bg-[#F4E8D1] text-[10px] font-bold text-[#76562d]">
                          {(exam.exam_type || '').replace('_', ' ')}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">{exam.exam_name}</h3>
                        {exam.discipline_or_paper && (
                          <p className="text-xs text-slate-500 line-clamp-1">{exam.discipline_or_paper}</p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-500">{exam.year}</span>
                    </div>

                    {/* Highlights Grid */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                          {exam.all_india_rank ? 'National Rank' : 'Score'}
                        </span>
                        <span className="text-sm font-extrabold text-[#082046]">
                          {exam.all_india_rank ? `AIR ${exam.all_india_rank}` : exam.score || 'Qualified'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                          Percentile / Status
                        </span>
                        <span className="text-sm font-bold text-[#0e7bf4]">
                          {exam.percentile ? `${exam.percentile} %ile` : exam.award_or_status || 'Eligible'}
                        </span>
                      </div>
                    </div>

                    {exam.roll_number && (
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span>Roll No: <span className="font-mono text-slate-700">{exam.roll_number}</span></span>
                        {exam.category_rank && (
                          <span className="font-medium text-slate-600">{exam.category_rank}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500">
                No competitive exam scores published publicly.
              </div>
            )}
          </div>

          {/* Skills & Competencies */}
          {skills.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#082046]">
                Technical Skills & Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string) => (
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
          {targetJobTypes.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#082046]">
                Target Sectors & Career Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {targetJobTypes.map((t: string) => (
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

