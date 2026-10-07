'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Card, ProgressBar } from '@applyfields/ui';
import { apiGet, apiPut, apiPost, apiDelete, API_URL } from '@/lib/api';
import { PixelAvatar, PIXEL_AVATARS } from '@/components/pixel-avatars';
import {
  convertFileToBase64,
  extractEducationFromResume,
  type ExtractedEducation,
} from '@/lib/resume-parser';
import type {
  EducationLevel,
  EducationStatus,
  MeResponse,
  ResumeApiResponse,
  ScoreType,
  SocialCategory,
  UserEducation,
  UserGender,
  UserProfile,
  UserResumeDocument,
  UserSummary,
} from '@applyfields/types';
import {
  Calendar,
  Check,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  GraduationCap,
  Info,
  LogIn,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  UserPlus,
  Wand2,
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

const EDUCATION_LEVEL_ORDER: Record<string, number> = {
  '10th': 1, '12th': 2, iti: 3, diploma: 4, graduate: 5, post_graduate: 6, phd: 7,
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

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState<string>('pixel-scholar');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Form states - Personal details
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<UserGender | ''>('');
  const [category, setCategory] = useState<SocialCategory | ''>('');
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

  // Resume Upload & Extraction states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedResume, setSavedResume] = useState<UserResumeDocument | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedEducations, setExtractedEducations] = useState<ExtractedEducation[]>([]);
  const [isImporting, setIsImporting] = useState(false);

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
        setAvatarUrl(res.profile.avatar_url || 'pixel-scholar');
        setFullName(res.profile.full_name ?? '');
        setDob(res.profile.date_of_birth ?? '');
        setGender(res.profile.gender ?? '');
        setCategory(res.profile.category ?? '');
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

      // Check if user has an active saved resume on file
      const resumeRes = await apiGet<{ resume: UserResumeDocument | null }>('/me/resume');
      if (resumeRes?.resume) {
        setSavedResume(resumeRes.resume);
        if (resumeRes.resume.details?.qualifications && resumeRes.resume.details.qualifications.length > 0) {
          setExtractedEducations(resumeRes.resume.details.qualifications);
        }
        if (resumeRes.resume.details?.extracted_text) {
          setResumeText(resumeRes.resume.details.extracted_text);
        }
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
      avatar_url: avatarUrl,
      full_name: fullName.trim() || undefined,
      date_of_birth: dob || undefined,
      gender: (gender as UserGender) || undefined,
      category: (category as SocialCategory) || undefined,
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

  // Handle selecting one of the 10 pixel avatars
  async function handleSelectAvatar(newAvatarId: string) {
    setAvatarUrl(newAvatarId);
    setShowAvatarModal(false);
    setSaveSuccess('Avatar selected! Saving profile...');

    const res = await apiPut<UserProfile>('/me/profile', { avatar_url: newAvatarId });
    if (res.data) {
      setProfile(res.data);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'));
      }
      setSaveSuccess('Pixel avatar updated successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
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

  // Resume File Upload handler - persists resume on profile & runs OCR/AI extraction
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // 1. Encode file to base64 Data URL
      const fileBase64 = await convertFileToBase64(file);

      // 2. Upload to server: saves file permanently to storage & user_documents, performs OCR/parsing
      const res = await apiPost<ResumeApiResponse>('/me/resume', {
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        fileBase64,
        text: resumeText.trim() || undefined,
      });

      if (res.error || !res.data || !res.data.success) {
        throw new Error(res.error || 'Server could not process resume file');
      }

      setSavedResume(res.data.resume);
      if (res.data.text) {
        setResumeText(res.data.text);
      }

      const parsed = res.data.qualifications || [];
      setExtractedEducations(parsed);

      if (parsed.length === 0) {
        setSaveSuccess('Resume uploaded and securely saved! No qualifications were auto-detected; you can add them manually or paste text.');
      } else {
        setSaveSuccess(`Resume securely saved to your profile! Extracted ${parsed.length} qualification(s). Review and click Import All below.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process resume file';
      setSaveError(`Resume upload failed: ${msg}. You can try pasting your resume text directly below.`);
    } finally {
      setIsExtracting(false);
      if (e.target) e.target.value = '';
    }
  }

  async function handleDownloadResume() {
    if (!savedResume) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`${API_URL}/me/resume/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = savedResume.file_name || 'Resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setSaveError('Could not download saved resume.');
    }
  }

  async function handleDeleteResume() {
    if (!confirm('Are you sure you want to remove your saved resume from your profile?')) return;
    setIsExtracting(true);
    setSaveError(null);
    try {
      const res = await apiDelete<{ success: boolean }>('/me/resume');
      if (res.error) throw new Error(res.error);
      setSavedResume(null);
      setExtractedEducations([]);
      setResumeText('');
      setSaveSuccess('Resume successfully removed from your profile.');
    } catch {
      setSaveError('Failed to remove saved resume.');
    } finally {
      setIsExtracting(false);
    }
  }

  // Extract from pasted text
  function handleExtractFromText() {
    if (!resumeText.trim()) return;
    setIsExtracting(true);
    const parsed = extractEducationFromResume(resumeText);
    setExtractedEducations(parsed);
    setIsExtracting(false);
    if (parsed.length === 0) {
      setSaveError('No educational milestones recognized. Ensure degrees like B.Tech, SSC, or 12th are mentioned.');
    } else {
      setSaveSuccess(`Identified ${parsed.length} qualification(s) from your resume! Review and import below.`);
    }
  }

  // Import all extracted qualifications to user profile
  async function handleImportExtracted() {
    if (extractedEducations.length === 0) return;
    setIsImporting(true);
    setSaveError(null);

    let successCount = 0;
    const addedList: UserEducation[] = [];

    for (const item of extractedEducations) {
      const payload = {
        level: item.level,
        degree: item.degree || undefined,
        stream: item.stream || undefined,
        board_or_university: item.board_or_university || undefined,
        institution_name: item.institution_name || undefined,
        year_of_passing: item.year_of_passing ?? undefined,
        score: item.score ?? undefined,
        score_type: item.score_type,
        status: item.status,
      };

      const res = await apiPost<UserEducation>('/me/education', payload);
      if (res.data) {
        successCount++;
        addedList.push(res.data);
      }
    }

    setIsImporting(false);
    setEducations((prev) => [...prev, ...addedList]);
    setExtractedEducations([]);
    setResumeText('');
    setSaveSuccess(`Imported ${successCount} qualification(s) from your resume into your profile!`);
    setTimeout(() => setSaveSuccess(null), 4000);
  }

  // Handle user logout
  async function handleLogout() {
    const rawRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') ?? undefined : undefined;
    await apiPost('/auth/logout', { refreshToken: rawRefreshToken });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      window.dispatchEvent(new Event('auth-changed'));
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
            Create your central citizen profile to instantly match recruitment criteria across government jobs, scholarships, and admissions.
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
            {/* Interactive Pixel Avatar with Change Badge */}
            <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
              <div className="rounded-2xl border-2 border-line p-1 bg-canvas shadow-[0_4px_0_0_#114b5f] group-hover:scale-105 transition-transform">
                <PixelAvatar avatarId={avatarUrl} size={72} />
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-teal text-cream shadow-xs border border-cream hover:bg-sea transition-all"
                title="Choose Pixel Avatar"
              >
                <Wand2 className="size-3.5" />
              </button>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-teal tracking-tight">
                  {fullName || 'Citizen Profile'}
                </h1>
                <Badge tone="teal" className="text-[11px] shadow-xs">
                  {category || 'General'}
                </Badge>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="px-2.5 py-0.5 rounded-full bg-tea/60 border border-line text-[10px] font-extrabold text-teal hover:bg-tea transition-all"
                >
                  Change Pixel Avatar
                </button>
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
            <span className="font-extrabold text-teal">{category || 'Not set'}</span>
          </div>
          <div className="rounded-xl border border-line bg-canvas p-2.5">
            <span className="text-[10px] uppercase font-bold text-teal/60 block">Highest Qualification</span>
            <span className="font-extrabold text-teal">
              {educations.length > 0
                ? educations.reduce((best, e) =>
                    (EDUCATION_LEVEL_ORDER[e.level] ?? 0) > (EDUCATION_LEVEL_ORDER[best.level] ?? 0) ? e : best
                  ).level.toUpperCase()
                : 'Not added'}
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

      {/* 10 Pixel Avatars Selector Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl border-2 border-line bg-cream p-6 sm:p-8 shadow-[0_24px_48px_rgba(17,75,95,0.35),0_6px_0_0_#114b5f]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-teal">Select Your Pixel Avatar</h3>
                <p className="text-xs text-teal/70">
                  Pick one of 10 handcrafted retro pixel characters for your citizen profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="p-1.5 rounded-xl hover:bg-tea/40 text-teal/70 hover:text-teal transition-all"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto p-1">
              {PIXEL_AVATARS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectAvatar(item.id)}
                  className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all text-center relative group ${
                    avatarUrl === item.id
                      ? 'border-sea bg-sea/15 shadow-[0_4px_0_0_#028090] -translate-y-1'
                      : 'border-line bg-canvas hover:border-teal/50 hover:bg-tea/20'
                  }`}
                >
                  <PixelAvatar avatarId={item.id} size={56} className="shadow-xs mb-2" />
                  <span className="text-xs font-black text-teal leading-tight block">{item.name}</span>
                  <span className="text-[10px] text-teal/60 truncate w-full mt-0.5">{item.title}</span>
                  {avatarUrl === item.id && (
                    <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-sea text-cream">
                      <Check className="size-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-line/60 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-5 py-2 rounded-xl border border-line bg-canvas text-xs font-bold text-teal hover:bg-tea/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* TAB 2: Educational Qualifications & Resume Extractor */}
      {tab === 'education' && (
        <div className="space-y-6">
          {/* Smart Resume Extraction Feature Card */}
          <Card className="p-6 sm:p-7 border-2 border-sea/30 bg-sea/10 rounded-3xl shadow-[0_16px_32px_-8px_rgba(2,128,144,0.15),0_4px_0_0_#028090] relative overflow-hidden">
            {savedResume ? (
              <div className="p-4 sm:p-5 rounded-2xl border-2 border-sea/30 bg-cream/90 shadow-xs mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="grid size-12 place-items-center rounded-2xl bg-sea text-cream shadow-xs shrink-0">
                    <FileCheck2 className="size-6 text-cream" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-black text-teal">
                        {savedResume.file_name || 'Resume.pdf'}
                      </h4>
                      <Badge tone="celadon" className="text-[10px] font-black uppercase">
                        Saved On Profile
                      </Badge>
                    </div>
                    <p className="text-xs text-teal/70 mt-0.5">
                      {savedResume.size_bytes ? `${Math.round(savedResume.size_bytes / 1024)} KB • ` : ''}
                      Uploaded {new Date(savedResume.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.docx,.text,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleDownloadResume}
                    className="h-9 px-3.5 rounded-xl bg-teal text-cream font-bold text-xs flex items-center gap-1.5 hover:bg-teal/90 active:translate-y-0.5 transition-all shadow-xs"
                    title="Download or view saved resume"
                  >
                    <Download className="size-3.5" /> Download
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="h-9 px-3.5 rounded-xl bg-canvas border border-line text-teal font-bold text-xs flex items-center gap-1.5 hover:bg-tea/30 active:translate-y-0.5 transition-all disabled:opacity-60"
                    title="Upload a new resume to replace this one"
                  >
                    <RefreshCw className={`size-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                    {isExtracting ? 'Updating...' : 'Change Resume'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteResume}
                    disabled={isExtracting}
                    className="h-9 px-3 rounded-xl border border-coral/30 text-coral hover:bg-coral/10 font-bold text-xs flex items-center gap-1.5 active:translate-y-0.5 transition-all"
                    title="Remove saved resume"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <Badge tone="celadon" className="mb-1.5 shadow-xs">
                    <Sparkles className="size-3 text-sea mr-1" /> AI Resume Extractor
                  </Badge>
                  <h3 className="text-base sm:text-lg font-black text-teal">
                    Upload Resume to Extract Educational Background
                  </h3>
                  <p className="text-xs text-teal/75 mt-0.5">
                    Drop your resume file or paste text below. We will save it to your profile and automatically parse your degrees, streams, universities, and scores.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.docx,.text,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="h-10 px-4 rounded-xl bg-sea text-cream font-black text-xs flex items-center gap-2 border-b-2 border-sea/80 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-60"
                  >
                    <UploadCloud className="size-4" />
                    {isExtracting ? 'Extracting...' : 'Upload Resume (.pdf / .txt)'}
                  </button>
                </div>
              </div>
            )}

            {/* Paste or review text collapsible box */}
            <div className="rounded-2xl border-2 border-line bg-canvas p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal/70 flex items-center gap-1.5">
                  <FileText className="size-3.5 text-sea" /> Or Paste Resume Text
                </span>
                {resumeText && (
                  <button
                    type="button"
                    onClick={handleExtractFromText}
                    className="text-[11px] font-black text-sea underline hover:text-teal"
                  >
                    Re-Analyze Text
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste education section from your resume here (e.g. B.Tech Computer Science JNTU 2024 CGPA 8.4)..."
                className="w-full rounded-xl bg-cream p-2.5 text-xs text-teal placeholder:text-teal/40 focus:outline-none focus:ring-1 focus:ring-sea border border-line"
              />
              {resumeText && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleExtractFromText}
                    disabled={isExtracting}
                    className="px-4 py-1.5 rounded-xl bg-teal text-cream text-xs font-black hover:bg-teal/90 active:translate-y-0.5 transition-all shadow-xs"
                  >
                    Extract Qualifications
                  </button>
                </div>
              )}
            </div>

            {/* Extracted Qualifications Preview & One-Click Import */}
            {extractedEducations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-sea/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-teal">
                      Recognized Qualifications ({extractedEducations.length}):
                    </span>
                    <Badge tone="celadon" className="text-[10px]">Ready to Import</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={handleImportExtracted}
                    disabled={isImporting}
                    className="px-4 py-2 rounded-xl bg-teal text-cream font-black text-xs flex items-center gap-1.5 border-b-2 border-teal/70 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all disabled:opacity-60"
                  >
                    <Check className="size-3.5" />
                    {isImporting ? 'Importing...' : `Import All (${extractedEducations.length}) to Profile`}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {extractedEducations.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border-2 border-line bg-cream shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <Badge tone="celadon" className="text-[10px] font-black uppercase">
                          {item.level}
                        </Badge>
                        <span className="text-[10px] font-extrabold text-teal/60">
                          {item.year_of_passing ? `Year: ${item.year_of_passing}` : 'Year: -'}
                        </span>
                      </div>
                      <p className="text-xs font-black text-teal leading-tight">{item.degree}</p>
                      {item.stream && (
                        <p className="text-[11px] font-bold text-sea">{item.stream}</p>
                      )}
                      {item.institution_name && (
                        <p className="text-[10px] text-teal/70 truncate">🏛️ {item.institution_name}</p>
                      )}
                      {item.score != null && (
                        <span className="inline-block mt-1 font-mono text-[10px] font-bold text-teal bg-canvas px-2 py-0.5 rounded border border-line">
                          Score: {item.score} {item.score_type === 'percentage' ? '%' : 'CGPA'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Education Header with Manual Add Button */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h2 className="text-lg font-black text-teal">Saved Qualifications</h2>
              <p className="text-xs text-teal/70">
                Your saved education records checked against recruitment eligibility rules.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddEducation}
              className="h-10 px-4 rounded-xl bg-teal text-cream font-black text-xs flex items-center gap-2 border-b-2 border-teal/70 shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-0 transition-all shrink-0"
            >
              <Plus className="size-4" /> Add Manually
            </button>
          </div>

          {educations.length === 0 ? (
            <Card className="p-10 border-2 border-line bg-cream rounded-3xl text-center space-y-4">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-tea/40 border border-line">
                <GraduationCap className="size-8 text-sea" />
              </div>
              <div>
                <h3 className="text-base font-bold text-teal">No Qualifications Saved Yet</h3>
                <p className="text-xs text-teal/70 max-w-sm mx-auto mt-1">
                  Upload your resume above or add your qualifications manually to enable automatic exam eligibility matching.
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
