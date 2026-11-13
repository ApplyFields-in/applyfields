'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { PixelAvatar } from '@/components/pixel-avatars';
import type {
  MeResponse,
  UserProfile,
  UserEducation,
  UserSummary,
} from '@applyfields/types';
import {
  User,
  UserCheck,
  UserPlus,
  LogIn,
  Check,
  Calendar,
  Layers,
  MapPin,
  GraduationCap,
  Award,
  Sliders,
  Sparkles,
  Camera,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { CandidateCardModal } from '@/components/profile/candidate-card-modal';
import { useLanguage } from '@/lib/i18n/language-context';
import { DashboardCorrigendumBanner } from '@/components/dashboard-corrigendum-banner';

// Split Modular Sections
import { EligibilityCompletenessCard } from '@/components/profile/eligibility-completeness-card';
import { PersonalSection } from '@/components/profile/personal-section';
import { AddressDomicileSection } from '@/components/profile/address-domicile-section';
import { EducationSection, EDUCATION_LEVEL_LABELS } from '@/components/profile/education-section';
import { ExamScoresSection } from '@/components/profile/exam-scores-section';
import { PreferencesSection } from '@/components/profile/preferences-section';
import { SkillsLanguagesSection } from '@/components/profile/skills-languages-section';
import { PhotoAvatarSection } from '@/components/profile/photo-avatar-section';
import type { CompetitiveExamScore } from '@/components/profile/competitive-exam-scores-card';

export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'AR', name: 'Arunachal Pradesh' },
  { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' },
  { code: 'CG', name: 'Chhattisgarh' },
  { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'HR', name: 'Haryana' },
  { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JH', name: 'Jharkhand' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' },
  { code: 'MZ', name: 'Mizoram' },
  { code: 'NL', name: 'Nagaland' },
  { code: 'OD', name: 'Odisha' },
  { code: 'PB', name: 'Punjab' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TS', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'AN', name: 'Andaman & Nicobar' },
  { code: 'CH', name: 'Chandigarh' },
  { code: 'DH', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: 'DL', name: 'Delhi' },
  { code: 'JK', name: 'Jammu & Kashmir' },
  { code: 'LA', name: 'Ladakh' },
  { code: 'LD', name: 'Lakshadweep' },
  { code: 'PY', name: 'Puducherry' },
];

export default function ProfilePage() {
  const { t } = useLanguage();
  const router = useRouter();

  // Authentication & Data state
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [educations, setEducations] = useState<UserEducation[]>([]);
  const [isGuest, setIsGuest] = useState(false);
  const [examScores, setExamScores] = useState<CompetitiveExamScore[]>([]);

  // Shareable Candidate Card Modal
  const [showCandidateCardModal, setShowCandidateCardModal] = useState(false);

  // Load profile on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await apiGet<MeResponse>('/me');
      if (!res || !res.user) {
        setIsGuest(true);
        setLoading(false);
        return;
      }

      setCurrentUser(res.user);
      if (res.profile) {
        setProfile(res.profile);
      }
      if (res.education) {
        setEducations(res.education);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  // Section completion checks for navigation sidebar
  const sectionStatus = useMemo(() => {
    return {
      eligibility: Boolean(
        profile?.date_of_birth &&
        profile?.category &&
        (profile?.domicile_state_code || profile?.state_code) &&
        educations.length > 0
      ),
      personal: Boolean(profile?.full_name && profile?.date_of_birth && profile?.category),
      address: Boolean(profile?.state_code && profile?.district),
      education: educations.length > 0,
      examScores: examScores.length > 0,
      preferences: Boolean(profile?.state_code || profile?.preferred_language),
      skills: (profile?.special_conditions || []).some((c) => c.startsWith('skill:')),
      photo: Boolean(profile?.avatar_url),
    };
  }, [profile, educations, examScores]);

  // User initials for sidebar avatar placeholder
  const initials = useMemo(() => {
    const name = profile?.full_name?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.slice(0, 2).toUpperCase();
    }
    return 'AF';
  }, [profile?.full_name, currentUser?.email]);

  // Candidate handle for share card
  const candidateHandle = useMemo(() => {
    if (profile?.handle) return profile.handle;
    if (profile?.full_name) {
      return profile.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    return 'citizen';
  }, [profile?.handle, profile?.full_name, currentUser?.email]);

  const stateObj = INDIAN_STATES.find((s) => s.code === profile?.state_code);
  const domicileObj = INDIAN_STATES.find((s) => s.code === profile?.domicile_state_code);
  const highestEdu = educations.length > 0 ? educations[0] : null;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="size-8 rounded-full border-2 border-[#0E7BF4] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500">Loading your profile…</p>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="size-16 rounded-2xl bg-blue-50 text-[#0E7BF4] mx-auto flex items-center justify-center mb-4">
          <LogIn className="size-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Sign in to view your profile</h1>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Create or manage your verified citizen identity, track eligibility for government notifications, and auto-fill applications.
        </p>
        <Link
          href="/login?next=/profile"
          className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0E7BF4] text-white text-xs font-bold shadow-sm hover:bg-blue-600 transition-colors"
        >
          Sign In / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner & Profile Quick Overview */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="size-20 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            {profile?.avatar_url && profile.avatar_url.startsWith('pixel-') ? (
              <PixelAvatar avatarId={profile.avatar_url} size={72} />
            ) : (
              <div className="size-full bg-gradient-to-br from-[#082046] to-[#0E7BF4] flex items-center justify-center text-white font-black text-2xl tracking-wider">
                {initials}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-black text-[#082046] tracking-tight">
                {profile?.full_name || 'My Profile'}
              </h1>
              {profile?.is_public && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Public Portfolio
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2 flex-wrap">
              <span>{currentUser?.email || currentUser?.phone || 'Citizen Account'}</span>
              <span>•</span>
              <span>{stateObj?.name || 'India'}</span>
              {profile?.category && (
                <>
                  <span>•</span>
                  <span className="uppercase font-semibold text-slate-700">{profile.category.replace('_', ' ')}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowCandidateCardModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
          >
            <Share2 className="size-3.5 text-[#0E7BF4]" />
            Share Portfolio
          </button>

          {profile?.is_public && profile?.handle && (
            <Link
              href={`/u/${profile.handle}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <ExternalLink className="size-3.5" />
              View Live
            </Link>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* LEFT COLUMN: Sticky Navigation & Quick Checklist */}
        <div className="hidden lg:block sticky top-20 rounded-2xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2.5">
              Sections
            </h3>
          </div>

          <div className="space-y-1">
            {[
              { id: 'eligibility-section', label: 'Eligibility Readiness', completed: sectionStatus.eligibility },
              { id: 'personal-section', label: 'Personal & Demographic', completed: sectionStatus.personal },
              { id: 'address-domicile-section', label: 'Address & Domicile', completed: sectionStatus.address },
              { id: 'education-section', label: 'Education Qualifications', completed: sectionStatus.education },
              { id: 'exam-scores-section', label: 'Competitive Exam Scores', completed: sectionStatus.examScores },
              { id: 'preferences-section', label: 'Preferences & Public Link', completed: sectionStatus.preferences },
              { id: 'skills-languages-section', label: 'Skills & Languages', completed: sectionStatus.skills },
              { id: 'photo-avatar-section', label: 'Photo & Persona Avatar', completed: sectionStatus.photo },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className="w-full flex items-center gap-3 py-2 px-2.5 rounded-xl text-left hover:bg-slate-50 transition-colors group"
              >
                {sec.completed ? (
                  <div className="size-4 rounded-full border-2 border-[#0E7BF4] flex items-center justify-center text-[#0E7BF4]">
                    <Check className="size-2.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="size-4 rounded-full border-2 border-slate-300 group-hover:border-slate-400" />
                )}
                <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition-colors truncate">
                  {sec.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Stack of Clean Modular Section Components */}
        <div className="space-y-6">
          {/* Real-time Corrigenda & Official Exam Bulletins */}
          <DashboardCorrigendumBanner
            bulletins={[
              {
                id: 'corr-1',
                category: 'date_extension',
                title: 'Online Application Window Extended to 30 November',
                opportunity_title: 'UPSC Civil Services Examination 2026',
                opportunity_slug: 'upsc-civil-services-examination-2026',
                summary: 'Union Public Service Commission has extended the online registration and fee deposit deadline by 15 days due to server maintenance.',
                effective_date: '28 Oct 2026',
                new_deadline: '30 Nov 2026',
                official_pdf_url: 'https://upsc.gov.in',
              },
              {
                id: 'corr-2',
                category: 'admit_card',
                title: 'GATE 2026 Admit Card Released for Download',
                opportunity_title: 'Graduate Aptitude Test in Engineering 2026',
                opportunity_slug: 'gate-2026',
                summary: 'Candidates can now login with their enrollment ID and password to download the official examination hall ticket and verified center allocation.',
                effective_date: '27 Oct 2026',
                official_pdf_url: 'https://gate.iitr.ac.in',
              },
            ]}
          />

          {/* SECTION 1: Eligibility Completeness Card */}
          <div id="eligibility-section">
            <EligibilityCompletenessCard profile={profile} educations={educations} />
          </div>

          {/* SECTION 2: Personal Details */}
          <PersonalSection
            profile={profile}
            user={currentUser}
            onProfileUpdate={setProfile}
            onUserUpdate={setCurrentUser}
          />

          {/* SECTION 3: Address & Domicile */}
          <AddressDomicileSection
            profile={profile}
            onProfileUpdate={setProfile}
          />

          {/* SECTION 4: Education Qualifications */}
          <EducationSection
            educations={educations}
            onEducationsChange={setEducations}
          />

          {/* SECTION 5: Competitive Exam Scores */}
          <ExamScoresSection onScoresChange={setExamScores} />

          {/* SECTION 6: Preferences & Public Link */}
          <PreferencesSection
            profile={profile}
            onProfileUpdate={setProfile}
          />

          {/* SECTION 7: Skills & Languages */}
          <SkillsLanguagesSection
            profile={profile}
            onProfileUpdate={setProfile}
          />

          {/* SECTION 8: Photo & Persona Avatar */}
          <PhotoAvatarSection
            profile={profile}
            onProfileUpdate={setProfile}
          />
        </div>
      </div>

      {/* Shareable Candidate Portfolio Modal */}
      <CandidateCardModal
        isOpen={showCandidateCardModal}
        onClose={() => setShowCandidateCardModal(false)}
        candidate={{
          handle: candidateHandle,
          fullName: profile?.full_name || currentUser?.email?.split('@')[0] || 'Candidate',
          avatarUrl: profile?.avatar_url || 'pixel-scholar',
          stateName: stateObj?.name || profile?.state_code || undefined,
          district: profile?.district || undefined,
          domicileState: domicileObj?.name || profile?.domicile_state_code || undefined,
          category: profile?.category || undefined,
          highestDegree: highestEdu?.degree || (highestEdu ? EDUCATION_LEVEL_LABELS[highestEdu.level] : undefined),
          stream: highestEdu?.stream || undefined,
          institution: highestEdu?.institution_name || highestEdu?.board_or_university || undefined,
          yearOfPassing: highestEdu?.year_of_passing ?? undefined,
          score: highestEdu?.score != null ? highestEdu.score : undefined,
          scoreType: highestEdu?.score_type ?? undefined,
          skills: (profile?.special_conditions || [])
            .filter((c) => c.startsWith('skill:'))
            .map((c) => c.replace('skill:', '')),
          targetJobTypes: (profile?.special_conditions || [])
            .filter((c) => c.startsWith('pref:'))
            .map((c) => c.replace('pref:', '')),
          examScores,
        }}
      />
    </div>
  );
}
