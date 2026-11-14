'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UploadCloud,
  User,
} from 'lucide-react';
import {
  registerPartner,
  searchCollegesDirectory,
  uploadPartnerFile,
} from '@/lib/api';
import type { InstitutionSummary } from '@applyfields/types';

export default function InstitutionOnboardPage() {
  const router = useRouter();

  // Wizard Steps: 1: Find College -> 2: Rep Details -> 3: Verification Docs -> 4: Complete
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: College Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InstitutionSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<InstitutionSummary | null>(null);
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [isCustomCollege, setIsCustomCollege] = useState(false);

  // Step 2: Representative Info
  const [repName, setRepName] = useState('');
  const [designation, setDesignation] = useState('Director of Admissions');
  const [officialEmail, setOfficialEmail] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [stateCode, setStateCode] = useState('TS');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('500007');
  const [campusAddress, setCampusAddress] = useState('');

  // Step 3: Verification Docs
  const [authDoc, setAuthDoc] = useState<File | null>(null);
  const authDocName = authDoc?.name ?? '';
  const [accreditationType, setAccreditationType] = useState('naac');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(true);

  // General State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search colleges
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const res = await searchCollegesDirectory(searchQuery.trim());
      setSearchResults(res.data?.items || []);
    } catch {
      setError('Failed to search college directory.');
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelectCollege(inst: InstitutionSummary) {
    setSelectedCollege(inst);
    setIsCustomCollege(false);
    setCity(inst.city || inst.district || '');
    setDistrict(inst.district || '');
    setStateCode(inst.state_code || 'TS');
  }

  function handleCustomToggle() {
    setIsCustomCollege(true);
    setSelectedCollege(null);
  }

  // Handle Submission
  async function handleSubmit() {
    setError(null);

    const collegeName = isCustomCollege
      ? customCollegeName.trim()
      : selectedCollege?.name || '';

    if (!collegeName) {
      setError('Please select or specify your college name.');
      return;
    }

    if (!repName.trim() || !officialEmail.trim() || !mobilePhone.trim()) {
      setError('Please provide all admissions officer contact fields.');
      return;
    }

    setSubmitting(true);

    try {
      const regRes = await registerPartner({
        business_name: collegeName,
        type: 'college',
        owner_name: `${repName.trim()} (${designation.trim()})`,
        phone: mobilePhone.trim().startsWith('+91') ? mobilePhone.trim() : `+91${mobilePhone.trim()}`,
        email: officialEmail.trim(),
        whatsapp: whatsapp ? (whatsapp.startsWith('+91') ? whatsapp : `+91${whatsapp}`) : undefined,
        address: campusAddress.trim() || `${collegeName}, ${city}, ${stateCode}`,
        state_code: stateCode.toUpperCase(),
        district: district.trim() || city.trim() || 'Headquarters',
        city: city.trim() || 'City',
        pincode: pincode.trim() || '500001',
        description: `Official ApplyFields Institutional Admissions Desk for ${collegeName}. Accreditations: ${accreditationType.toUpperCase()}.`,
      });

      if (regRes.error || !regRes.data) {
        setError(regRes.error || 'Registration failed. Please check credentials.');
        setSubmitting(false);
        return;
      }

      // Upload authorization verification stub if provided
      if (authDoc) await uploadPartnerFile('principal_authorization_letter', authDoc);

      router.push('/institution/under-review');
    } catch (err: any) {
      setError(err?.message || 'Unexpected error while registering institution.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-[#082046] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#536780] hover:text-[#0c6fdc] mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Sign In Desk
        </Link>

        {/* Header Banner */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0e7bf4] to-[#0c6fdc] text-white font-black shadow-xl shadow-[#0e7bf4]/20">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#082046] text-xl tracking-tight sm:text-2xl">
                Institution Onboarding
              </span>
            </div>
            <p className="text-xs text-[#536780] mt-1">
              Colleges, Universities &amp; Higher Education Institutions · Direct Admissions Desk
            </p>
          </div>
        </div>

        {/* Step Progress Tracker */}
        <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-4">
          <div
            className={`rounded-xl p-3 border text-xs font-bold transition-all ${
              step === 1
                ? 'border-[#0e7bf4] bg-[#e0edfb] text-[#0e7bf4] shadow-sm'
                : 'border-[#d5deea] bg-[#F7F9FC] text-[#8a9bb3]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-[#e0edfb] flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Find College</span>
            </div>
          </div>
          <div
            className={`rounded-xl p-3 border text-xs font-bold transition-all ${
              step === 2
                ? 'border-[#0e7bf4] bg-[#e0edfb] text-[#0e7bf4] shadow-sm'
                : 'border-[#d5deea] bg-[#F7F9FC] text-[#8a9bb3]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-[#e0edfb] flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Admissions Officer</span>
            </div>
          </div>
          <div
            className={`rounded-xl p-3 border text-xs font-bold transition-all ${
              step === 3
                ? 'border-[#0e7bf4] bg-[#e0edfb] text-[#0e7bf4] shadow-sm'
                : 'border-[#d5deea] bg-[#F7F9FC] text-[#8a9bb3]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-[#e0edfb] flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Verification</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Wizard Container */}
        <div className="rounded-3xl border border-[#d5deea] bg-white p-6 sm:p-8 shadow-[0_1px_2px_rgba(8,32,70,0.04),0_12px_32px_-16px_rgba(8,32,70,0.18)] backdrop-blur-xl">
          {/* STEP 1: Search & Claim College */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#082046]">Find &amp; Claim Your Institution</h2>
                <p className="text-xs text-[#536780] mt-1">
                  Search our directory of 13,000+ Indian colleges and universities.
                </p>
              </div>

              {!isCustomCollege ? (
                <>
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#536780]" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by college name, short code (e.g. IIT, CBIT, Osmania)..."
                        className="w-full rounded-xl border border-[#c9d6e6] bg-white pl-10 pr-4 py-2.5 text-xs text-[#082046] placeholder-[#8a9bb3] focus:border-[#0e7bf4] focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="rounded-xl bg-[#0e7bf4] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0c6fdc] transition"
                    >
                      {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                    </button>
                  </form>

                  {/* Search Results List */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {searchResults.map((col) => {
                        const isSelected = selectedCollege?.id === col.id;
                        return (
                          <div
                            key={col.id}
                            onClick={() => handleSelectCollege(col)}
                            className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                              isSelected
                                ? 'border-[#0e7bf4] bg-[#e0edfb] shadow-sm'
                                : 'border-[#d5deea] bg-[#F7F9FC] hover:border-[#b8c7da]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-[#082046]">{col.name}</span>
                                {col.ranking_text && (
                                  <span className="text-[10px] bg-[#e0edfb] text-[#0e7bf4] font-bold px-1.5 py-0.5 rounded">
                                    {col.ranking_text}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-[#536780] mt-1">
                                <span>{col.type?.toUpperCase()}</span>
                                <span>•</span>
                                <span>{col.city || col.district || 'India'}, {col.state_code}</span>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {isSelected ? (
                                <CheckCircle2 className="h-5 w-5 text-[#0e7bf4]" />
                              ) : (
                                <span className="text-xs text-[#8a9bb3] font-medium">Select</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedCollege && (
                    <div className="rounded-xl border border-[#00a884]/30 bg-[#00a884]/10 p-4 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#00876a]">Selected Institution:</div>
                        <div className="text-sm font-extrabold text-[#082046] mt-0.5">{selectedCollege.name}</div>
                        <div className="text-[11px] text-[#536780]">
                          {selectedCollege.city || selectedCollege.district}, {selectedCollege.state_code}
                        </div>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-[#00876a]" />
                    </div>
                  )}

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleCustomToggle}
                      className="text-xs font-semibold text-[#0e7bf4] hover:text-[#0c6fdc] underline"
                    >
                      Cannot find your college? Click here to register a new institution
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#243b5b]">
                      Official College / University Name
                    </label>
                    <input
                      type="text"
                      value={customCollegeName}
                      onChange={(e) => setCustomCollegeName(e.target.value)}
                      placeholder="e.g. National Institute of Technology Warangal"
                      className="mt-1 w-full rounded-xl border border-[#c9d6e6] bg-white px-4 py-2.5 text-xs text-[#082046] placeholder-[#8a9bb3] focus:border-[#0e7bf4] focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#243b5b]">City / District</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Warangal"
                        className="mt-1 w-full rounded-xl border border-[#c9d6e6] bg-white px-4 py-2.5 text-xs text-[#082046] focus:border-[#0e7bf4] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#243b5b]">State (2-Letter Code)</label>
                      <input
                        type="text"
                        value={stateCode}
                        onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                        maxLength={2}
                        placeholder="TS / AP / KA / MH"
                        className="mt-1 w-full rounded-xl border border-[#c9d6e6] bg-white px-4 py-2.5 text-xs text-[#082046] font-mono focus:border-[#0e7bf4] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setIsCustomCollege(false)}
                      className="text-xs text-[#536780] hover:text-[#082046]"
                    >
                      ← Back to search from existing directory
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedCollege && !customCollegeName.trim()}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0e7bf4] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#0c6fdc] transition disabled:opacity-40"
                >
                  Continue to Admissions Officer Info
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Admissions Representative Info */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#082046]">Admissions Officer &amp; Desk Details</h2>
                <p className="text-xs text-[#536780] mt-1">
                  Designate the official officer who will review student inquiries and manage cutoffs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#243b5b]">Officer Full Name</label>
                  <input
                    type="text"
                    value={repName}
                    onChange={(e) => setRepName(e.target.value)}
                    placeholder="e.g. Dr. K. Venkatesh Rao"
                    className="mt-1 w-full rounded-xl border border-[#c9d6e6] bg-white px-4 py-2.5 text-xs text-[#082046] focus:border-[#0e7bf4] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#243b5b]">Official Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Dean of Admissions / Registrar"
                    className="mt-1 w-full rounded-xl border border-[#c9d6e6] bg-white px-4 py-2.5 text-xs text-[#082046] focus:border-[#0e7bf4] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#243b5b]">
                    Official Institutional Email
                  </label>
                  <input
                    type="email"
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    placeholder="admissions@college.ac.in"
                    className="mt-1 w-full rounded-xl border border-[#c9d6e6] bg-white px-4 py-2.5 text-xs text-[#082046] focus:border-[#0e7bf4] focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-[#8a9bb3] mt-1">
                    Institutional domain (.edu / .ac.in) gives instant priority verification.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#243b5b]">
                    Admissions Helpline Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="mt-1 w-full rounded-xl border border-[#c9d6e6] bg-white px-4 py-2.5 text-xs text-[#082046] focus:border-[#0e7bf4] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243b5b]">
                  Campus Admissions Office Address
                </label>
                <input
                  type="text"
                  value={campusAddress}
                  onChange={(e) => setCampusAddress(e.target.value)}
                  placeholder="e.g. Administrative Block, Room 104, Main Campus"
                  className="mt-1 w-full rounded-xl border border-[#c9d6e6] bg-white px-4 py-2.5 text-xs text-[#082046] focus:border-[#0e7bf4] focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-[#d5deea] bg-[#F7F9FC] px-5 py-2.5 text-xs font-semibold text-[#536780] hover:text-[#082046]"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!repName.trim() || !officialEmail.trim() || !mobilePhone.trim()}
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0e7bf4] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#0c6fdc] transition disabled:opacity-40"
                >
                  Continue to Verification
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Verification & Submit */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#082046]">Institutional Authorization &amp; Documents</h2>
                <p className="text-xs text-[#536780] mt-1">
                  Upload official documentation proving your representation authority for the college.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243b5b]">Accreditation Body</label>
                <select
                  value={accreditationType}
                  onChange={(e) => setAccreditationType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#c9d6e6] bg-white px-4 py-2.5 text-xs text-[#082046] focus:border-[#0e7bf4] focus:outline-none"
                >
                  <option value="naac">NAAC Accredited (A++ / A+ / A)</option>
                  <option value="aicte">AICTE Approved Engineering / Tech Institute</option>
                  <option value="ugc">UGC Recognized State / Deemed University</option>
                  <option value="autonomous">UGC Autonomous College</option>
                  <option value="other">Central Government Institute of National Importance (IIT/NIT/AIIMS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#243b5b]">
                  Official Authorization Letter / Principal ID
                </label>
                <div className="mt-1 flex justify-center rounded-2xl border-2 border-dashed border-[#c9d6e6] bg-[#F7F9FC] px-6 py-8">
                  <div className="text-center">
                    <UploadCloud className="mx-auto h-10 w-10 text-[#0e7bf4]" />
                    <div className="mt-2 text-xs text-[#243b5b]">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer font-bold text-[#0e7bf4] hover:text-[#0c6fdc] underline"
                      >
                        Upload authorization document (PDF / JPG)
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setAuthDoc(file);
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[#8a9bb3] mt-1">
                      Letterhead authorization signed by Principal, Registrar or Secretary. Max 10MB.
                    </p>
                    {authDocName && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#00a884]/15 px-3 py-1 text-xs font-bold text-[#00876a]">
                        <FileCheck2 className="h-4 w-4" /> {authDocName}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#d5deea] bg-[#F7F9FC] p-4 text-xs text-[#536780] flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-[#0e7bf4] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#082046]">Trust &amp; Anti-Spam Guarantee: </span>
                  ApplyFields never sells student inquiries to brokers. Inquiries submitted on our platform are confidential and delivered strictly to verified institutional representatives.
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-[#d5deea] bg-[#F7F9FC] px-5 py-2.5 text-xs font-semibold text-[#536780] hover:text-[#082046]"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0e7bf4] px-7 py-3 text-sm font-bold text-white hover:bg-[#0c6fdc] shadow-xl shadow-[#0e7bf4]/20 transition disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Registration...
                    </>
                  ) : (
                    <>
                      Complete Registration &amp; Submit
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
