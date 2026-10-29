'use client';

import { useState, useTransition } from 'react';
import type { AdminInstitutionInput, InstitutionDetail, InstitutionSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  AlertCircle,
  Building,
  Check,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Info,
  MapPin,
  Save,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createCollegeAction, updateCollegeAction } from '@/lib/actions';

interface CollegeFormModalProps {
  college?: InstitutionSummary | InstitutionDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CollegeFormModal({ college, isOpen, onClose }: CollegeFormModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(college?.id);

  // Form State
  const [name, setName] = useState(college?.name || '');
  const [shortName, setShortName] = useState(college?.short_name || '');
  const [slug, setSlug] = useState(college?.slug || '');
  const [type, setType] = useState(college?.type || 'college');
  const [ownership, setOwnership] = useState(college?.ownership || 'private');
  const [stateCode, setStateCode] = useState(college?.state_code || '');
  const [city, setCity] = useState(college?.city || '');
  const [district, setDistrict] = useState(college?.district || '');
  const [address, setAddress] = useState((college as any)?.address || '');
  const [pincode, setPincode] = useState((college as any)?.pincode || '');
  const [website, setWebsite] = useState(college?.website || '');
  const [rankingText, setRankingText] = useState(college?.ranking_text || '');
  const [feesText, setFeesText] = useState(college?.fees_text || '');
  const [description, setDescription] = useState((college as any)?.description || '');
  const [establishedYear, setEstablishedYear] = useState<string>(
    (college as any)?.established_year ? String((college as any).established_year) : '',
  );
  const [highestPackage, setHighestPackage] = useState(
    college?.placement_stats?.highest_package || '',
  );
  const [avgPackage, setAvgPackage] = useState(
    college?.placement_stats?.avg_package || '',
  );
  const [topRecruiters, setTopRecruiters] = useState(
    college?.placement_stats?.top_recruiters?.join(', ') || '',
  );
  const [facilities, setFacilities] = useState(
    (college as any)?.campus_facilities?.join(', ') || '',
  );
  const [contactEmail, setContactEmail] = useState((college as any)?.contact_email || '');
  const [contactPhone, setContactPhone] = useState((college as any)?.contact_phone || '');
  const [status, setStatus] = useState((college as any)?.status || 'published');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('College official name is required.');
      return;
    }

    if (stateCode && !/^[A-Z]{2}$/.test(stateCode.trim().toUpperCase())) {
      setError('State code must be 2 uppercase letters (e.g. TN, TS, AP, DL, KA, MH).');
      return;
    }

    if (pincode && !/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setError('Pincode must be 6 digits (e.g. 600036).');
      return;
    }

    const payload: AdminInstitutionInput = {
      name: name.trim(),
      short_name: shortName.trim() || null,
      slug: slug.trim() || undefined,
      type: type as any,
      ownership: ownership as any,
      state_code: stateCode.trim().toUpperCase() || null,
      district: district.trim() || null,
      city: city.trim() || null,
      address: address.trim() || null,
      pincode: pincode.trim() || null,
      website: website.trim() || null,
      ranking_text: rankingText.trim() || null,
      fees_text: feesText.trim() || null,
      description: description.trim() || null,
      established_year: establishedYear ? parseInt(establishedYear, 10) : null,
      placement_stats: {
        highest_package: highestPackage.trim() || 'Data not given',
        avg_package: avgPackage.trim() || 'Data not given',
        top_recruiters: topRecruiters
          ? topRecruiters.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
      },
      campus_facilities: facilities
        ? facilities.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      status: status as any,
    };

    startTransition(async () => {
      if (isEditing && college?.id) {
        const res = await updateCollegeAction(college.id, payload);
        if (res.ok) {
          router.refresh();
          onClose();
        } else {
          setError(res.error || 'Failed to update institution.');
        }
      } else {
        const res = await createCollegeAction(payload);
        if (res.ok) {
          router.refresh();
          onClose();
        } else {
          setError(res.error || 'Failed to create institution.');
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-line/80 bg-canvas shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line/60 bg-cream/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-teal text-cream shadow-sm">
              <Building className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-teal">
                {isEditing ? `Edit & Fill Missing Data: ${college?.name || ''}` : 'Add New College / Institution'}
              </h2>
              <p className="text-xs text-teal/70">
                {isEditing
                  ? 'Update missing fields, fee structures, NIRF rankings, and placement statistics'
                  : 'Add a verified higher education institution to ApplyFields catalog'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-teal/60 hover:bg-tea/40 hover:text-teal transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Identity */}
          <div className="space-y-4 rounded-2xl border border-line/60 bg-cream/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal">
                1. Basic Information & Identity
              </span>
              <Badge tone="teal" className="text-[10px]">Core</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Full Official Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Indian Institute of Technology Madras"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Short Acronym / Name
                </label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="e.g. IIT Madras"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Institution Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                >
                  <option value="college">College</option>
                  <option value="university">University</option>
                  <option value="institute">National Institute</option>
                  <option value="school">School / Academy</option>
                  <option value="training_centre">Training Centre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Ownership
                </label>
                <select
                  value={ownership}
                  onChange={(e) => setOwnership(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                >
                  <option value="government">Government / Central / State</option>
                  <option value="private">Private</option>
                  <option value="deemed">Deemed University</option>
                  <option value="autonomous">Autonomous</option>
                  <option value="aided">Government Aided</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Established Year
                </label>
                <input
                  type="number"
                  min="1800"
                  max="2030"
                  value={establishedYear}
                  onChange={(e) => setEstablishedYear(e.target.value)}
                  placeholder="e.g. 1959"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Official Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.iitm.ac.in"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Address */}
          <div className="space-y-4 rounded-2xl border border-line/60 bg-cream/20 p-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal">
              2. Location & Campus Geography
            </span>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  State Code (2 Letters)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TN, TS, AP, DL, KA"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal uppercase focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  City / Campus
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Chennai"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Chennai"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Sardar Patel Road, Adyar"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Pincode (6 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 600036"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Rankings, Accreditations & Fees */}
          <div className="space-y-4 rounded-2xl border border-line/60 bg-cream/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal">
                3. Rankings, Accreditation & Fees Structure
              </span>
              {!feesText && (
                <Badge tone="tea" className="text-[10px] font-bold">
                  Missing Fees — Fill Here
                </Badge>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Official Ranking Badge
                </label>
                <input
                  type="text"
                  value={rankingText}
                  onChange={(e) => setRankingText(e.target.value)}
                  placeholder="e.g. NIRF Rank #1 Overall & Engineering, or NBA Accredited"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Annual Tuition Fees Text
                </label>
                <input
                  type="text"
                  value={feesText}
                  onChange={(e) => setFeesText(e.target.value)}
                  placeholder="e.g. ₹2.1 Lakhs/year (B.Tech) or Subsidized"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Placements & Recruiters */}
          <div className="space-y-4 rounded-2xl border border-line/60 bg-cream/20 p-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal">
              4. Placement Statistics & Highlights
            </span>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Highest Salary Package
                </label>
                <input
                  type="text"
                  value={highestPackage}
                  onChange={(e) => setHighestPackage(e.target.value)}
                  placeholder="e.g. ₹1.98 CPA or ₹45 LPA"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Average Salary Package
                </label>
                <input
                  type="text"
                  value={avgPackage}
                  onChange={(e) => setAvgPackage(e.target.value)}
                  placeholder="e.g. ₹21.48 LPA or ₹8.5 LPA"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Top Recruiters (Comma Separated)
                </label>
                <input
                  type="text"
                  value={topRecruiters}
                  onChange={(e) => setTopRecruiters(e.target.value)}
                  placeholder="e.g. Google, Microsoft, Amazon, Texas Instruments, Intel, Qualcomm"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Campus Facilities & Academic Legacy */}
          <div className="space-y-4 rounded-2xl border border-line/60 bg-cream/20 p-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal">
              5. Facilities & Academic Legacy
            </span>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Campus Facilities (Comma Separated)
                </label>
                <input
                  type="text"
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                  placeholder="e.g. Central Library, Hostels, Sports Complex, High-Performance Computing, Wi-Fi"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-teal/80 mb-1">
                  Academic Description & Focus Areas
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe academic heritage, flagship departments, research output, and vision..."
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-teal/80 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="admissions@college.edu.in"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-teal/80 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-teal focus:border-teal focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-line/60 bg-cream/40 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className={buttonClass({ variant: 'ghost', size: 'sm' })}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className={buttonClass({
              variant: 'primary',
              size: 'sm',
              className: 'gap-1.5 shadow-clay',
            })}
          >
            <Save className="size-4" />
            {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Institution'}
          </button>
        </div>
      </div>
    </div>
  );
}
