'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import type { UserProfile, UserEducation } from '@applyfields/types';
import { useLanguage } from '@/lib/i18n/language-context';

interface EligibilityCompletenessCardProps {
  profile: UserProfile | null;
  educations: UserEducation[];
}

export function EligibilityCompletenessCard({
  profile,
  educations,
}: EligibilityCompletenessCardProps) {
  const { t } = useLanguage();

  const hasDob = Boolean(profile?.date_of_birth);
  const hasCategory = Boolean(profile?.category);
  const hasDomicile = Boolean(profile?.domicile_state_code || profile?.state_code);
  const hasEducation = educations.length > 0;

  const criteria = [
    {
      id: 'dob',
      label: 'Date of Birth',
      desc: 'Required for age relaxation and cutoff rules',
      icon: Calendar,
      filled: hasDob,
      sectionId: 'personal-section',
    },
    {
      id: 'category',
      label: 'Social Category',
      desc: 'Required for reservation benefits (GEN/OBC/SC/ST/EWS)',
      icon: Layers,
      filled: hasCategory,
      sectionId: 'personal-section',
    },
    {
      id: 'domicile',
      label: 'State Domicile',
      desc: 'Required for state quota eligibility & local reservations',
      icon: MapPin,
      filled: hasDomicile,
      sectionId: 'address-domicile-section',
    },
    {
      id: 'education',
      label: 'Highest Qualification',
      desc: 'Required to match minimum degree and stream requirements',
      icon: GraduationCap,
      filled: hasEducation,
      sectionId: 'education-section',
    },
  ];

  const filledCount = criteria.filter((c) => c.filled).length;
  const percentage = Math.round((filledCount / 4) * 100);
  const isComplete = filledCount === 4;

  const handleJumpToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="rounded-3xl border border-[#c4d2e3] bg-white p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#0E7BF4]" />
            <h3 className="text-base font-extrabold text-[#082046] tracking-tight">
              Eligibility Readiness
            </h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isComplete
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {percentage}% Complete
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            {isComplete
              ? 'Your profile contains all 4 mandatory criteria. Every government job, exam, and scholarship displays a verified instant yes/no eligibility decision.'
              : 'Our matching engine checks these 4 essential criteria to determine if you qualify for government exams and recruitment quotas.'}
          </p>
        </div>

        <div className="sm:text-right shrink-0">
          <span className="text-2xl font-black text-[#082046]">{filledCount}</span>
          <span className="text-sm font-bold text-slate-400"> / 4 criteria</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-4">
        <div className="w-full bg-[#EDF2F8] h-3 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? 'bg-emerald-500' : 'bg-[#0E7BF4]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Criteria Checklist */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {criteria.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                item.filled
                  ? 'bg-[#F8FBFF] border-blue-100/80 text-slate-800'
                  : 'bg-amber-50/60 border-amber-200/80 text-amber-950'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#082046]">
                    <Icon className="size-3.5 text-[#0E7BF4]" />
                    {item.label}
                  </span>
                  {item.filled ? (
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-600 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {item.desc}
                </p>
              </div>

              {!item.filled ? (
                <button
                  type="button"
                  onClick={() => handleJumpToSection(item.sectionId)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0E7BF4] hover:underline pt-1 border-t border-amber-200/50"
                >
                  <span>Complete this field</span>
                  <ArrowRight className="size-3" />
                </button>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 pt-1 border-t border-slate-100">
                  <CheckCircle2 className="size-3" /> Ready
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
