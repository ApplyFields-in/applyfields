'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  Copy,
  Edit2,
  ExternalLink,
  GraduationCap,
  IdCard,
  Layers,
  Maximize2,
  Minimize2,
  PictureInPicture,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { MeResponse, UserEducation, UserProfile, UserSummary } from '@applyfields/types';
import { usePipApply } from '@/context/pip-apply-context';

export interface CopierData {
  // Personal
  fullName: string;
  fatherName: string;
  motherName: string;
  dobDdmmyyyy: string;
  dobYyyymmdd: string;
  gender: string;
  category: string;
  domicileState: string;
  district: string;
  nationality: string;
  maritalStatus: string;
  // Contact & ID
  mobile: string;
  email: string;
  aadhaarNumber: string;
  panNumber: string;
  pinCode: string;
  permanentAddress: string;
  // Academic - 10th
  tenthBoard: string;
  tenthRollNumber: string;
  tenthYear: string;
  tenthPercentage: string;
  // Academic - 12th
  twelfthBoard: string;
  twelfthStream: string;
  twelfthRollNumber: string;
  twelfthYear: string;
  twelfthPercentage: string;
  // Academic - Degree
  degreeName: string;
  degreeUniversity: string;
  degreeRollNumber: string;
  degreeYear: string;
  degreeCgpa: string;
  // Document Specs
  photoSpec: string;
  signatureSpec: string;
  categoryCertNumber: string;
}

const STORAGE_KEY = 'applyfields_copier_cache_v1';

const DEFAULT_COPIER_DATA: CopierData = {
  fullName: '',
  fatherName: '',
  motherName: '',
  dobDdmmyyyy: '',
  dobYyyymmdd: '',
  gender: '',
  category: '',
  domicileState: '',
  district: '',
  nationality: 'Indian',
  maritalStatus: 'Unmarried',
  mobile: '',
  email: '',
  aadhaarNumber: '',
  panNumber: '',
  pinCode: '',
  permanentAddress: '',
  tenthBoard: 'CBSE / State Board',
  tenthRollNumber: '',
  tenthYear: '',
  tenthPercentage: '',
  twelfthBoard: 'State Board / CBSE',
  twelfthStream: 'Science (MPC) / General',
  twelfthRollNumber: '',
  twelfthYear: '',
  twelfthPercentage: '',
  degreeName: 'B.Tech / Degree',
  degreeUniversity: '',
  degreeRollNumber: '',
  degreeYear: '',
  degreeCgpa: '',
  photoSpec: '20 KB – 50 KB (200 x 230 px, JPG)',
  signatureSpec: '10 KB – 20 KB (140 x 60 px, JPG)',
  categoryCertNumber: '',
};

export function CandidateProfileCopier({
  isEmbeddedInPipWindow = false,
  onClose,
}: {
  isEmbeddedInPipWindow?: boolean;
  onClose?: () => void;
}) {
  const { isDocPipSupported, isDocPipActive, openDocumentPip, closeDocumentPip } = usePipApply();
  const [data, setData] = useState<CopierData>(DEFAULT_COPIER_DATA);
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'contact' | 'education' | 'specs'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load profile from API and merge with localStorage cache
  useEffect(() => {
    let localCache: Partial<CopierData> = {};
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) localCache = JSON.parse(raw);
      } catch {
        // ignore
      }
    }

    setIsLoading(true);
    apiGet<MeResponse>('/me')
      .then((res) => {
        const user = res?.user;
        const prof = res?.profile;
        const eduList = res?.education || [];

        let tenth = eduList.find((e) => e.level === '10th');
        let twelfth = eduList.find((e) => e.level === '12th' || e.level === 'diploma');
        let degree = eduList.find((e) => e.level === 'graduate' || e.level === 'post_graduate');

        // Format dates
        let ddmmyyyy = '';
        let yyyymmdd = '';
        if (prof?.date_of_birth) {
          yyyymmdd = prof.date_of_birth.slice(0, 10);
          const parts = yyyymmdd.split('-');
          if (parts.length === 3) {
            ddmmyyyy = `${parts[2]}/${parts[1]}/${parts[0]}`;
          }
        }

        const merged: CopierData = {
          ...DEFAULT_COPIER_DATA,
          fullName: prof?.full_name || localCache.fullName || '',
          fatherName: localCache.fatherName || '',
          motherName: localCache.motherName || '',
          dobDdmmyyyy: ddmmyyyy || localCache.dobDdmmyyyy || '',
          dobYyyymmdd: yyyymmdd || localCache.dobYyyymmdd || '',
          gender: prof?.gender ? prof.gender.toUpperCase() : (localCache.gender || 'MALE'),
          category: prof?.category ? prof.category.toUpperCase() : (localCache.category || 'GENERAL'),
          domicileState: prof?.domicile_state_code || prof?.state_code || localCache.domicileState || '',
          district: prof?.district || localCache.district || '',
          nationality: localCache.nationality || 'Indian',
          maritalStatus: localCache.maritalStatus || 'Unmarried',
          mobile: user?.phone || localCache.mobile || '',
          email: user?.email || localCache.email || '',
          aadhaarNumber: localCache.aadhaarNumber || '',
          panNumber: localCache.panNumber || '',
          pinCode: localCache.pinCode || '',
          permanentAddress: localCache.permanentAddress || '',
          // 10th
          tenthBoard: tenth?.board_or_university || localCache.tenthBoard || 'CBSE / State Board',
          tenthRollNumber: localCache.tenthRollNumber || '',
          tenthYear: tenth?.year_of_passing ? String(tenth.year_of_passing) : (localCache.tenthYear || ''),
          tenthPercentage: tenth?.score ? `${tenth.score}%` : (localCache.tenthPercentage || ''),
          // 12th
          twelfthBoard: twelfth?.board_or_university || localCache.twelfthBoard || 'State Board / CBSE',
          twelfthStream: twelfth?.stream || localCache.twelfthStream || 'Science / Commerce / Arts',
          twelfthRollNumber: localCache.twelfthRollNumber || '',
          twelfthYear: twelfth?.year_of_passing ? String(twelfth.year_of_passing) : (localCache.twelfthYear || ''),
          twelfthPercentage: twelfth?.score ? `${twelfth.score}%` : (localCache.twelfthPercentage || ''),
          // Degree
          degreeName: degree?.degree || degree?.stream || localCache.degreeName || 'Bachelor Degree',
          degreeUniversity: degree?.board_or_university || degree?.institution_name || localCache.degreeUniversity || '',
          degreeRollNumber: localCache.degreeRollNumber || '',
          degreeYear: degree?.year_of_passing ? String(degree.year_of_passing) : (localCache.degreeYear || ''),
          degreeCgpa: degree?.score ? `${degree.score} ${degree.score_type || 'CGPA'}` : (localCache.degreeCgpa || ''),
          // Specs
          photoSpec: localCache.photoSpec || DEFAULT_COPIER_DATA.photoSpec,
          signatureSpec: localCache.signatureSpec || DEFAULT_COPIER_DATA.signatureSpec,
          categoryCertNumber: localCache.categoryCertNumber || '',
        };

        setData(merged);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      })
      .catch(() => {
        if (Object.keys(localCache).length > 0) {
          setData({ ...DEFAULT_COPIER_DATA, ...localCache });
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleCopy = (key: string, value: string) => {
    if (!value) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const handleStartEdit = (key: string, currentVal: string) => {
    setEditingKey(key);
    setTempValue(currentVal);
  };

  const handleSaveEdit = (key: keyof CopierData) => {
    const updated = { ...data, [key]: tempValue.trim() };
    setData(updated);
    setEditingKey(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  };

  // Structured Field Definitions
  const fields = useMemo(() => {
    return [
      // Personal
      { group: 'personal', key: 'fullName', label: 'Candidate Full Name', value: data.fullName, hint: 'As per 10th marksheet' },
      { group: 'personal', key: 'fatherName', label: "Father's / Guardian's Name", value: data.fatherName, hint: 'Official records' },
      { group: 'personal', key: 'motherName', label: "Mother's Name", value: data.motherName, hint: 'Official records' },
      { group: 'personal', key: 'dobDdmmyyyy', label: 'Date of Birth (DD/MM/YYYY)', value: data.dobDdmmyyyy, hint: 'Standard Indian format' },
      { group: 'personal', key: 'dobYyyymmdd', label: 'Date of Birth (YYYY-MM-DD)', value: data.dobYyyymmdd, hint: 'ISO portal format' },
      { group: 'personal', key: 'gender', label: 'Gender', value: data.gender, hint: 'MALE / FEMALE / OTHER' },
      { group: 'personal', key: 'category', label: 'Social Category', value: data.category, hint: 'GEN / OBC-NCL / SC / ST / EWS' },
      { group: 'personal', key: 'domicileState', label: 'Domicile State', value: data.domicileState, hint: 'State of residence' },
      { group: 'personal', key: 'district', label: 'Home District', value: data.district, hint: 'Permanent district' },
      { group: 'personal', key: 'nationality', label: 'Nationality', value: data.nationality, hint: 'Citizenship' },
      { group: 'personal', key: 'maritalStatus', label: 'Marital Status', value: data.maritalStatus, hint: 'Unmarried / Married' },

      // Contact & ID
      { group: 'contact', key: 'mobile', label: 'Mobile Number', value: data.mobile, hint: '10-digit primary mobile' },
      { group: 'contact', key: 'email', label: 'Email Address', value: data.email, hint: 'Application login email' },
      { group: 'contact', key: 'aadhaarNumber', label: 'Aadhaar Card Number', value: data.aadhaarNumber, hint: '12-digit UID' },
      { group: 'contact', key: 'panNumber', label: 'PAN / Photo ID Number', value: data.panNumber, hint: 'Govt Photo Identity' },
      { group: 'contact', key: 'pinCode', label: 'Postal PIN Code', value: data.pinCode, hint: '6-digit PIN' },
      { group: 'contact', key: 'permanentAddress', label: 'Permanent Address', value: data.permanentAddress, hint: 'Full address line' },

      // Education - 10th
      { group: 'education', key: 'tenthBoard', label: '10th Board Name', value: data.tenthBoard, hint: 'CBSE / ICSE / State' },
      { group: 'education', key: 'tenthRollNumber', label: '10th Roll / Hall Ticket No', value: data.tenthRollNumber, hint: 'Matriculation roll' },
      { group: 'education', key: 'tenthYear', label: '10th Passing Year', value: data.tenthYear, hint: 'Year completed' },
      { group: 'education', key: 'tenthPercentage', label: '10th Percentage / CGPA', value: data.tenthPercentage, hint: 'Marks obtained' },

      // Education - 12th
      { group: 'education', key: 'twelfthBoard', label: '12th / Inter Board', value: data.twelfthBoard, hint: 'Higher secondary' },
      { group: 'education', key: 'twelfthStream', label: '12th Stream / Subject', value: data.twelfthStream, hint: 'MPC / BiPC / Commerce' },
      { group: 'education', key: 'twelfthRollNumber', label: '12th Roll Number', value: data.twelfthRollNumber, hint: 'Hall ticket no' },
      { group: 'education', key: 'twelfthYear', label: '12th Passing Year', value: data.twelfthYear, hint: 'Year completed' },
      { group: 'education', key: 'twelfthPercentage', label: '12th Percentage / Marks', value: data.twelfthPercentage, hint: 'Overall marks' },

      // Education - Degree
      { group: 'education', key: 'degreeName', label: 'Graduation Degree', value: data.degreeName, hint: 'B.Tech / B.Sc / B.Com' },
      { group: 'education', key: 'degreeUniversity', label: 'University / College', value: data.degreeUniversity, hint: 'Awarding institution' },
      { group: 'education', key: 'degreeRollNumber', label: 'Degree Roll / Reg No', value: data.degreeRollNumber, hint: 'Enrollment number' },
      { group: 'education', key: 'degreeYear', label: 'Degree Passing Year', value: data.degreeYear, hint: 'Completion year' },
      { group: 'education', key: 'degreeCgpa', label: 'Degree CGPA / Percentage', value: data.degreeCgpa, hint: 'Final score' },

      // Specs
      { group: 'specs', key: 'photoSpec', label: 'Photo Upload Specs', value: data.photoSpec, hint: 'Standard PSC/SSC spec' },
      { group: 'specs', key: 'signatureSpec', label: 'Signature Upload Specs', value: data.signatureSpec, hint: 'Standard PSC/SSC spec' },
      { group: 'specs', key: 'categoryCertNumber', label: 'Category Certificate No', value: data.categoryCertNumber, hint: 'Caste / EWS cert no' },
    ];
  }, [data]);

  // Filtered fields
  const filteredFields = useMemo(() => {
    let list = fields;
    if (activeTab !== 'all') {
      list = list.filter((f) => f.group === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.value.toLowerCase().includes(q) ||
          f.hint?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [fields, activeTab, searchQuery]);

  return (
    <div className="flex h-full flex-col bg-[#f8fafc] text-[#082046] select-none font-sans">
      {/* Top Header Bar */}
      <div className="border-b border-slate-200 bg-white px-3.5 py-2.5 shrink-0 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#082046] text-white">
            <IdCard className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#082046] leading-tight flex items-center gap-1.5 truncate">
              <span>ApplyFields Quick Copier</span>
              <span className="text-[10px] font-normal text-slate-500 hidden sm:inline">
                (Click to copy directly into application form)
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Native OS Picture-in-Picture Button */}
          {isDocPipSupported && !isEmbeddedInPipWindow && (
            <button
              type="button"
              onClick={() => {
                if (isDocPipActive) {
                  closeDocumentPip();
                } else {
                  openDocumentPip();
                }
              }}
              title={
                isDocPipActive
                  ? 'Close floating Picture-in-Picture window'
                  : 'Pop out copier to floating OS Picture-in-Picture window'
              }
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition active:scale-95 ${
                isDocPipActive
                  ? 'bg-blue-100 text-[#0e7bf4]'
                  : 'bg-slate-100 text-[#082046] hover:bg-slate-200'
              }`}
            >
              <PictureInPicture className="size-3.5" />
              <span className="hidden sm:inline">
                {isDocPipActive ? 'Docked PiP Active' : 'Pop out PiP'}
              </span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Close copier"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-2.5 border-b border-slate-200 bg-white/70 backdrop-blur-xs space-y-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search details (e.g. roll, dob, aadhaar, marks)..."
            className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-[#082046] placeholder:text-slate-400 focus:border-[#0e7bf4] focus:outline-hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Tab Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          {[
            { id: 'all', label: 'All' },
            { id: 'personal', label: 'Personal' },
            { id: 'contact', label: 'Contact & ID' },
            { id: 'education', label: 'Education' },
            { id: 'specs', label: 'Specs' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-md px-2.5 py-1 font-medium transition shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#082046] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fields List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredFields.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No fields match your search.
          </div>
        ) : (
          filteredFields.map((field) => {
            const isCopied = copiedKey === field.key;
            const isEditing = editingKey === field.key;
            const hasValue = Boolean(field.value && field.value.trim());

            return (
              <div
                key={field.key}
                className="group relative rounded-xl border border-slate-200 bg-white p-2.5 transition hover:border-[#0e7bf4]/40 hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-600 truncate">
                        {field.label}
                      </span>
                      {field.hint && (
                        <span className="text-[10px] text-slate-400 hidden sm:inline">
                          · {field.hint}
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-[#082046] focus:border-[#0e7bf4] focus:outline-hidden"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(field.key as keyof CopierData);
                            if (e.key === 'Escape') setEditingKey(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(field.key as keyof CopierData)}
                          className="rounded-md bg-[#082046] px-2 py-1 text-xs font-semibold text-white hover:bg-[#0e7bf4]"
                        >
                          <Save className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingKey(null)}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-0.5">
                        {hasValue ? (
                          <span className="text-xs font-bold text-[#082046] break-all select-text font-mono">
                            {field.value}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(field.key, '')}
                            className="text-xs italic text-slate-400 hover:text-[#0e7bf4] flex items-center gap-1"
                          >
                            <span>Not set — click to add</span>
                            <Edit2 className="size-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {hasValue && !isEditing && (
                      <button
                        type="button"
                        onClick={() => handleCopy(field.key, field.value)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition active:scale-95 ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#082046] text-white hover:bg-[#0e7bf4]'
                        }`}
                        title="Copy to clipboard"
                      >
                        {isCopied ? (
                          <>
                            <Check className="size-3.5 stroke-[3]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(field.key, field.value)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                        title="Edit value"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Status / Instructions */}
      <div className="border-t border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        <span>Click <strong>Copy</strong> and paste into each official field</span>
        <span className="text-slate-400 font-medium">Ctrl+V to paste</span>
      </div>
    </div>
  );
}
