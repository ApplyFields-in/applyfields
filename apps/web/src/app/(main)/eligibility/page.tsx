'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
  Search,
  SlidersHorizontal,
  UserCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { OpportunityCard, OpportunityList, UserProfile, MeResponse } from '@applyfields/types';
import { HorizontalOpportunityCard } from '@/components/opportunity/horizontal-opportunity-card';

const EDUCATION_LEVELS = [
  { id: '10th', label: 'Class 10th (Secondary)' },
  { id: '12th', label: 'Class 12th (Higher Secondary)' },
  { id: 'diploma', label: 'Polytechnic / Diploma' },
  { id: 'graduate', label: 'Graduate / Bachelor’s Degree' },
  { id: 'post_graduate', label: 'Post-Graduate / Master’s' },
];

const CATEGORIES = [
  { id: 'GENERAL', label: 'General / Unreserved' },
  { id: 'OBC', label: 'OBC (Other Backward Classes)' },
  { id: 'SC', label: 'SC (Scheduled Caste)' },
  { id: 'ST', label: 'ST (Scheduled Tribe)' },
  { id: 'EWS', label: 'EWS (Economically Weaker Section)' },
];

const STATES = [
  { code: 'ALL', name: 'All India (Central)' },
  { code: 'TS', name: 'Telangana' },
  { code: 'AP', name: 'Andhra Pradesh' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'DL', name: 'Delhi NCR' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'UP', name: 'Uttar Pradesh' },
];

export default function EligibilityPage() {
  const [dob, setDob] = useState('2000-01-01');
  const [qualification, setQualification] = useState('graduate');
  const [category, setCategory] = useState('OBC');
  const [domicile, setDomicile] = useState('ALL');
  const [gender, setGender] = useState('any');

  const [opportunities, setOpportunities] = useState<OpportunityCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Calculate age
  const calculatedAge = React.useMemo(() => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  }, [dob]);

  useEffect(() => {
    // Check if user has saved profile
    apiGet<MeResponse>('/me').then((me) => {
      if (me?.profile) {
        setIsLoggedIn(true);
        if (me.profile.date_of_birth) {
          setDob(me.profile.date_of_birth.slice(0, 10));
        }
        if (me.profile.category) {
          setCategory(me.profile.category);
        }
        if (me.profile.domicile_state_code) {
          setDomicile(me.profile.domicile_state_code);
        }
      }
    });

    fetchMatches();
  }, []);

  const fetchMatches = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (qualification) params.set('qualification', qualification);
    if (domicile && domicile !== 'ALL') params.set('state', domicile);

    apiGet<OpportunityList>(`/opportunities?${params.toString()}`)
      .then((res) => {
        setOpportunities(res?.items ?? []);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
          <BadgeCheck className="size-4" />
          <span>Apply Mode · Instant Verification</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
          Eligibility Check
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#435775]">
          Find exactly which government recruitments, competitive exams, scholarships, and admission notifications you qualify for based on age rules, reservation relaxations, and qualifications.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Left Column: Calculator Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#082046] flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-[#0e7bf4]" /> Your Criteria
              </h2>
              {calculatedAge !== null && (
                <span className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#0e7bf4]">
                  Age: {calculatedAge} yrs
                </span>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dob" className="block text-xs font-bold text-[#082046]">
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 text-sm text-[#082046] outline-none focus:border-[#0e7bf4]"
              />
              <p className="mt-1 text-[11px] text-[#536780]">
                Commission age limits are computed against crucial cut-off dates.
              </p>
            </div>

            {/* Educational Qualification */}
            <div>
              <label htmlFor="qualification" className="block text-xs font-bold text-[#082046]">
                Highest Qualification
              </label>
              <select
                id="qualification"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 text-sm text-[#082046] outline-none focus:border-[#0e7bf4]"
              >
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Social Reservation Category */}
            <div>
              <label htmlFor="category" className="block text-xs font-bold text-[#082046]">
                Social Category (Age &amp; Fee Relaxations)
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 text-sm text-[#082046] outline-none focus:border-[#0e7bf4]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#536780]">
                OBC gets +3 yrs, SC/ST gets +5 yrs upper age relaxations automatically.
              </p>
            </div>

            {/* State Domicile */}
            <div>
              <label htmlFor="domicile" className="block text-xs font-bold text-[#082046]">
                State Domicile
              </label>
              <select
                id="domicile"
                value={domicile}
                onChange={(e) => setDomicile(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 text-sm text-[#082046] outline-none focus:border-[#0e7bf4]"
              >
                {STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Update button */}
            <button
              type="button"
              onClick={fetchMatches}
              className="w-full rounded-xl bg-[#082046] py-2.5 text-xs font-semibold text-white transition hover:bg-[#061835]"
            >
              Re-calculate Matching Opportunities
            </button>
          </div>

          {/* Sync with profile note */}
          <div className="rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-4 text-xs text-[#435775] space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#082046]">
              <Sparkles className="size-4 text-[#0e7bf4]" />
              <span>Save to your profile</span>
            </div>
            <p>
              Log in and set your birth date and degree once in your Profile to automatically filter all listings across the site with &quot;Eligible for me&quot;.
            </p>
            <Link
              href={isLoggedIn ? '/profile' : '/login'}
              className="inline-flex items-center gap-1 font-semibold text-[#0e7bf4] hover:underline"
            >
              {isLoggedIn ? 'Manage Profile →' : 'Log in to auto-check →'}
            </Link>
          </div>
        </div>

        {/* Right Column: Matched Opportunities List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#082046]">Eligible Opportunities</h2>
              <p className="text-xs text-[#536780]">
                Notifications matching your criteria ({opportunities.length} found)
              </p>
            </div>
            <Link
              href="/apply"
              className="text-xs font-medium text-[#0e7bf4] hover:underline"
            >
              Explore all filters →
            </Link>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-[#c4d2e3] bg-white p-8 text-center text-sm text-[#536780]">
              Checking criteria against open notifications...
            </div>
          ) : opportunities.length === 0 ? (
            <div className="rounded-2xl border border-[#c4d2e3] bg-white p-8 text-center">
              <UserCheck className="mx-auto size-12 text-[#91a8c7]" />
              <h3 className="mt-3 text-base font-bold text-[#082046]">No open notifications matched</h3>
              <p className="mt-1 text-sm text-[#536780]">
                Try selecting &quot;All India&quot; state or another qualification level to see general recruitments.
              </p>
            </div>
          ) : (
            opportunities.map((item) => (
              <HorizontalOpportunityCard
                key={item.slug}
                item={{
                  ...item,
                  type: item.type,
                }}
              />
            ))
          )}

          <div className="flex items-start gap-2.5 rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-4 text-xs text-[#435775]">
            <ShieldCheck className="size-4 shrink-0 text-[#0e7bf4] mt-0.5" />
            <p>
              <strong>Truth in Data:</strong> Eligibility rules are extracted directly from official recruitment notifications published by government commissions. Always consult the official notification PDF linked on each opportunity before final form submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
