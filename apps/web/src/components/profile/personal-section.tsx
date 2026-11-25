'use client';

import React, { useState, useMemo } from 'react';
import {
  User,
  Calendar,
  Layers,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Save,
  X,
  Mail,
  Phone,
  KeyRound,
  } from 'lucide-react';
import type {
  UserProfile,
  UserSummary,
  UserGender,
  SocialCategory,
} from '@applyfields/types';
import { apiPut, apiPost } from '@/lib/api';
import { showAppToast } from '@/components/toast-notification-provider';
import { useLanguage } from '@/lib/i18n/language-context';
import { Spinner } from '@applyfields/ui';

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

interface PersonalSectionProps {
  profile: UserProfile | null;
  user: UserSummary | null;
  onProfileUpdate: (updated: UserProfile) => void;
  onUserUpdate?: (updated: UserSummary) => void;
}

export function PersonalSection({
  profile,
  user,
  onProfileUpdate,
  onUserUpdate,
}: PersonalSectionProps) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedJustNow, setSavedJustNow] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [dob, setDob] = useState(profile?.date_of_birth || '');
  const [gender, setGender] = useState<UserGender | ''>(profile?.gender || '');
  const [category, setCategory] = useState<SocialCategory | ''>(profile?.category || '');
  const [annualIncome, setAnnualIncome] = useState<string>(
    profile?.annual_family_income != null ? profile.annual_family_income.toString() : ''
  );
  const [isPwbd, setIsPwbd] = useState<boolean>(profile?.is_pwbd || false);
  const [pwbdType, setPwbdType] = useState<string>(profile?.pwbd_type || '');
  const [isExServiceman, setIsExServiceman] = useState<boolean>(profile?.is_ex_serviceman || false);
  const [isMinority, setIsMinority] = useState<boolean>(profile?.is_minority || false);

  // Contact Change Flow states
  const [contactModalType, setContactModalType] = useState<'email' | 'phone' | null>(null);
  const [contactStep, setContactStep] = useState<'input' | 'verify'>('input');
  const [newContactValue, setNewContactValue] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const liveAge = useMemo(() => calculateAge(dob || null), [dob]);

  const handleStartEdit = () => {
    setFullName(profile?.full_name || '');
    setDob(profile?.date_of_birth || '');
    setGender(profile?.gender || '');
    setCategory(profile?.category || '');
    setAnnualIncome(profile?.annual_family_income != null ? profile.annual_family_income.toString() : '');
    setIsPwbd(profile?.is_pwbd || false);
    setPwbdType(profile?.pwbd_type || '');
    setIsExServiceman(profile?.is_ex_serviceman || false);
    setIsMinority(profile?.is_minority || false);
    setError(null);
    setFieldErrors({});
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setError(null);
    setFieldErrors({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required as per matriculation records.';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Please enter your complete legal name.';
    }

    if (!dob) {
      errors.dob = 'Date of birth is required for age eligibility cutoff calculation.';
    }

    if (!gender) {
      errors.gender = 'Please select your gender.';
    }

    if (!category) {
      errors.category = 'Social category is required for reservation quota matching.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setError(null);
    setFieldErrors({});

    const payload = {
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
      setError(res.error || "We couldn't save your personal details right now. Please check your connection and try again.");
    } else {
      onProfileUpdate(res.data);
      setEditing(false);
      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 4500);
      showAppToast({ message: 'Personal details updated successfully!', type: 'success' });
    }
  };

  // Change Email / Phone Flow
  const handleOpenContactModal = (type: 'email' | 'phone') => {
    setContactModalType(type);
    setContactStep('input');
    setNewContactValue('');
    setOtpCode('');
    setContactError(null);
  };

  const handleCloseContactModal = () => {
    setContactModalType(null);
    setContactError(null);
  };

  const handleStartContactChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactValue.trim() || !contactModalType) return;

    setContactLoading(true);
    setContactError(null);

    try {
      const res = await apiPost<{ success: boolean; message: string }>('/me/change-contact/start', {
        type: contactModalType,
        value: newContactValue.trim(),
      });

      if (res.error) {
        setContactError(res.error);
      } else {
        setContactStep('verify');
        showAppToast(res.data?.message || 'Verification code sent.');
      }
    } catch {
      setContactError('Failed to initiate verification request.');
    } finally {
      setContactLoading(false);
    }
  };

  const handleVerifyContactChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !contactModalType) return;

    setContactLoading(true);
    setContactError(null);

    try {
      const res = await apiPost<{ success: boolean; user: UserSummary }>('/me/change-contact/verify', {
        type: contactModalType,
        value: newContactValue.trim(),
        code: otpCode.trim(),
      });

      if (res.error || !res.data?.user) {
        setContactError(res.error || 'Invalid or expired code.');
      } else {
        if (onUserUpdate) onUserUpdate(res.data.user);
        handleCloseContactModal();
        showAppToast(`${contactModalType === 'email' ? 'Email' : 'Phone'} updated and verified successfully!`);
      }
    } catch {
      setContactError('Verification failed. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <section id="personal-section" className="rounded-3xl border border-[#c4d2e3] bg-white p-6 sm:p-7 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <User className="size-5 text-[#0E7BF4]" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Personal & Demographic Details
            </h3>
            {savedJustNow && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-in fade-in">
                <CheckCircle2 className="size-3.5" />
                Saved
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Crucial for reservation eligibility, age limit relaxations, and quota certificates.
          </p>
        </div>

        <div>
          {!editing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center min-h-[44px] gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0E7BF4] focus-visible:outline-none transition-colors shadow-2xs"
            >
              <Pencil className="size-3.5" />
              <span>Edit Details</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex items-center min-h-[44px] gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#0E7BF4] focus-visible:outline-none transition-colors"
            >
              <X className="size-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* VIEW MODE */}
      {!editing ? (
        <div className="mt-5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Full Name
              </span>
              <span className="text-sm font-bold text-slate-900 block">
                {profile?.full_name || <span className="text-slate-400 italic">Not set</span>}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Date of Birth
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {profile?.date_of_birth || <span className="text-slate-400 italic">Not set</span>}
                </span>
                {liveAge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100/80 text-[#0E7BF4]">
                    {liveAge.years}y {liveAge.months}m
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Gender
              </span>
              <span className="text-sm font-bold text-slate-900 capitalize block">
                {profile?.gender ? profile.gender.replace(/_/g, ' ') : <span className="text-slate-400 italic">Not set</span>}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Social Category
              </span>
              <span className="text-sm font-bold text-slate-900 uppercase block">
                {profile?.category ? profile.category.replace(/_/g, ' ') : <span className="text-slate-400 italic">Not set</span>}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Annual Family Income
              </span>
              <span className="text-sm font-bold text-slate-900 block">
                {profile?.annual_family_income != null
                  ? `₹ ${profile.annual_family_income.toLocaleString('en-IN')}`
                  : <span className="text-slate-400 italic">Not set</span>}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F8FBFF] border border-[#c4d2e3]/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Special Reservations
              </span>
              <div className="flex flex-wrap gap-1 text-[11px] font-semibold text-slate-700">
                {profile?.is_pwbd && <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">PwBD ({profile.pwbd_type || 'Yes'})</span>}
                {profile?.is_ex_serviceman && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">Ex-Serviceman</span>}
                {profile?.is_minority && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Minority</span>}
                {!profile?.is_pwbd && !profile?.is_ex_serviceman && !profile?.is_minority && (
                  <span className="text-slate-400 italic">None claimed</span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Verification Row */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Verified Contact Coordinates
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Mail className="size-4 text-[#0E7BF4] shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block">Primary Email</span>
                    <span className="text-xs font-semibold text-slate-800 truncate block">
                      {user?.email || 'No email linked'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {user?.email_verified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="size-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      Unverified
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenContactModal('email')}
                    className="min-h-[44px] px-3 py-2 inline-flex items-center text-xs font-bold text-[#0E7BF4] hover:bg-blue-50/80 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#0E7BF4]"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Phone className="size-4 text-[#0E7BF4] shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block">Primary Phone / Mobile</span>
                    <span className="text-xs font-semibold text-slate-800 truncate block">
                      {user?.phone || 'No phone linked'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {user?.phone_verified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="size-3" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      Unverified
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenContactModal('phone')}
                    className="min-h-[44px] px-3 py-2 inline-flex items-center text-xs font-bold text-[#0E7BF4] hover:bg-blue-50/80 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#0E7BF4]"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* EDIT FORM MODE */
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="field-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="field-fullname"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                placeholder="Full Name (as per Class 10 certificate)"
                className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]/25 transition-all ${
                  fieldErrors.fullName ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-white'
                }`}
                required
              />
              {fieldErrors.fullName ? (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.fullName}</p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">As recorded in official records</p>
              )}
            </div>

            <div>
              <label htmlFor="field-dob" className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
                {liveAge && (
                  <span className="ml-2 font-normal text-[#0E7BF4]">
                    ({liveAge.years}y {liveAge.months}m)
                  </span>
                )}
              </label>
              <input
                id="field-dob"
                type="date"
                value={dob}
                onChange={(e) => {
                  setDob(e.target.value);
                  if (fieldErrors.dob) setFieldErrors((prev) => ({ ...prev, dob: '' }));
                }}
                className={`w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]/25 transition-all ${
                  fieldErrors.dob ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-white'
                }`}
                required
              />
              {fieldErrors.dob ? (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.dob}</p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">Used for age relaxation cutoff rules</p>
              )}
            </div>

            <div>
              <label htmlFor="field-gender" className="block text-xs font-semibold text-slate-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="field-gender"
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value as UserGender);
                  if (fieldErrors.gender) setFieldErrors((prev) => ({ ...prev, gender: '' }));
                }}
                className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]/25 transition-all ${
                  fieldErrors.gender ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="transgender">Transgender</option>
                <option value="other">Other / Prefer not to say</option>
              </select>
              {fieldErrors.gender ? (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.gender}</p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">For gender fee exemptions & reserved posts</p>
              )}
            </div>

            <div>
              <label htmlFor="field-category" className="block text-xs font-semibold text-slate-700 mb-1">
                Social Category <span className="text-red-500">*</span>
              </label>
              <select
                id="field-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as SocialCategory);
                  if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: '' }));
                }}
                className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]/25 transition-all ${
                  fieldErrors.category ? 'border-red-400 bg-red-50/30' : 'border-slate-200'
                }`}
                required
              >
                <option value="">Select Category</option>
                <option value="general">General / Unreserved</option>
                <option value="obc_ncl">OBC-NCL (Non-Creamy Layer)</option>
                <option value="sc">SC (Scheduled Caste)</option>
                <option value="st">ST (Scheduled Tribe)</option>
                <option value="ews">EWS (Economically Weaker Section)</option>
              </select>
              {fieldErrors.category ? (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.category}</p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">For reservation quota benefits</p>
              )}
            </div>

            <div>
              <label htmlFor="field-income" className="block text-xs font-semibold text-slate-700 mb-1">
                Annual Family Income (INR)
              </label>
              <input
                id="field-income"
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                placeholder="e.g. 450000"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]/25 transition-all"
              />
              <p className="mt-1 text-[11px] text-slate-400">Required for fee concessions & EWS limits</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Disability (PwBD) Status</label>
              <div className="flex items-center min-h-[44px] gap-2.5">
                <input
                  type="checkbox"
                  id="pwbd-check"
                  checked={isPwbd}
                  onChange={(e) => setIsPwbd(e.target.checked)}
                  className="size-4.5 rounded text-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]"
                />
                <label htmlFor="pwbd-check" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Person with Benchmark Disability (40%+)
                </label>
              </div>
              {isPwbd && (
                <input
                  type="text"
                  value={pwbdType}
                  onChange={(e) => setPwbdType(e.target.value)}
                  placeholder="e.g. Locomotor / Visual / Hearing"
                  className="w-full mt-2 min-h-[44px] rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]/25"
                />
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-6 text-xs">
            <label className="flex items-center min-h-[44px] gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isExServiceman}
                onChange={(e) => setIsExServiceman(e.target.checked)}
                className="size-4.5 rounded text-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]"
              />
              <span className="text-slate-700 font-medium">Ex-Serviceman (Armed Forces)</span>
            </label>

            <label className="flex items-center min-h-[44px] gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isMinority}
                onChange={(e) => setIsMinority(e.target.checked)}
                className="size-4.5 rounded text-[#0E7BF4] focus-visible:ring-2 focus-visible:ring-[#0E7BF4]"
              />
              <span className="text-slate-700 font-medium">Minority Community Member</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center min-h-[44px] gap-2 px-6 py-2.5 rounded-xl bg-[#0E7BF4] text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-[#0E7BF4] focus-visible:outline-none"
            >
              {saving && <Spinner size={16} />}
              <span>{saving ? 'Saving...' : 'Save Personal Details'}</span>
            </button>
          </div>
        </form>
      )}

      {/* CHANGE EMAIL / PHONE MODAL */}
      {contactModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {contactModalType === 'email' ? (
                  <Mail className="size-5 text-[#0E7BF4]" />
                ) : (
                  <Phone className="size-5 text-[#0E7BF4]" />
                )}
                <h3 className="text-base font-bold text-slate-900">
                  Change {contactModalType === 'email' ? 'Email Address' : 'Phone Number'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseContactModal}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            {contactError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{contactError}</span>
              </div>
            )}

            {contactStep === 'input' ? (
              <form onSubmit={handleStartContactChange} className="mt-4 space-y-4">
                <p className="text-xs text-slate-500">
                  Enter your new {contactModalType === 'email' ? 'email address' : 'phone number'}. A 6-digit confirmation code will be dispatched to verify ownership.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New {contactModalType === 'email' ? 'Email Address' : 'Phone (e.g. +91 9876543210)'}
                  </label>
                  <input
                    type={contactModalType === 'email' ? 'email' : 'tel'}
                    value={newContactValue}
                    onChange={(e) => setNewContactValue(e.target.value)}
                    placeholder={contactModalType === 'email' ? 'name@example.com' : '+91 9876543210'}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0E7BF4]"
                    required
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseContactModal}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="px-5 py-2 rounded-xl bg-[#0E7BF4] text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50"
                  >
                    {contactLoading ? 'Sending Code...' : 'Send Verification Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyContactChange} className="mt-4 space-y-4">
                <p className="text-xs text-slate-500">
                  Enter the 6-digit code sent to <strong className="text-slate-800">{newContactValue}</strong>.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full font-mono text-center tracking-widest text-lg rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:border-[#0E7BF4]"
                    required
                  />
                </div>
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setContactStep('input')}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Change input
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCloseContactModal}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={contactLoading}
                      className="px-5 py-2 rounded-xl bg-[#0E7BF4] text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50"
                    >
                      {contactLoading ? 'Verifying...' : 'Confirm & Update'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
