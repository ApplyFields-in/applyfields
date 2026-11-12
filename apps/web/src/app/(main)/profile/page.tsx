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

  // User initials for sidebar avatar circle
  const userInitials = useMemo(() => {
    if (profile?.full_name?.trim()) {
      const parts = profile.full_name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.slice(0, 2).toUpperCase();
    }
    return 'AF';
  }, [profile, currentUser]);

  // Highest education for sidebar
  const highestEdu = useMemo(() => {
    if (educations.length === 0) return null;
    return educations[0];
  }, [educations]);

  const candidateHandle = useMemo(() => {
    if (profile?.handle) return profile.handle;
    if (profile?.full_name?.trim()) {
      return profile.full_name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    return 'candidate';
  }, [profile, currentUser]);

  const stateObj = useMemo(
    () => INDIAN_STATES.find((s) => s.code === profile?.state_code),
    [profile?.state_code]
  );
  const domicileObj = useMemo(
    () => INDIAN_STATES.find((s) => s.code === profile?.domicile_state_code),
    [profile?.domicile_state_code]
  );

  const subtitleLine = [
    highestEdu?.degree || (highestEdu ? EDUCATION_LEVEL_LABELS[highestEdu.level] : 'Graduate'),
    profile?.district ? `${profile.district}, ${stateObj?.name || profile?.state_code || 'India'}` : (stateObj?.name || 'India'),
  ].filter(Boolean).join(' · ');

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Initial loading pulse
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 animate-pulse space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
          <div className="h-64 rounded-3xl bg-slate-200/70" />
          <div className="space-y-6">
            <div className="h-44 rounded-3xl bg-slate-200/70" />
            <div className="h-44 rounded-3xl bg-slate-200/70" />
          </div>
        </div>
      </div>
    );
  }

  // Guest view
  if (isGuest) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-6">
          <div className="mx-auto size-20 rounded-full bg-blue-50 text-[#0E7BF4] flex items-center justify-center">
            <User className="size-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-[#0E7BF4] inline-block">
            Citizen Profile
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Sign in to access your profile
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Manage your personal details, educational qualifications, reservations, and explore
            verified opportunities personalized to your profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/login"
              className="h-11 px-6 rounded-xl bg-[#0E7BF4] hover:bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <LogIn className="size-4" /> Sign In
            </Link>
            <Link
              href="/register"
              className="h-11 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <UserPlus className="size-4" /> Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* 2-Panel Top Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
        {/* LEFT COLUMN: User Summary & Navigation Checklist */}
        <div className="lg:sticky lg:top-24 space-y-5">
          {/* Card 1: User Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            {/* Avatar Circle with Initials or Pixel Avatar */}
            <div
              onClick={() => scrollToSection('photo-avatar-section')}
              className="relative group cursor-pointer inline-block"
              title="Click to change avatar"
            >
              {profile?.avatar_url && profile.avatar_url !== 'pixel-scholar' ? (
                <div className="size-16 rounded-full overflow-hidden border-2 border-blue-200 shadow-xs flex items-center justify-center bg-blue-50">
                  <PixelAvatar avatarId={profile.avatar_url} size={56} />
                </div>
              ) : (
                <div className="size-16 rounded-full bg-blue-100 text-[#0E7BF4] font-bold text-xl flex items-center justify-center border border-blue-200/60 shadow-xs">
                  {userInitials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-[#0E7BF4] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Camera className="size-3" />
              </div>
            </div>

            {/* User Name */}
            <h2 className="text-xl font-bold text-slate-900 mt-4 tracking-tight">
              {profile?.full_name || currentUser?.email?.split('@')[0] || 'Candidate Profile'}
            </h2>

            {/* Subtitle */}
            <p className="text-xs text-slate-500 font-medium mt-1">
              {subtitleLine}
            </p>

            {/* Shareable Public Candidate Card CTA */}
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Candidate Ledger
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  Verified AF
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCandidateCardModal(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#dec9a5] bg-[#F4E8D1] hover:bg-[#ebd8b7] text-xs font-bold text-[#76562d] transition-colors shadow-2xs"
              >
                <UserCheck className="size-4 text-[#76562d]" />
                <span>Candidate Portfolio Card</span>
              </button>

              {profile?.is_public && profile.handle && (
                <Link
                  href={`/u/${profile.handle}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <ExternalLink className="size-3.5 text-[#0E7BF4]" />
                  <span>View Public Page</span>
                </Link>
              )}
            </div>
          </div>

          {/* Card 2: Section Navigation / Checklist Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 pb-2">
              Profile Sections
            </span>
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
