'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Card, ProgressBar } from '@applyfields/ui';
import { apiGet, apiPut, apiPost, apiDelete } from '@/lib/api';
import type {
  EducationLevel,
  EducationStatus,
  MeResponse,
  ScoreType,
  SocialCategory,
  UserEducation,
  UserGender,
  UserProfile,
  UserSummary,
} from '@applyfields/types';
import {
  Calendar,
  CheckCircle2,
  GraduationCap,
  Info,
  LogIn,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  X,
} from 'lucide-react';

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

const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  '10th': '10th / Secondary (SSC)',
  '12th': '12th / Intermediate / Higher Secondary',
  iti: 'ITI (Industrial Training)',
  diploma: 'Polytechnic Diploma',
  graduate: 'Graduation / Bachelor’s Degree',
  post_graduate: 'Post Graduation / Master’s Degree',
  phd: 'Doctorate (Ph.D)',
};

function calculateAge(dobString: string | null): { years: number; months: number } | null {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;

  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();

  if (today.getDate() < dob.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) return null;
  return { years, months };
}

export default function ProfilePage() {
  const router = useRouter();

  // Authentication & Data state
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [educations, setEducations] = useState<UserEducation[]>([]);
  const [isGuest, setIsGuest] = useState(false);

  // Active sub-tab
  const [tab, setTab] = useState<'personal' | 'education' | 'account'>('personal');

  // Form states - Personal details
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<UserGender>('male');
  const [category, setCategory] = useState<SocialCategory>('GEN');
  const [annualIncome, setAnnualIncome] = useState<string>('');
  const [stateCode, setStateCode] = useState('');
  const [district, setDistrict] = useState('');
  const [domicileStateCode, setDomicileStateCode] = useState('');
  const [isPwbd, setIsPwbd] = useState(false);
  const [pwbdType, setPwbdType] = useState('');
  const [isExServiceman, setIsExServiceman] = useState(false);
  const [isMinority, setIsMinority] = useState(false);
  const [specialConditions, setSpecialConditions] = useState<string[]>([]);

  // Education modal / form states
  const [showEduModal, setShowEduModal] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [eduLevel, setEduLevel] = useState<EducationLevel>('graduate');
  const [eduDegree, setEduDegree] = useState('');
  const [eduStream, setEduStream] = useState('');
  const [eduBoard, setEduBoard] = useState('');
  const [eduInstitution, setEduInstitution] = useState('');
  const [eduYear, setEduYear] = useState<string>(new Date().getFullYear().toString());
  const [eduScore, setEduScore] = useState<string>('');
  const [eduScoreType, setEduScoreType] = useState<ScoreType>('percentage');
  const [eduStatus, setEduStatus] = useState<EducationStatus>('completed');

  // Actions & status states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load profile on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      if (!token) {
        setIsGuest(true);
        setLoading(false);
        return;
      }

      const res = await apiGet<MeResponse>('/me');
      if (!res || !res.user) {
        setIsGuest(true);
        setLoading(false);
        return;
      }

      setCurrentUser(res.user);
      if (res.profile) {
        setProfile(res.profile);
        setFullName(res.profile.full_name ?? '');
        setDob(res.profile.date_of_birth ?? '');
        setGender(res.profile.gender ?? 'male');
        setCategory(res.profile.category ?? 'GEN');
        setAnnualIncome(res.profile.annual_family_income != null ? res.profile.annual_family_income.toString() : '');
        setStateCode(res.profile.state_code ?? '');
        setDistrict(res.profile.district ?? '');
        setDomicileStateCode(res.profile.domicile_state_code ?? '');
        setIsPwbd(res.profile.is_pwbd ?? false);
        setPwbdType(res.profile.pwbd_type ?? '');
        setIsExServiceman(res.profile.is_ex_serviceman ?? false);
        setIsMinority(res.profile.is_minority ?? false);
        setSpecialConditions(res.profile.special_conditions ?? []);
      }
      if (res.education) {
        setEducations(res.education);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  // Calculate live age from DOB
  const liveAge = useMemo(() => calculateAge(dob || null), [dob]);

  // Calculate profile completeness score
  const completeness = useMemo(() => {
    let score = 0;
    const total = 7;
    if (fullName.trim()) score++;
    if (dob) score++;
    if (gender) score++;
    if (category) score++;
    if (stateCode) score++;
    if (domicileStateCode) score++;
    if (educations.length > 0) score++;
    return Math.round((score / total) * 100);
  }, [fullName, dob, gender, category, stateCode, domicileStateCode, educations]);

  // Handle saving personal details
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);
    setSaving(true);

    const payload = {
      full_name: fullName.trim() || undefined,
      date_of_birth: dob || undefined,
      gender,
      category,
      annual_family_income: annualIncome ? parseInt(annualIncome, 10) : undefined,
      state_code: stateCode || undefined,
      district: district.trim() || undefined,
      domicile_state_code: domicileStateCode || undefined,
      is_pwbd: isPwbd,
      pwbd_type: isPwbd ? pwbdType.trim() || undefined : undefined,
      is_ex_serviceman: isExServiceman,
      is_minority: isMinority,
      special_conditions: specialConditions,
    };

    const res = await apiPut<UserProfile>('/me/profile', payload);
    setSaving(false);

    if (res.error || !res.data) {
      setSaveError(res.error || 'Failed to update profile.');
    } else {
      setProfile(res.data);
      setSaveSuccess('Personal details & eligibility criteria updated successfully!');
      setTimeout(() => setSaveSuccess(null), 4000);
    }
  }

  // Handle saving an education record
  async function handleSaveEducation(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);

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

    if (editingEduId) {
      const res = await apiPut<UserEducation>(`/me/education/${editingEduId}`, payload);
      setSaving(false);
      if (res.error || !res.data) {
        setSaveError(res.error || 'Could not update qualification.');
      } else {
        setEducations((prev) => prev.map((item) => (item.id === editingEduId ? res.data! : item)));
        setShowEduModal(false);
        setEditingEduId(null);
        setSaveSuccess('Qualification updated successfully!');
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    } else {
      const res = await apiPost<UserEducation>('/me/education', payload);
      setSaving(false);
      if (res.error || !res.data) {
        setSaveError(res.error || 'Could not add qualification.');
      } else {
        setEducations((prev) => [...prev, res.data!]);
        setShowEduModal(false);
        resetEduForm();
        setSaveSuccess('Qualification added to your profile!');
        setTimeout(() => setSaveSuccess(null), 3000);
      }
    }
  }

  // Handle deleting education record
  async function handleDeleteEducation(id: string) {
    if (!confirm('Are you sure you want to remove this qualification?')) return;
    setSaving(true);
    const res = await apiDelete(`/me/education/${id}`);
    setSaving(false);
    if (res.error) {
      setSaveError(res.error || 'Failed to delete qualification.');
    } else {
      setEducations((prev) => prev.filter((item) => item.id !== id));
      setSaveSuccess('Qualification removed.');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  }

  function openAddEducation() {
    resetEduForm();
    setEditingEduId(null);
    setShowEduModal(true);
  }

  function openEditEducation(edu: UserEducation) {
    setEditingEduId(edu.id);
    setEduLevel(edu.level);
    setEduDegree(edu.degree ?? '');
    setEduStream(edu.stream ?? '');
    setEduBoard(edu.board_or_university ?? '');
    setEduInstitution(edu.institution_name ?? '');
    setEduYear(edu.year_of_passing != null ? edu.year_of_passing.toString() : '');
    setEduScore(edu.score != null ? edu.score.toString() : '');
    setEduScoreType(edu.score_type ?? 'percentage');
    setEduStatus(edu.status);
    setShowEduModal(true);
  }

  function resetEduForm() {
    setEduLevel('graduate');
    setEduDegree('');
    setEduStream('');
    setEduBoard('');
    setEduInstitution('');
    setEduYear(new Date().getFullYear().toString());
    setEduScore('');
    setEduScoreType('percentage');
    setEduStatus('completed');
  }

  // Handle user logout
  async function handleLogout() {
    await apiPost('/auth/logout');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('currentUser');
    }
    router.push('/login');
  }

  // If loading initially
  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6 md:p-8 animate-pulse space-y-6">
        <div className="h-40 rounded-3xl bg-tea/40 border-2 border-line/60" />
        <div className="h-96 rounded-3xl bg-tea/20 border-2 border-line/40" />
      </div>
    );
  }

  // If user is not logged in
  if (isGuest) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 md:py-20 text-center [perspective:1000px]">
        <Card className="p-8 sm:p-12 border-2 border-line bg-cream rounded-3xl shadow-[0_20px_40px_-10px_rgba(17,75,95,0.22),0_6px_0_0_#114b5f]">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-tea/40 border-2 border-line shadow-xs mb-6">
            <User className="size-10 text-sea" />
          </div>
          <Badge tone="celadon" className="mb-3">Citizen Gateway</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-teal">
            Citizen Profile & Eligibility
          </h1>
          <p className="mt-3 text-sm text-teal/75 max-w-md mx-auto leading-relaxed">
            Create your central citizen profile to instantly match recruitment criteria across <strong>14,000+ government jobs</strong>, scholarships, and admissions.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="h-11 px-6 rounded-xl bg-teal text-cream font-black text-sm flex items-center justify-center gap-2 border-b-4 border-teal/70 shadow-md hover:-translate-y-0.5 active:translate-y-1 active:border-b-0 transition-all"
            >
              <LogIn className="size-4" /> Sign In to Your Profile
            </Link>
            <Link
              href="/register"
              className="h-11 px-6 rounded-xl bg-celadon text-teal font-extrabold text-sm flex items-center justify-center gap-2 border-2 border-line shadow-xs hover:bg-celadon/80 active:translate-y-0.5 transition-all"
            >
              <UserPlus className="size-4" /> Register New Account
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* 3D Profile Header Hero Card */}
      <Card className="p-6 sm:p-8 border-2 border-line bg-cream rounded-3xl shadow-[0_20px_40px_-10px_rgba(17,75,95,0.18),0_6px_0_0_#114b5f] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="grid size-16 sm:size-20 shrink-0 place-items-center rounded-2xl bg-celadon text-teal font-black text-2xl border-2 border-line shadow-[0_4px_0_0_#114b5f]">
              {fullName ? fullName.slice(0, 2).toUpperCase() : (currentUser?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-teal tracking-tight">
                  {fullName || 'Citizen Profile'}
                </h1>
                <Badge tone="teal" className="text-[11px] shadow-xs">
                  {category || 'General'}
                </Badge>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-teal/70">
                {currentUser?.email || currentUser?.phone || 'Citizen Account'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                {currentUser?.email_verified && (
                  <span className="inline-flex items-center gap-1 font-bold text-sea">
                    <ShieldCheck className="size-3.5" /> Email Verified
                  </span>
                )}
                {currentUser?.phone && (
                  <span className="inline-flex items-center gap-1 font-bold text-teal/80">
                    <ShieldCheck className="size-3.5 text-sea" /> {currentUser.phone}
                  </span>
                )}
                {profile?.updated_at && (
                  <span className="text-[11px] text-teal/60">
                    · Updated {new Date(profile.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Eligibility Readiness Gauge */}
          <div className="sm:max-w-xs w-full rounded-2xl border-2 border-line/70 bg-tea/30 p-4 shadow-inner">
            <div className="flex items-center justify-between text-xs font-black text-teal mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-sea" /> Eligibility Readiness
              </span>
              <span>{completeness}%</span>
            </div>
            <ProgressBar value={completeness} label="Profile Completeness" className="h-2.5 bg-canvas" />
            <p className="mt-2 text-[11px] text-teal/70">
              {completeness >= 85
                ? 'Ready for 100% automated eligibility checks across exams.'
                : 'Fill qualifications and domicile to match opportunities.'}
            </p>
          </div>
        </div>

        {/* Live Criteria Chips Bar */}
        <div className="mt-6 pt-5 border-t border-line/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl border border-line bg-canvas p-2.5">
            <span className="text-[10px] uppercase font-bold text-teal/60 block">Calculated Age</span>
            <span className="font-extrabold text-teal">
              {liveAge ? `${liveAge.years} yrs, ${liveAge.months} mos` : 'Add Date of Birth'}
            </span>
          </div>
          <div className="rounded-xl border border-line bg-canvas p-2.5">
            <span className="text-[10px] uppercase font-bold text-teal/60 block">Category</span>
            <span className="font-extrabold text-teal">{category}</span>
          </div>
          <div className="rounded-xl border border-line bg-canvas p-2.5">
            <span className="text-[10px] uppercase font-bold text-teal/60 block">Highest Qualification</span>
            <span className="font-extrabold text-teal">
              {educations.length > 0 ? educations[educations.length - 1].level.toUpperCase() : 'Not added'}
            </span>
          </div>
          <div className="rounded-xl border border-line bg-canvas p-2.5">
            <span className="text-[10px] uppercase font-bold text-teal/60 block">Domicile State</span>
            <span className="font-extrabold text-teal">
              {domicileStateCode ? INDIAN_STATES.find((s) => s.code === domicileStateCode)?.name ?? domicileStateCode : 'Not selected'}
            </span>
          </div>
        </div>
      </Card>

      {/* 3D Segmented Navigation Tabs */}
      <div className="flex rounded-2xl border-2 border-line/70 bg-tea/30 p-1.5 shadow-[inset_0_2px_4px_rgba(17,75,95,0.06)]">
        <button
          type="button"
          onClick={() => setTab('personal')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-black transition-all ${
            tab === 'personal'
              ? 'bg-cream text-teal border border-line shadow-[0_3px_0_0_#114b5f,0_4px_8px_rgba(17,75,95,0.1)] -translate-y-0.5'
              : 'text-teal/70 hover:text-teal hover:bg-tea/40'
          }`}
        >
          <User className="size-4 text-sea" />
          <span>Personal & Eligibility</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('education')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-black transition-all ${
            tab === 'education'
              ? 'bg-cream text-teal border border-line shadow-[0_3px_0_0_#114b5f,0_4px_8px_rgba(17,75,95,0.1)] -translate-y-0.5'
              : 'text-teal/70 hover:text-teal hover:bg-tea/40'
          }`}
        >
          <GraduationCap className="size-4 text-sea" />
          <span>Education ({educations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('account')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-black transition-all ${
            tab === 'account'
              ? 'bg-cream text-teal border border-line shadow-[0_3px_0_0_#114b5f,0_4px_8px_rgba(17,75,95,0.1)] -translate-y-0.5'
              : 'text-teal/70 hover:text-teal hover:bg-tea/40'
          }`}
        >
          <ShieldCheck className="size-4 text-sea" />
          <span>Account Settings</span>
        </button>
      </div>

      {/* Global Alerts */}
      {saveSuccess && (
        <div className="rounded-2xl border-2 border-celadon bg-celadon/25 p-4 text-xs font-bold text-teal flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="size-5 text-sea shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="rounded-2xl border-2 border-line bg-tea/50 p-4 text-xs font-bold text-teal flex items-center gap-3 shadow-xs" role="alert">
          <Info className="size-5 text-teal shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* TAB 1: Personal Details Form */}
      {tab === 'personal' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <Card className="p-6 sm:p-8 border-2 border-line bg-cream rounded-3xl shadow-[0_20px_40px_-10px_rgba(17,75,95,0.12),0_4px_0_0_#114b5f] space-y-6">
            <div>
              <h2 className="text-lg font-black text-teal">Personal Identification</h2>
              <p className="text-xs text-teal/70 mt-0.5">
                Exact details as mentioned on your 10th marksheet or official government IDs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                  Full Name (as on Certificate)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Karthik YGS"
                  className="w-full rounded-xl border-2 border-line bg-canvas px-3.5 py-2.5 text-sm text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80">
                    Date of Birth
                  </label>
                  {liveAge && (
                    <span className="text-[11px] font-bold text-sea">
                      {liveAge.years} years, {liveAge.months} months
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 size-4 text-teal/50" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-xl border-2 border-line bg-canvas pl-10 pr-3.5 py-2 text-sm text-teal focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f]"
                  />
                </div>
              </div>
            </div>

            {/* Gender and Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['male', 'female', 'transgender', 'prefer_not_to_say'] as UserGender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold capitalize transition-all border ${
                        gender === g
                          ? 'bg-celadon text-teal border-line shadow-[0_2px_0_0_#114b5f] -translate-y-0.5'
                          : 'bg-canvas text-teal/70 border-line hover:text-teal hover:bg-tea/30'
                      }`}
                    >
                      {g === 'prefer_not_to_say' ? 'Prefer not to say' : g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-2">
                  Reservation Category (Social Category)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['GEN', 'OBC', 'SC', 'ST', 'EWS'] as SocialCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all border ${
                        category === cat
                          ? 'bg-celadon text-teal border-line shadow-[0_2px_0_0_#114b5f] -translate-y-0.5'
                          : 'bg-canvas text-teal/70 border-line hover:text-teal hover:bg-tea/30'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-teal/60">
                  Used to calculate reservation fee exemptions, age relaxations, and quotas.
                </p>
              </div>
            </div>

            {/* Location & Domicile */}
            <div className="pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-3">
                State & Domicile Eligibility
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-teal/70 mb-1">
                    Home State (Current)
                  </label>
                  <select
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-2 text-xs font-bold text-teal focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f]"
                  >
                    <option value="">-- Select State --</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-teal/70 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Hyderabad / Visakhapatnam"
                    className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-2 text-xs font-bold text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-teal/70 mb-1">
                    State of Domicile (State Jobs Quota)
                  </label>
                  <select
                    value={domicileStateCode}
                    onChange={(e) => setDomicileStateCode(e.target.value)}
                    className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-2 text-xs font-bold text-teal focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f]"
                  >
                    <option value="">-- Select Domicile State --</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Income & Scholarships */}
            <div className="pt-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                Annual Family Income (in ₹)
              </label>
              <div className="relative max-w-sm">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-teal/50">₹</span>
                <input
                  type="number"
                  min="0"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value)}
                  placeholder="e.g. 250000"
                  className="w-full rounded-xl border-2 border-line bg-canvas pl-8 pr-3 py-2 text-sm text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea shadow-[inset_0_2px_4px_rgba(17,75,95,0.06),0_2px_0_0_#114b5f]"
                />
              </div>
              <p className="mt-1 text-[11px] text-teal/60">
                Required for checking eligibility for EWS reservations (under ₹8 Lakhs) and government pre/post-matric scholarships.
              </p>
            </div>
          </Card>

          {/* Special Affirmative Criteria Card */}
          <Card className="p-6 sm:p-8 border-2 border-line bg-cream rounded-3xl shadow-[0_20px_40px_-10px_rgba(17,75,95,0.12),0_4px_0_0_#114b5f] space-y-4">
            <div>
              <h2 className="text-base font-black text-teal">Special Categories & Relaxations</h2>
              <p className="text-xs text-teal/70 mt-0.5">
                Optional government relaxation criteria for age limits, application fee exemptions, and special quotas.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* PwBD Toggle */}
              <div className="rounded-2xl border-2 border-line bg-canvas p-4 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-teal block">
                      Person with Benchmark Disability (PwBD / Divyangjan)
                    </span>
                    <span className="text-[11px] text-teal/70">
                      Disability of 40% or more as certified by medical board.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPwbd(!isPwbd)}
                    className={`h-7 w-12 rounded-full p-1 transition-colors border ${
                      isPwbd ? 'bg-sea border-sea' : 'bg-tea/60 border-line'
                    }`}
                  >
                    <div
                      className={`size-5 rounded-full bg-cream transition-transform shadow-xs ${
                        isPwbd ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                {isPwbd && (
                  <div className="mt-3 pt-3 border-t border-line/50">
                    <label className="block text-[11px] font-bold text-teal/80 mb-1">
                      Disability Category / Type
                    </label>
                    <input
                      type="text"
                      value={pwbdType}
                      onChange={(e) => setPwbdType(e.target.value)}
                      placeholder="e.g. Locomotor, Visual Impairment, Hearing Impairment"
                      className="w-full rounded-xl border-2 border-line bg-cream px-3 py-1.5 text-xs text-teal focus:outline-none focus:border-sea"
                    />
                  </div>
                )}
              </div>

              {/* Ex-serviceman Toggle */}
              <div className="rounded-2xl border-2 border-line bg-canvas p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-teal block">
                    Ex-Serviceman (Armed Forces)
                  </span>
                  <span className="text-[11px] text-teal/70">
                    Eligible for military quota and substantial age deduction in recruitments.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExServiceman(!isExServiceman)}
                  className={`h-7 w-12 rounded-full p-1 transition-colors border ${
                    isExServiceman ? 'bg-sea border-sea' : 'bg-tea/60 border-line'
                  }`}
                >
                  <div
                    className={`size-5 rounded-full bg-cream transition-transform shadow-xs ${
                      isExServiceman ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Minority Toggle */}
              <div className="rounded-2xl border-2 border-line bg-canvas p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-teal block">
                    Religious / Linguistic Minority Community
                  </span>
                  <span className="text-[11px] text-teal/70">
                    Required for minority welfare scholarships (Begum Hazrat Mahal, Maulana Azad, etc.).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMinority(!isMinority)}
                  className={`h-7 w-12 rounded-full p-1 transition-colors border ${
                    isMinority ? 'bg-sea border-sea' : 'bg-tea/60 border-line'
                  }`}
                >
                  <div
                    className={`size-5 rounded-full bg-cream transition-transform shadow-xs ${
                      isMinority ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Sticky Save Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="h-12 px-8 rounded-xl bg-teal text-cream font-black text-sm tracking-wide border-b-4 border-teal/70 shadow-[0_6px_14px_rgba(17,75,95,0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(17,75,95,0.35)] active:translate-y-1 active:border-b-0 active:shadow-none transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="size-4" />
              {saving ? 'Saving Profile...' : 'Save Personal Details'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Educational Qualifications */}
      {tab === 'education' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-teal">Educational Qualifications</h2>
              <p className="text-xs text-teal/70">
                Add your 10th, 12th, degree, and postgraduate details for eligibility matching.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddEducation}
              className="h-10 px-4 rounded-xl bg-teal text-cream font-black text-xs flex items-center gap-2 border-b-2 border-teal/70 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all shrink-0"
            >
              <Plus className="size-4" /> Add Qualification
            </button>
          </div>

          {educations.length === 0 ? (
            <Card className="p-10 border-2 border-line bg-cream rounded-3xl text-center space-y-4">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-tea/40 border border-line">
                <GraduationCap className="size-8 text-sea" />
              </div>
              <div>
                <h3 className="text-base font-bold text-teal">No Qualifications Added Yet</h3>
                <p className="text-xs text-teal/70 max-w-sm mx-auto mt-1">
                  Adding your educational background lets ApplyFields check your eligibility for Graduate & 12th pass government jobs.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddEducation}
                className="h-10 px-5 rounded-xl bg-celadon text-teal font-extrabold text-xs inline-flex items-center gap-2 border-2 border-line shadow-xs hover:bg-celadon/80 transition-all"
              >
                <Plus className="size-4" /> Add 10th / Secondary School
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {educations.map((edu) => (
                <Card
                  key={edu.id}
                  className="p-5 border-2 border-line bg-cream rounded-2xl shadow-[0_12px_24px_-8px_rgba(17,75,95,0.12),0_3px_0_0_#114b5f] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge tone="celadon" className="text-[11px] font-black uppercase">
                        {edu.level}
                      </Badge>
                      <span className="text-[11px] font-bold text-teal/60">
                        {edu.status === 'completed' ? `Passed ${edu.year_of_passing}` : 'Currently Pursuing'}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-teal">
                      {edu.degree || EDUCATION_LEVEL_LABELS[edu.level]}
                    </h3>
                    {edu.stream && (
                      <p className="text-xs font-bold text-sea mt-0.5">{edu.stream}</p>
                    )}

                    <div className="mt-3 space-y-1 text-xs text-teal/75">
                      {edu.institution_name && (
                        <p className="truncate">🏛️ {edu.institution_name}</p>
                      )}
                      {edu.board_or_university && (
                        <p className="truncate">📋 {edu.board_or_university}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                    <div>
                      {edu.score != null ? (
                        <span className="font-mono text-xs font-black text-teal bg-canvas px-2.5 py-1 rounded-lg border border-line">
                          {edu.score} {edu.score_type === 'percentage' ? '%' : edu.score_type?.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[11px] text-teal/50">Score not specified</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditEducation(edu)}
                        className="p-2 rounded-xl text-teal/70 hover:text-teal hover:bg-tea/40 transition-colors"
                        title="Edit Qualification"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="p-2 rounded-xl text-teal/50 hover:text-red-700 hover:bg-tea/40 transition-colors"
                        title="Delete Qualification"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Add / Edit Qualification Modal */}
          {showEduModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal/40 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="w-full max-w-lg rounded-3xl border-2 border-line bg-cream p-6 sm:p-8 shadow-[0_24px_48px_rgba(17,75,95,0.35),0_6px_0_0_#114b5f] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-black text-teal">
                    {editingEduId ? 'Edit Qualification' : 'Add Qualification'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowEduModal(false)}
                    className="p-1.5 rounded-xl hover:bg-tea/40 text-teal/70 hover:text-teal transition-all"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEducation} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                      Qualification Level
                    </label>
                    <select
                      value={eduLevel}
                      onChange={(e) => setEduLevel(e.target.value as EducationLevel)}
                      className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-2.5 text-xs font-bold text-teal focus:outline-none focus:border-sea"
                    >
                      {(Object.keys(EDUCATION_LEVEL_LABELS) as EducationLevel[]).map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {EDUCATION_LEVEL_LABELS[lvl]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                        Degree / Exam Name
                      </label>
                      <input
                        type="text"
                        value={eduDegree}
                        onChange={(e) => setEduDegree(e.target.value)}
                        placeholder="e.g. B.Tech, SSC, Intermediate"
                        className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-2 text-xs text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                        Stream / Branch
                      </label>
                      <input
                        type="text"
                        value={eduStream}
                        onChange={(e) => setEduStream(e.target.value)}
                        placeholder="e.g. CSE, MPC, Commerce"
                        className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-2 text-xs text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                      Board or University
                    </label>
                    <input
                      type="text"
                      value={eduBoard}
                      onChange={(e) => setEduBoard(e.target.value)}
                      placeholder="e.g. CBSE, ICSE, JNTU Hyderabad"
                      className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-2 text-xs text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                      College or School Name
                    </label>
                    <input
                      type="text"
                      value={eduInstitution}
                      onChange={(e) => setEduInstitution(e.target.value)}
                      placeholder="e.g. St. Xavier’s High School"
                      className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-2 text-xs text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                        Status
                      </label>
                      <div className="flex rounded-xl border border-line bg-canvas p-1">
                        <button
                          type="button"
                          onClick={() => setEduStatus('completed')}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                            eduStatus === 'completed' ? 'bg-cream text-teal shadow-xs' : 'text-teal/60'
                          }`}
                        >
                          Completed
                        </button>
                        <button
                          type="button"
                          onClick={() => setEduStatus('pursuing')}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                            eduStatus === 'pursuing' ? 'bg-cream text-teal shadow-xs' : 'text-teal/60'
                          }`}
                        >
                          Pursuing
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                        Year of Passing
                      </label>
                      <input
                        type="number"
                        min="1950"
                        max="2100"
                        value={eduYear}
                        onChange={(e) => setEduYear(e.target.value)}
                        className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-1.5 text-xs text-teal focus:outline-none focus:border-sea"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                        Score / Marks
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={eduScore}
                        onChange={(e) => setEduScore(e.target.value)}
                        placeholder="e.g. 85.5 or 8.4"
                        className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-1.5 text-xs text-teal placeholder:text-teal/40 focus:outline-none focus:border-sea"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-teal/80 mb-1.5">
                        Score Type
                      </label>
                      <select
                        value={eduScoreType}
                        onChange={(e) => setEduScoreType(e.target.value as ScoreType)}
                        className="w-full rounded-xl border-2 border-line bg-canvas px-3 py-1.5 text-xs font-bold text-teal focus:outline-none focus:border-sea"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="cgpa">CGPA (Out of 10)</option>
                        <option value="grade">Grade</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEduModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-line bg-canvas text-teal text-xs font-bold hover:bg-tea/30"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl bg-teal text-cream text-xs font-black border-b-2 border-teal/70 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all"
                    >
                      {saving ? 'Saving...' : editingEduId ? 'Update Qualification' : 'Add to Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Account & Session Settings */}
      {tab === 'account' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 border-2 border-line bg-cream rounded-3xl shadow-[0_20px_40px_-10px_rgba(17,75,95,0.12),0_4px_0_0_#114b5f] space-y-6">
            <div>
              <h2 className="text-base font-black text-teal">Account Credentials & Contact</h2>
              <p className="text-xs text-teal/70 mt-0.5">
                Your registered email and phone number used for login and security verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-line bg-canvas p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-teal/60 block">Registered Email</span>
                <span className="font-extrabold text-teal block">{currentUser?.email || 'None'}</span>
                <span className="text-[11px] font-bold text-sea inline-flex items-center gap-1">
                  <ShieldCheck className="size-3.5" /> Verified
                </span>
              </div>

              <div className="rounded-2xl border-2 border-line bg-canvas p-4 space-y-1">
                <span className="text-[10px] uppercase font-bold text-teal/60 block">Registered Phone</span>
                <span className="font-extrabold text-teal block">{currentUser?.phone || 'None'}</span>
                <span className="text-[11px] font-bold text-teal/70">
                  {currentUser?.phone ? 'Linked for OTP login' : 'No phone linked'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-teal block">Sign Out of ApplyFields</span>
                <span className="text-[11px] text-teal/70">
                  Ends your current session and clears your tokens on this device.
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="h-10 px-5 rounded-xl bg-tea text-teal font-extrabold text-xs border border-line hover:bg-tea/80 active:translate-y-0.5 transition-all shrink-0"
              >
                Sign Out
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
