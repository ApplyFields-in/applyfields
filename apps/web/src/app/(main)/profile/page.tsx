'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiPut, apiPost, apiDelete, API_URL } from '@/lib/api';
import { PixelAvatar, PIXEL_AVATARS } from '@/components/pixel-avatars';
import {
  convertFileToBase64,
  extractEducationFromResume,
  type ExtractedEducation,
} from '@/lib/resume-parser';
import {
  HorizontalOpportunityCard,
  type ExtendedOpportunityCard,
} from '@/components/opportunity/horizontal-opportunity-card';
import type {
  EducationLevel,
  EducationStatus,
  MeResponse,
  OpportunityList,
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
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Columns,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  Info,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  UserCheck,
  UserPlus,
  Wand2,
  X,
  Award,
  Banknote,
  Briefcase,
} from 'lucide-react';
import {
  CompetitiveExamScoresCard,
  type CompetitiveExamScore,
} from '@/components/profile/competitive-exam-scores-card';
import { CandidateCardModal } from '@/components/profile/candidate-card-modal';
import {
  TOP_50_COLLEGES,
  TOP_50_ENGINEERING_COLLEGES,
  TOP_50_MEDICAL_COLLEGES,
} from '@/lib/top-50-colleges-data';
import { SaveButton } from '@/components/save-button';
import { ShareModal } from '@/components/share/share-modal';

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
  '12th': '12th / Intermediate',
  iti: 'ITI (Vocational)',
  diploma: 'Polytechnic Diploma',
  graduate: "Bachelor's Degree",
  post_graduate: "Master's Degree",
  phd: 'Doctorate (Ph.D)',
};

const EDUCATION_LEVEL_ORDER: Record<string, number> = {
  '10th': 1,
  '12th': 2,
  iti: 3,
  diploma: 4,
  graduate: 5,
  post_graduate: 6,
  phd: 7,
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

  // Card Edit modes
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState<string>('pixel-scholar');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Form states - Personal details
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<UserGender | ''>('');
  const [category, setCategory] = useState<SocialCategory | ''>('');
  const [annualIncome, setAnnualIncome] = useState<string>('');
  const [isPwbd, setIsPwbd] = useState(false);
  const [pwbdType, setPwbdType] = useState('');
  const [isExServiceman, setIsExServiceman] = useState(false);
  const [isMinority, setIsMinority] = useState(false);

  // Form states - Address & Domicile
  const [stateCode, setStateCode] = useState('');
  const [district, setDistrict] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [domicileStateCode, setDomicileStateCode] = useState('');

  // Preferences & Skills
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [specialConditions, setSpecialConditions] = useState<string[]>([]);
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [targetJobTypes, setTargetJobTypes] = useState<string[]>([
    'Government Exam',
    'Government Job',
  ]);

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
  const [showResumeSection, setShowResumeSection] = useState(false);

  // Relevant for you matching opportunities
  const [relevantOpportunities, setRelevantOpportunities] = useState<ExtendedOpportunityCard[]>([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(false);

  // Shareable Candidate Card & Exam Scores
  const [showCandidateCardModal, setShowCandidateCardModal] = useState(false);
  const [examScores, setExamScores] = useState<CompetitiveExamScore[]>([]);
  const [bottomTab, setBottomTab] = useState<'jobs' | 'colleges'>('jobs');
  const [collegeFilter, setCollegeFilter] = useState<'all' | 'engineering' | 'medical' | 'state'>('all');

  // Actions & status states
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
        setAvatarUrl(res.profile.avatar_url || 'pixel-scholar');
        setFullName(res.profile.full_name ?? '');
        setDob(res.profile.date_of_birth ?? '');
        setGender(res.profile.gender ?? '');
        setCategory(res.profile.category ?? '');
        setAnnualIncome(
          res.profile.annual_family_income != null
            ? res.profile.annual_family_income.toString()
            : ''
        );
        setStateCode(res.profile.state_code ?? '');
        setDistrict(res.profile.district ?? '');
        setDomicileStateCode(res.profile.domicile_state_code ?? '');
        setIsPwbd(res.profile.is_pwbd ?? false);
        setPwbdType(res.profile.pwbd_type ?? '');
        setIsExServiceman(res.profile.is_ex_serviceman ?? false);
        setIsMinority(res.profile.is_minority ?? false);
        setPreferredLanguage(res.profile.preferred_language || 'English');

        // Extract skills and pincode from special_conditions
        const rawConditions = res.profile.special_conditions ?? [];
        setSpecialConditions(rawConditions);

        const foundPin = rawConditions.find((c) => c.startsWith('pincode:'));
        if (foundPin) {
          setPinCode(foundPin.replace('pincode:', ''));
        }

        const filteredSkills = rawConditions
          .filter((c) => !c.startsWith('pincode:') && !c.startsWith('pref:'))
          .map((c) => c.replace(/^skill:/, '').replace(/^lang:/, ''));

        if (filteredSkills.length > 0) {
          setSkillsList(filteredSkills);
        } else {
          // Default initial set matching reference image if newly created
          setSkillsList(['Tally', 'MS Excel', 'Kannada', 'English']);
        }

        const foundPrefs = rawConditions
          .filter((c) => c.startsWith('pref:'))
          .map((c) => c.replace('pref:', ''));
        if (foundPrefs.length > 0) {
          setTargetJobTypes(foundPrefs);
        }
      }
      if (res.education) {
        setEducations(res.education);
      }

      // Check if user has an active saved resume on file
      const resumeRes = await apiGet<{ resume: UserResumeDocument | null }>('/me/resume');
      if (resumeRes?.resume) {
        setSavedResume(resumeRes.resume);
        if (
          resumeRes.resume.details?.qualifications &&
          resumeRes.resume.details.qualifications.length > 0
        ) {
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

  // Fetch opportunities for "Relevant for you" section
  useEffect(() => {
    async function fetchRelevant() {
      setLoadingOpportunities(true);
      try {
        const queryParams = new URLSearchParams();
        if (domicileStateCode) queryParams.set('state', domicileStateCode);
        else if (stateCode) queryParams.set('state', stateCode);

        const res = await apiGet<OpportunityList>(`/opportunities?${queryParams.toString()}`);
        if (res?.items && res.items.length > 0) {
          setRelevantOpportunities(res.items as ExtendedOpportunityCard[]);
        } else {
          // If state filter yielded few items, fetch all active opportunities
          const allRes = await apiGet<OpportunityList>('/opportunities?limit=6');
          if (allRes?.items) {
            setRelevantOpportunities(allRes.items as ExtendedOpportunityCard[]);
          }
        }
      } catch {
        // graceful fallback
      } finally {
        setLoadingOpportunities(false);
      }
    }

    fetchRelevant();
  }, [stateCode, domicileStateCode]);

  // Calculate live age from DOB
  const liveAge = useMemo(() => calculateAge(dob || null), [dob]);

  // Determine highest qualification
  const highestEdu = useMemo(() => {
    if (educations.length === 0) return null;
    return educations.reduce((best, curr) =>
      (EDUCATION_LEVEL_ORDER[curr.level] ?? 0) > (EDUCATION_LEVEL_ORDER[best.level] ?? 0)
        ? curr
        : best
    );
  }, [educations]);

  // State names
  const stateObj = useMemo(() => INDIAN_STATES.find((s) => s.code === stateCode), [stateCode]);
  const domicileObj = useMemo(
    () => INDIAN_STATES.find((s) => s.code === domicileStateCode),
    [domicileStateCode]
  );

  // User initials for round avatar in left sidebar
  const userInitials = useMemo(() => {
    if (fullName.trim()) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email.slice(0, 2).toUpperCase();
    }
    return 'AK';
  }, [fullName, currentUser]);

  // Dynamic 20-detail profile completeness calculation
  const { filledCount, totalCount, percentage } = useMemo(() => {
    const total = 20;
    let count = 0;

    if (fullName.trim()) count++;
    if (dob) count++;
    if (gender) count++;
    if (currentUser?.email) count++;
    if (currentUser?.phone) count++;
    if (category) count++;
    if (stateCode) count++;
    if (district.trim()) count++;
    if (pinCode.trim()) count++;
    if (domicileStateCode) count++;
    if (highestEdu) count++;
    if (highestEdu?.degree || highestEdu?.stream) count++;
    if (highestEdu?.institution_name || highestEdu?.board_or_university) count++;
    if (highestEdu?.year_of_passing) count++;
    if (highestEdu?.score != null) count++;
    if (examScores.length > 0) count++;
    if (annualIncome.trim()) count++;
    if (targetJobTypes.length > 0) count++;
    if (skillsList.length > 0) count++;
    if (preferredLanguage) count++;

    const pct = Math.round((count / total) * 100);
    return { filledCount: count, totalCount: total, percentage: pct };
  }, [
    fullName,
    dob,
    gender,
    currentUser,
    category,
    stateCode,
    district,
    pinCode,
    domicileStateCode,
    highestEdu,
    examScores,
    annualIncome,
    targetJobTypes,
    skillsList,
    preferredLanguage,
  ]);

  // Section completion checks for navigation sidebar
  const sectionStatus = useMemo(() => {
    return {
      personal: Boolean(fullName && dob && gender && category),
      address: Boolean(stateCode && district),
      education: educations.length > 0,
      examScores: examScores.length > 0,
      preferences: targetJobTypes.length > 0,
      skills: skillsList.length > 0,
    };
  }, [fullName, dob, gender, category, stateCode, district, educations, examScores, targetJobTypes, skillsList]);

  // Public candidate profile handle slug
  const candidateHandle = useMemo(() => {
    if (fullName.trim()) {
      return fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    return 'candidate';
  }, [fullName, currentUser]);

  // Suitable Premier Colleges Matched to Stream & Entrance Scores
  const suitableColleges = useMemo(() => {
    const streamStr = (highestEdu?.stream || highestEdu?.degree || '').toLowerCase();
    const isMed =
      streamStr.includes('med') ||
      streamStr.includes('mbbs') ||
      streamStr.includes('neet') ||
      streamStr.includes('bds') ||
      examScores.some((e) => e.examType === 'NEET_UG' || e.examType === 'NEET_PG');
    const isEng =
      streamStr.includes('tech') ||
      streamStr.includes('eng') ||
      streamStr.includes('cse') ||
      streamStr.includes('gate') ||
      streamStr.includes('jee') ||
      examScores.some((e) => e.examType === 'GATE' || e.examType === 'JEE_MAIN' || e.examType === 'JEE_ADVANCED');

    let baseList = TOP_50_COLLEGES;
    if (isMed && !isEng) {
      baseList = TOP_50_MEDICAL_COLLEGES;
    } else if (isEng && !isMed) {
      baseList = TOP_50_ENGINEERING_COLLEGES;
    }

    if (collegeFilter === 'engineering') {
      baseList = TOP_50_ENGINEERING_COLLEGES;
    } else if (collegeFilter === 'medical') {
      baseList = TOP_50_MEDICAL_COLLEGES;
    } else if (collegeFilter === 'state') {
      const userState = domicileStateCode || stateCode;
      if (userState) {
        const inState = baseList.filter((c) => c.state_code === userState);
        if (inState.length > 0) return inState;
      }
    }

    const userState = domicileStateCode || stateCode;
    return [...baseList]
      .sort((a, b) => {
        const aState = a.state_code === userState ? 1 : 0;
        const bState = b.state_code === userState ? 1 : 0;
        if (aState !== bState) return bState - aState;
        const aRank = a.accreditation?.nirf_rank || 999;
        const bRank = b.accreditation?.nirf_rank || 999;
        return aRank - bRank;
      })
      .slice(0, 8);
  }, [highestEdu, examScores, collegeFilter, domicileStateCode, stateCode]);

  // Scroll into view helper
  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Handle saving personal details
  async function handleSavePersonal(e?: React.FormEvent) {
    if (e) e.preventDefault();
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
      is_pwbd: isPwbd,
      pwbd_type: isPwbd ? pwbdType.trim() || undefined : undefined,
      is_ex_serviceman: isExServiceman,
      is_minority: isMinority,
    };

    const res = await apiPut<UserProfile>('/me/profile', payload);
    setSaving(false);

    if (res.error || !res.data) {
      setSaveError(res.error || 'Failed to update personal details.');
    } else {
      setProfile(res.data);
      setEditingPersonal(false);
      setSaveSuccess('Personal details updated successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  }

  // Handle saving address & domicile
  async function handleSaveAddress(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);
    setSaving(true);

    // Maintain pincode in special_conditions
    const updatedConditions = specialConditions.filter((c) => !c.startsWith('pincode:'));
    if (pinCode.trim()) {
      updatedConditions.push(`pincode:${pinCode.trim()}`);
    }

    const payload = {
      state_code: stateCode || undefined,
      district: district.trim() || undefined,
      domicile_state_code: domicileStateCode || undefined,
      special_conditions: updatedConditions,
    };

    const res = await apiPut<UserProfile>('/me/profile', payload);
    setSaving(false);

    if (res.error || !res.data) {
      setSaveError(res.error || 'Failed to update address & domicile.');
    } else {
      setProfile(res.data);
      setSpecialConditions(updatedConditions);
      setEditingAddress(false);
      setSaveSuccess('Address & domicile details updated successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  }

  // Handle saving preferences
  async function handleSavePreferences(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);
    setSaving(true);

    const updatedConditions = specialConditions.filter((c) => !c.startsWith('pref:'));
    targetJobTypes.forEach((t) => updatedConditions.push(`pref:${t}`));

    const payload = {
      preferred_language: preferredLanguage,
      special_conditions: updatedConditions,
    };

    const res = await apiPut<UserProfile>('/me/profile', payload);
    setSaving(false);

    if (res.error || !res.data) {
      setSaveError(res.error || 'Failed to update preferences.');
    } else {
      setProfile(res.data);
      setSpecialConditions(updatedConditions);
      setEditingPreferences(false);
      setSaveSuccess('Preferences updated successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  }

  // Add skill or language tag
  async function handleAddSkill(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const item = newSkillInput.trim();
    if (!item) return;
    if (skillsList.includes(item)) {
      setNewSkillInput('');
      return;
    }

    const nextSkills = [...skillsList, item];
    setSkillsList(nextSkills);
    setNewSkillInput('');

    // Persist to profile special_conditions
    const otherConditions = specialConditions.filter(
      (c) => c.startsWith('pincode:') || c.startsWith('pref:')
    );
    const updated = [...otherConditions, ...nextSkills.map((s) => `skill:${s}`)];
    setSpecialConditions(updated);

    await apiPut<UserProfile>('/me/profile', { special_conditions: updated });
  }

  // Remove skill or language tag
  async function handleRemoveSkill(skillToRemove: string) {
    const nextSkills = skillsList.filter((s) => s !== skillToRemove);
    setSkillsList(nextSkills);

    const otherConditions = specialConditions.filter(
      (c) => c.startsWith('pincode:') || c.startsWith('pref:')
    );
    const updated = [...otherConditions, ...nextSkills.map((s) => `skill:${s}`)];
    setSpecialConditions(updated);

    await apiPut<UserProfile>('/me/profile', { special_conditions: updated });
  }

  // Pixel avatar selector
  async function handleSelectAvatar(newAvatarId: string) {
    setAvatarUrl(newAvatarId);
    setShowAvatarModal(false);

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

  // Education handlers
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

  // Resume handlers
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const fileBase64 = await convertFileToBase64(file);
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
      setSaveSuccess(
        `Resume securely saved! Parsed ${parsed.length} qualification(s). Click Import All to add them to your profile.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process resume file';
      setSaveError(`Resume upload failed: ${msg}.`);
    } finally {
      setIsExtracting(false);
      if (e.target) e.target.value = '';
    }
  }

  async function handleDownloadResume() {
    if (!savedResume) return;
    try {
      const res = await fetch(`${API_URL}/me/resume/download`, {
        credentials: 'include',
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
    if (!confirm('Are you sure you want to remove your saved resume?')) return;
    setIsExtracting(true);
    try {
      const res = await apiDelete<{ success: boolean }>('/me/resume');
      if (res.error) throw new Error(res.error);
      setSavedResume(null);
      setExtractedEducations([]);
      setResumeText('');
      setSaveSuccess('Resume removed from profile.');
    } catch {
      setSaveError('Failed to remove saved resume.');
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleImportExtracted() {
    if (extractedEducations.length === 0) return;
    setIsImporting(true);
    setSaveError(null);

    let count = 0;
    const added: UserEducation[] = [];

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
        count++;
        added.push(res.data);
      }
    }

    setIsImporting(false);
    setEducations((prev) => [...prev, ...added]);
    setExtractedEducations([]);
    setSaveSuccess(`Imported ${count} qualification(s) into your profile!`);
    setTimeout(() => setSaveSuccess(null), 3000);
  }

  async function handleLogout() {
    await apiPost('/auth/logout');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      window.dispatchEvent(new Event('auth-changed'));
    }
    router.push('/login');
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
          <div className="mx-auto size-20 rounded-full bg-blue-50 text-[#0e7bf4] flex items-center justify-center">
            <User className="size-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-[#0e7bf4] inline-block">
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
              className="h-11 px-6 rounded-xl bg-[#0e7bf4] hover:bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
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

  // Highest qualification subtitle for sidebar
  const subtitleLine = [
    highestEdu?.degree || (highestEdu ? EDUCATION_LEVEL_LABELS[highestEdu.level] : 'Graduate'),
    district ? `${district}, ${stateObj?.name || stateCode || 'India'}` : (stateObj?.name || 'India'),
  ].filter(Boolean).join(' · ');

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Global Alerts */}
      {saveSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-semibold text-rose-800 flex items-center gap-3 shadow-xs animate-in fade-in" role="alert">
          <Info className="size-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 2-Panel Top Layout (Matching Reference Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
        {/* LEFT COLUMN: User Summary & Navigation Checklist */}
        <div className="lg:sticky lg:top-24 space-y-5">
          {/* Card 1: User Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            {/* Avatar Circle with Initials or Pixel Avatar */}
            <div
              onClick={() => setShowAvatarModal(true)}
              className="relative group cursor-pointer inline-block"
              title="Click to change avatar"
            >
              {avatarUrl && avatarUrl !== 'pixel-scholar' ? (
                <div className="size-16 rounded-full overflow-hidden border-2 border-blue-200 shadow-xs flex items-center justify-center bg-blue-50">
                  <PixelAvatar avatarId={avatarUrl} size={56} />
                </div>
              ) : (
                <div className="size-16 rounded-full bg-blue-100 text-[#0e7bf4] font-bold text-xl flex items-center justify-center border border-blue-200/60 shadow-xs">
                  {userInitials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-[#0e7bf4] text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <Wand2 className="size-3" />
              </div>
            </div>

            {/* User Name */}
            <h2 className="text-xl font-bold text-slate-900 mt-4 tracking-tight">
              {fullName || currentUser?.email?.split('@')[0] || 'Arvind Kumar'}
            </h2>

            {/* Subtitle (e.g. B.Com · Mysuru, Karnataka) */}
            <p className="text-xs text-slate-500 font-medium mt-1">
              {subtitleLine}
            </p>

            {/* Profile Completion Bar */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600">Profile completion</span>
                <span className="text-[#0e7bf4] font-bold">{percentage}%</span>
              </div>

              {/* Progress track */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mt-2.5">
                <div
                  className="h-full bg-[#0e7bf4] rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                {filledCount} of {totalCount} details added
              </p>

              {/* Shareable Public Candidate Card CTA */}
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Candidate Registry
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    Verified
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCandidateCardModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#dec9a5] bg-[#F4E8D1] hover:bg-[#ebd8b7] text-xs font-bold text-[#76562d] transition-colors shadow-xs"
                >
                  <UserCheck className="size-4 text-[#76562d]" />
                  <span>Shareable Candidate Card</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Section Navigation / Checklist Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-1">
            {[
              { id: 'personal-details', label: 'Personal details', completed: sectionStatus.personal },
              { id: 'address-domicile', label: 'Address & domicile', completed: sectionStatus.address },
              { id: 'education', label: 'Education', completed: sectionStatus.education },
              { id: 'exam-scores', label: 'Competitive exam scores', completed: sectionStatus.examScores },
              { id: 'preferences', label: 'Preferences', completed: sectionStatus.preferences },
              { id: 'skills', label: 'Skills', completed: sectionStatus.skills },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className="w-full flex items-center gap-3 py-2.5 px-2 rounded-xl text-left hover:bg-slate-50 transition-colors group"
              >
                {sec.completed ? (
                  <div className="size-4 rounded-full border-2 border-[#0e7bf4] flex items-center justify-center text-[#0e7bf4]">
                    <Check className="size-2.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="size-4 rounded-full border-2 border-slate-300 group-hover:border-slate-400" />
                )}
                <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  {sec.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Stack of Clean Modular Cards */}
        <div className="space-y-6">
          {/* CARD 1: Personal Details */}
          <div
            id="personal-details"
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Personal details</h3>
              {editingPersonal ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPersonal(false)}
                    className="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSavePersonal()}
                    className="px-3.5 py-1 text-xs font-semibold text-white bg-[#0e7bf4] hover:bg-blue-600 rounded-lg shadow-xs transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingPersonal(true)}
                  className="px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Pencil className="size-3 text-slate-400" /> Edit
                </button>
              )}
            </div>

            {/* View Mode Grid */}
            {!editingPersonal ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 mt-6">
                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">Full name</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {fullName || <span className="text-slate-400 font-normal italic">Not added</span>}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">Date of birth</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {dob ? (
                      <>
                        {dob}
                        {liveAge && (
                          <span className="text-xs text-slate-500 font-normal ml-2">
                            ({liveAge.years} yrs)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400 font-normal italic">Not added</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">Gender</span>
                  <span className="text-sm font-semibold text-slate-900 capitalize">
                    {gender ? (
                      gender === 'prefer_not_to_say' ? 'Prefer not to say' : gender
                    ) : (
                      <span className="text-slate-400 font-normal italic">Not added</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">Email</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {currentUser?.email || (
                      <span className="text-slate-400 font-normal italic">Not added</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">Mobile number</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {currentUser?.phone || (
                      <span className="text-slate-400 font-normal italic">Not added</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">Category</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {category || 'GEN'}
                  </span>
                </div>

                {/* Affirmative details if populated */}
                {annualIncome && (
                  <div>
                    <span className="text-xs font-normal text-slate-500 block mb-1">Annual family income</span>
                    <span className="text-sm font-semibold text-slate-900">
                      ₹{parseInt(annualIncome, 10).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {isPwbd && (
                  <div>
                    <span className="text-xs font-normal text-slate-500 block mb-1">PwBD Status</span>
                    <span className="text-sm font-semibold text-slate-900">
                      Yes {pwbdType ? `(${pwbdType})` : ''}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Edit Mode Form */
              <form onSubmit={handleSavePersonal} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Arvind Kumar"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as UserGender)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                    >
                      <option value="">-- Select Gender --</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="transgender">Transgender</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Social Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SocialCategory)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                    >
                      <option value="">-- Select Category --</option>
                      <option value="GEN">General (GEN)</option>
                      <option value="OBC">OBC (Other Backward Classes)</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                      <option value="EWS">EWS (Economically Weaker Section)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Annual Family Income (₹)</label>
                    <input
                      type="number"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      placeholder="e.g. 250000"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">PwBD / Disability</label>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPwbd}
                          onChange={(e) => setIsPwbd(e.target.checked)}
                          className="rounded text-[#0e7bf4] focus:ring-0"
                        />
                        Person with Benchmark Disability
                      </label>
                    </div>
                    {isPwbd && (
                      <input
                        type="text"
                        value={pwbdType}
                        onChange={(e) => setPwbdType(e.target.value)}
                        placeholder="Disability category / type"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isExServiceman}
                      onChange={(e) => setIsExServiceman(e.target.checked)}
                      className="rounded text-[#0e7bf4] focus:ring-0"
                    />
                    Ex-Serviceman Quota
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isMinority}
                      onChange={(e) => setIsMinority(e.target.checked)}
                      className="rounded text-[#0e7bf4] focus:ring-0"
                    />
                    Minority Community
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPersonal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0e7bf4] hover:bg-blue-600 rounded-xl shadow-xs transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Personal Details'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* CARD 2: Address & Domicile */}
          <div
            id="address-domicile"
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Address & domicile</h3>
              {editingAddress ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAddress(false)}
                    className="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSaveAddress()}
                    className="px-3.5 py-1 text-xs font-semibold text-white bg-[#0e7bf4] hover:bg-blue-600 rounded-lg shadow-xs transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingAddress(true)}
                  className="px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Pencil className="size-3 text-slate-400" /> Edit
                </button>
              )}
            </div>

            {/* View Mode Grid */}
            {!editingAddress ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 mt-6">
                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">State</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {stateObj?.name || (
                      <span className="text-slate-400 font-normal italic">Not added</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">District</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {district || (
                      <span className="text-slate-400 font-normal italic">Not added</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">PIN code</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {pinCode || (
                      <span className="text-slate-400 font-normal italic">Not added</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">Domicile certificate</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {domicileStateCode ? (
                      <>Yes ({domicileObj?.name || domicileStateCode})</>
                    ) : (
                      <span className="text-slate-400 font-normal italic">Not added</span>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              /* Edit Mode Form */
              <form onSubmit={handleSaveAddress} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Home State</label>
                    <select
                      value={stateCode}
                      onChange={(e) => setStateCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
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
                    <label className="block text-xs font-medium text-slate-600 mb-1">District</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Mysuru"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="e.g. 570001"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      State of Domicile (State Quota)
                    </label>
                    <select
                      value={domicileStateCode}
                      onChange={(e) => setDomicileStateCode(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
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

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingAddress(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0e7bf4] hover:bg-blue-600 rounded-xl shadow-xs transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Address & Domicile'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* CARD 3: Education */}
          <div
            id="education"
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm transition-all space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Education</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openAddEducation}
                  className="px-3 py-1 text-xs font-semibold text-[#0e7bf4] bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Plus className="size-3" /> Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (highestEdu) openEditEducation(highestEdu);
                    else openAddEducation();
                  }}
                  className="px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Pencil className="size-3 text-slate-400" /> Edit
                </button>
              </div>
            </div>

            {/* Primary/Highest Qualification Key-Value View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
              <div>
                <span className="text-xs font-normal text-slate-500 block mb-1">Highest qualification</span>
                <span className="text-sm font-semibold text-slate-900">
                  {highestEdu ? (
                    EDUCATION_LEVEL_LABELS[highestEdu.level] || highestEdu.level
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not added</span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-xs font-normal text-slate-500 block mb-1">Stream / degree</span>
                <span className="text-sm font-semibold text-slate-900">
                  {highestEdu?.degree || highestEdu?.stream || (
                    <span className="text-slate-400 font-normal italic">Not added</span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-xs font-normal text-slate-500 block mb-1">Institution</span>
                <span className="text-sm font-semibold text-slate-900">
                  {highestEdu?.institution_name || highestEdu?.board_or_university || (
                    <span className="text-slate-400 font-normal italic">Not added</span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-xs font-normal text-slate-500 block mb-1">Year of passing</span>
                <span className="text-sm font-semibold text-slate-900">
                  {highestEdu?.year_of_passing || (
                    <span className="text-slate-400 font-normal italic">Not added</span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-xs font-normal text-slate-500 block mb-1">Percentage / CGPA</span>
                <span className="text-sm font-semibold text-slate-900">
                  {highestEdu?.score != null ? (
                    `${highestEdu.score} ${highestEdu.score_type === 'percentage' ? '%' : 'CGPA'}`
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not added</span>
                  )}
                </span>
              </div>
            </div>

            {/* If user has multiple saved qualifications */}
            {educations.length > 1 && (
              <div className="pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-3">
                  All Saved Qualifications ({educations.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {educations.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-900">
                            {item.degree || EDUCATION_LEVEL_LABELS[item.level]}
                          </span>
                          <span className="text-[10px] font-semibold text-[#0e7bf4] px-2 py-0.5 rounded-full bg-blue-50">
                            {item.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.institution_name || item.board_or_university}
                          {item.year_of_passing ? ` · ${item.year_of_passing}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditEducation(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEducation(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Resume Upload & Parsing Drawer */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-[#0e7bf4]" />
                  <span className="text-xs font-bold text-slate-800">
                    AI Resume Auto-Detection
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResumeSection(!showResumeSection)}
                  className="text-xs font-semibold text-[#0e7bf4] hover:underline flex items-center gap-1"
                >
                  <span>{showResumeSection ? 'Hide' : savedResume ? 'View Saved Resume' : 'Upload Resume'}</span>
                  <ChevronDown className={`size-3 transition-transform ${showResumeSection ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {showResumeSection && (
                <div className="mt-4 p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-4">
                  {savedResume ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <FileCheck2 className="size-5 text-[#0e7bf4]" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{savedResume.file_name || 'Resume.pdf'}</p>
                          <p className="text-[11px] text-slate-500">
                            {savedResume.size_bytes ? `${Math.round(savedResume.size_bytes / 1024)} KB · ` : ''}
                            Saved on profile
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.txt,.docx,image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={handleDownloadResume}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
                          <Download className="size-3" /> Download
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isExtracting}
                          className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                        >
                          <RefreshCw className={`size-3 ${isExtracting ? 'animate-spin' : ''}`} /> Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteResume}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.docx,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isExtracting}
                        className="w-full py-4 rounded-xl border border-dashed border-blue-200 hover:border-blue-400 bg-white text-center flex flex-col items-center justify-center gap-1 text-xs text-slate-600 transition-colors"
                      >
                        <UploadCloud className="size-5 text-[#0e7bf4]" />
                        <span className="font-semibold text-slate-800">
                          {isExtracting ? 'Extracting qualifications...' : 'Click to upload your resume (.pdf / .txt)'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Automatically detect your degrees, colleges, passing years, and grades
                        </span>
                      </button>
                    </div>
                  )}

                  {extractedEducations.length > 0 && (
                    <div className="pt-3 border-t border-blue-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">
                        {extractedEducations.length} qualification(s) detected
                      </span>
                      <button
                        type="button"
                        disabled={isImporting}
                        onClick={handleImportExtracted}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0e7bf4] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-xs"
                      >
                        {isImporting ? 'Importing...' : 'Import to Profile'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CARD: Competitive Exam Scores & Roll Numbers */}
          <CompetitiveExamScoresCard onScoresChange={setExamScores} />

          {/* CARD 4: Preferences */}
          <div
            id="preferences"
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Preferences</h3>
              {editingPreferences ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPreferences(false)}
                    className="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSavePreferences()}
                    className="px-3.5 py-1 text-xs font-semibold text-white bg-[#0e7bf4] hover:bg-blue-600 rounded-lg shadow-xs transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingPreferences(true)}
                  className="px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Pencil className="size-3 text-slate-400" /> Edit
                </button>
              )}
            </div>

            {/* View Mode Grid */}
            {!editingPreferences ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 mt-6">
                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">Target opportunities</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {targetJobTypes.map((type) => (
                      <span
                        key={type}
                        className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">Target states</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {stateObj?.name ? `${stateObj.name}, All India` : 'All India (Central)'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-normal text-slate-500 block mb-1">Preferred language</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {preferredLanguage}
                  </span>
                </div>
              </div>
            ) : (
              /* Edit Mode Form */
              <form onSubmit={handleSavePreferences} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Target Opportunity Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Government Exam', 'Government Job', 'Scholarship', 'Admission'].map((type) => {
                      const selected = targetJobTypes.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setTargetJobTypes(targetJobTypes.filter((t) => t !== type));
                            } else {
                              setTargetJobTypes([...targetJobTypes, type]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            selected
                              ? 'bg-blue-50 text-[#0e7bf4] border-blue-200'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Preferred Language
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full max-w-xs rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">हिंदी (Hindi)</option>
                    <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                    <option value="Telugu">తెలుగు (Telugu)</option>
                    <option value="Tamil">தமிழ் (Tamil)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPreferences(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0e7bf4] hover:bg-blue-600 rounded-xl shadow-xs transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* CARD 5: Skills & Languages (Matching Image 2 Reference) */}
          <div
            id="skills"
            className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm transition-all"
          >
            <h3 className="text-lg font-bold text-slate-900">Skills & languages</h3>

            {/* Pill Tags with Delete Icons */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {skillsList.map((skill) => (
                <div
                  key={skill}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-2 hover:bg-slate-200/80 transition-colors"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                    title={`Remove ${skill}`}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Input Bar (Matching Image 2 Reference) */}
            <form onSubmit={handleAddSkill} className="mt-5 flex items-center gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="Add a skill or language"
                className="flex-1 h-10 px-4 rounded-xl border border-slate-200/90 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e7bf4] focus:ring-1 focus:ring-[#0e7bf4]"
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
              >
                <Plus className="size-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Account Settings Mini Card */}
          <div className="p-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Signed in as <strong>{currentUser?.email || currentUser?.phone}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-semibold text-slate-600 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <LogOut className="size-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Opportunities & Institutions Dual Grid */}
      <div className="pt-8 border-t border-slate-200/70 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              MATCHED TO YOUR PROFILE · {highestEdu?.degree || (highestEdu ? highestEdu.level.toUpperCase() : "BACHELOR'S")} · {domicileObj?.name.toUpperCase() || stateObj?.name.toUpperCase() || 'INDIA'}
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              Opportunities & institutions for you
            </h2>
          </div>

          {/* Dual Tabs Pill Selector */}
          <div className="inline-flex rounded-xl border border-slate-200/90 bg-slate-100/80 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setBottomTab('jobs')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                bottomTab === 'jobs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="size-3.5" />
              <span>Government Jobs</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-700 font-semibold">
                {relevantOpportunities.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBottomTab('colleges')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                bottomTab === 'colleges'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="size-3.5" />
              <span>Suitable Colleges</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#F4E8D1] text-[10px] text-[#76562d] font-bold">
                {suitableColleges.length}
              </span>
            </button>
          </div>
        </div>

        {/* TAB 1: Government Jobs & Opportunities */}
        {bottomTab === 'jobs' && (
          <div className="space-y-4">
            <div className="space-y-3.5">
              {loadingOpportunities ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
                  ))}
                </div>
              ) : relevantOpportunities.length > 0 ? (
                relevantOpportunities.map((item) => (
                  <HorizontalOpportunityCard key={item.slug} item={item} />
                ))
              ) : (
                <div className="p-8 rounded-2xl border border-slate-200/80 bg-white text-center text-xs text-slate-500">
                  No matching active opportunities found right now. Check back soon for fresh notifications!
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0e7bf4] hover:underline"
              >
                <span>Explore all active government notifications</span>
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* TAB 2: Suitable Colleges & Cutoffs */}
        {bottomTab === 'colleges' && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2 pb-1">
              {[
                { id: 'all', label: `All Recommendations (${suitableColleges.length})` },
                { id: 'engineering', label: 'Top Engineering' },
                { id: 'medical', label: 'Top Medical' },
                ...(stateObj?.name || domicileObj?.name
                  ? [{ id: 'state', label: `In ${domicileObj?.name || stateObj?.name}` }]
                  : []),
              ].map((flt) => (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => setCollegeFilter(flt.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    collegeFilter === flt.id
                      ? 'bg-[#082046] text-[#F4E8D1] border-[#082046]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {flt.label}
                </button>
              ))}
            </div>

            {/* College Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suitableColleges.map((col) => {
                const isMed = col.accreditation?.nirf_category === 'Medical' || col.name.toLowerCase().includes('medical');
                const rankDisplay = col.accreditation?.nirf_rank_text || (col.accreditation?.nirf_rank ? `NIRF Rank #${col.accreditation.nirf_rank}` : null);
                const acceptedExam = col.accreditation?.accepted_exams?.[0] || (isMed ? 'NEET-UG' : 'JEE Advanced / GATE');
                const stipendOrSalary = isMed
                  ? (col.placement_stats?.avg_package || (col.fees_text ? `Fees: ${col.fees_text}` : '₹1.1L/mo Stipend'))
                  : (col.placement_stats?.avg_package ? `${col.placement_stats.avg_package} Avg` : null);

                return (
                  <div
                    key={col.id}
                    className="p-5 rounded-md border border-[#dec9a5] bg-white shadow-xs hover:border-[#082046]/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {rankDisplay && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#dec9a5] bg-[#F4E8D1] text-[10px] font-bold text-[#76562d]">
                            <Award className="size-3 text-[#76562d]" /> {rankDisplay}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] font-medium text-slate-600">
                          {col.type || 'Institute'}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="size-3 text-[#76562d] shrink-0" />
                          {[col.city, col.state_code].filter(Boolean).join(', ')}
                        </span>
                      </div>

                      <Link href={`/career/colleges/${col.slug}`}>
                        <h3 className="text-base font-bold text-[#082046] hover:text-[#0e7bf4] hover:underline line-clamp-1 transition-colors">
                          {col.name}
                        </h3>
                      </Link>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {acceptedExam && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-800">
                            <GraduationCap className="size-3 text-[#0e7bf4]" /> {acceptedExam}
                          </span>
                        )}
                        {stipendOrSalary && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#dec9a5] bg-[#F4E8D1] text-[11px] font-bold text-[#76562d]">
                            <Banknote className="size-3 text-[#76562d]" /> {stipendOrSalary}
                          </span>
                        )}
                      </div>

                      {col.accreditation?.cutoff_details && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 pt-1 border-t border-slate-100">
                          Benchmark: <span className="font-semibold text-slate-700">{col.accreditation.cutoff_details}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#dec9a5]/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <ShareModal
                          variant="icon"
                          title={col.name}
                          category="College"
                          url={`/career/colleges/${col.slug}`}
                        />
                        <SaveButton
                          itemType="institution"
                          slug={col.slug}
                          title={col.name}
                        />
                        <Link
                          href={`/career/colleges/compare?slugs=${col.slug}`}
                          className="px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          Compare
                        </Link>
                      </div>

                      <Link
                        href={`/career/colleges/${col.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#082046] hover:underline"
                      >
                        <span>View Details</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href="/career/colleges"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0e7bf4] hover:underline"
              >
                <span>Explore all 100+ premier colleges & cutoff trends</span>
                <ExternalLink className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Disclaimer Footnote (Matching Image 2 Reference) */}
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-3">
          <ShieldCheck className="size-4 text-slate-400 shrink-0" />
          <p>
            ApplyFields is an independent platform, not a government department. Always apply through the official route shown on each listing.
          </p>
        </div>
      </div>

      {/* MODAL: 10 Pixel Avatars Selector */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Select Your Pixel Character</h3>
                <p className="text-xs text-slate-500">
                  Pick one of 10 retro pixel characters for your citizen profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
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
                  className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center relative ${
                    avatarUrl === item.id
                      ? 'border-[#0e7bf4] bg-blue-50/60 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <PixelAvatar avatarId={item.id} size={56} className="mb-2" />
                  <span className="text-xs font-bold text-slate-900 leading-tight block">{item.name}</span>
                  <span className="text-[10px] text-slate-500 truncate w-full mt-0.5">{item.title}</span>
                  {avatarUrl === item.id && (
                    <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-[#0e7bf4] text-white">
                      <Check className="size-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Education */}
      {showEduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {editingEduId ? 'Edit Qualification' : 'Add Qualification'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEduModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEducation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Qualification Level
                </label>
                <select
                  value={eduLevel}
                  onChange={(e) => setEduLevel(e.target.value as EducationLevel)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
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
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Degree / Exam Name
                  </label>
                  <input
                    type="text"
                    value={eduDegree}
                    onChange={(e) => setEduDegree(e.target.value)}
                    placeholder="e.g. B.Com / B.Tech"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Stream / Branch
                  </label>
                  <input
                    type="text"
                    value={eduStream}
                    onChange={(e) => setEduStream(e.target.value)}
                    placeholder="e.g. Commerce / CSE"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Board or University
                </label>
                <input
                  type="text"
                  value={eduBoard}
                  onChange={(e) => setEduBoard(e.target.value)}
                  placeholder="e.g. University of Mysore"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0e7bf4]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  College or Institution
                </label>
                <input
                  type="text"
                  value={eduInstitution}
                  onChange={(e) => setEduInstitution(e.target.value)}
                  placeholder="e.g. Maharaja College"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0e7bf4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                  <div className="flex rounded-xl border border-slate-200 p-0.5">
                    <button
                      type="button"
                      onClick={() => setEduStatus('completed')}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                        eduStatus === 'completed'
                          ? 'bg-slate-100 text-slate-900 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => setEduStatus('pursuing')}
                      className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${
                        eduStatus === 'pursuing'
                          ? 'bg-slate-100 text-slate-900 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Pursuing
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Year of Passing
                  </label>
                  <input
                    type="number"
                    min="1950"
                    max="2100"
                    value={eduYear}
                    onChange={(e) => setEduYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Score</label>
                  <input
                    type="number"
                    step="0.01"
                    value={eduScore}
                    onChange={(e) => setEduScore(e.target.value)}
                    placeholder="e.g. 75 or 8.2"
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Score Type</label>
                  <select
                    value={eduScoreType}
                    onChange={(e) => setEduScoreType(e.target.value as ScoreType)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="cgpa">CGPA (Out of 10)</option>
                    <option value="grade">Grade</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEduModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#0e7bf4] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {saving ? 'Saving...' : editingEduId ? 'Update' : 'Add Qualification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shareable Candidate Portfolio Modal */}
      <CandidateCardModal
        isOpen={showCandidateCardModal}
        onClose={() => setShowCandidateCardModal(false)}
        candidate={{
          handle: candidateHandle,
          fullName: fullName || currentUser?.email?.split('@')[0] || 'Candidate',
          avatarUrl,
          stateName: stateObj?.name || stateCode || undefined,
          district: district || undefined,
          domicileState: domicileObj?.name || domicileStateCode || undefined,
          category: category || undefined,
          highestDegree: highestEdu?.degree || (highestEdu ? EDUCATION_LEVEL_LABELS[highestEdu.level] : undefined),
          stream: highestEdu?.stream || undefined,
          institution: highestEdu?.institution_name || highestEdu?.board_or_university || undefined,
          yearOfPassing: highestEdu?.year_of_passing ?? undefined,
          score: highestEdu?.score != null ? highestEdu.score : undefined,
          scoreType: highestEdu?.score_type ?? undefined,
          skills: skillsList,
          targetJobTypes,
          examScores,
        }}
      />
    </div>
  );
}
