'use client';

import { useEffect, useState } from 'react';
import type { InstitutionDetail, InstitutionSummary } from '@applyfields/types';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building,
  Columns,
  ExternalLink,
  GraduationCap,
  MapPin,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { TOP_50_COLLEGES, getTop50CollegeBySlug } from '@/lib/top-50-colleges-data';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PrintExportButton } from '@/components/print-export-button';

export default function CollegeComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const slugsParam = searchParams.get('slugs') || '';
  const selectedSlugs = slugsParam
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // Instant in-memory synchronous data resolution for 0ms page render
  const initialMatches = selectedSlugs
    .map((s) => getTop50CollegeBySlug(s))
    .filter(Boolean) as InstitutionDetail[];

  const [colleges, setColleges] = useState<InstitutionDetail[]>(initialMatches);
  const [allColleges] = useState<InstitutionSummary[]>(TOP_50_COLLEGES);
  const [loading, setLoading] = useState(selectedSlugs.length > 0 && initialMatches.length === 0);

  // Fast background synchronization with API (non-blocking)
  useEffect(() => {
    let cancelled = false;

    // Immediately update from local memory
    const local = selectedSlugs
      .map((s) => getTop50CollegeBySlug(s))
      .filter(Boolean) as InstitutionDetail[];

    if (local.length > 0) {
      setColleges(local);
      setLoading(false);
    } else if (selectedSlugs.length > 0) {
      setLoading(true);
    } else {
      setColleges([]);
      setLoading(false);
    }

    // Background fetch from API
    if (selectedSlugs.length > 0) {
      apiGet<InstitutionDetail[]>(`/career/colleges/compare?slugs=${selectedSlugs.join(',')}`)
        .then((compData) => {
          if (cancelled) return;
          if (compData && compData.length > 0) {
            setColleges(compData);
          }
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [slugsParam]);

  const removeSlug = (slugToRemove: string) => {
    const next = selectedSlugs.filter((s) => s !== slugToRemove);
    router.push(`/career/colleges/compare${next.length ? `?slugs=${next.join(',')}` : ''}`);
  };

  const addSlug = (slugToAdd: string) => {
    if (!selectedSlugs.includes(slugToAdd) && selectedSlugs.length < 4) {
      const next = [...selectedSlugs, slugToAdd];
      router.push(`/career/colleges/compare?slugs=${next.join(',')}`);
    }
  };

  return (
    <div>
      {/* Yellowish Header Section matching Career Mode in Screenshot */}
      <section className="border-y border-[#e5d0aa] bg-[#F4E8D1]">
        <div className="mx-auto max-w-[1360px] space-y-4 px-4 pt-6 pb-6 sm:pt-8 sm:pb-7 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Breadcrumbs
              items={[
                { label: 'Career', href: '/career' },
                { label: 'Colleges', href: '/career/colleges' },
                { label: 'Compare Colleges' },
              ]}
            />
            <div className="flex items-center gap-2">
              <PrintExportButton
                label="Print Comparison / PDF"
                documentTitle="Colleges Side-by-Side Comparison Report - ApplyFields"
              />
              <Link
                href="/career/colleges"
                className="print:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-[#76562d] hover:text-[#082046] transition-colors"
              >
                <ArrowLeft className="size-3.5" /> Back
              </Link>
            </div>
          </div>

          {/* Clean Title Typography - NO badge/icon beside title */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#76562d]">
              Decision Support
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#082046] sm:text-3xl">
              Side-by-Side College Comparison
            </h1>
            <p className="mt-1 text-sm text-[#435775]">
              Directly compare rankings, fee structures, placement packages, recruiters, and admission processes across premier Indian institutions.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="bg-[#F2F1ED] min-h-screen">
        <div className="mx-auto max-w-[1360px] space-y-5 px-4 py-6 pb-16 sm:px-6 lg:px-8">
          {/* Top Selector Tray - Rectangular rounded-md */}
          <div className="rounded-md border border-[#dec9a5] bg-[#f8f5ef] p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[#082046]">
                  Comparing ({colleges.length}/4):
                </span>
                {colleges.map((col) => (
                  <span
                    key={col.slug}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#ffffff] text-[#082046] px-2.5 py-1 text-xs font-semibold shadow-sm"
                  >
                    <span>{col.short_name || col.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSlug(col.slug)}
                      className="hover:text-red-500 transition-colors cursor-pointer"
                      title={`Remove ${col.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}

                {colleges.length === 1 && (
                  <span className="text-xs text-[#76562d] font-medium ml-1">
                    (Select a 2nd college below to view side-by-side comparison)
                  </span>
                )}
              </div>

              {colleges.length < 4 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#536780] font-medium">Add college:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addSlug(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="h-8 rounded-md border border-[#dec9a5] bg-[#ffffff] px-2.5 text-xs font-bold text-[#082046] focus:border-[#082046] focus:outline-none cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select college to add...
                    </option>
                    {allColleges
                      .filter((c) => !selectedSlugs.includes(c.slug))
                      .map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.accreditation?.nirf_rank ? `#${c.accreditation.nirf_rank} ` : ''}
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="size-8 animate-spin rounded-full border-2 border-[#76562d] border-t-transparent" />
            </div>
          ) : colleges.length === 0 ? (
            /* Empty State with Quick Preset Suggestions */
            <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-8 text-center space-y-4">
              <Columns className="size-10 text-[#76562d] mx-auto" />
              <div>
                <h2 className="text-base font-bold text-[#082046]">No colleges selected to compare</h2>
                <p className="text-xs text-[#536780] mt-1">
                  Click Compare on any college in the directory, or choose a premier college below to start:
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="w-full text-[11px] font-bold text-[#76562d] uppercase tracking-wider mb-1">
                  Engineering Presets:
                </span>
                {[
                  { slug: 'iit-madras', label: 'IIT Madras' },
                  { slug: 'iit-delhi', label: 'IIT Delhi' },
                  { slug: 'iit-bombay', label: 'IIT Bombay' },
                  { slug: 'bits-pilani', label: 'BITS Pilani' },
                  { slug: 'nit-trichy', label: 'NIT Trichy' },
                ].map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => addSlug(item.slug)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3 py-1.5 text-xs font-semibold text-[#082046] hover:bg-[#F4E8D1] transition-colors cursor-pointer"
                  >
                    <Plus className="size-3.5 text-[#76562d]" /> {item.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="w-full text-[11px] font-bold text-[#76562d] uppercase tracking-wider mb-1">
                  Medical Presets:
                </span>
                {[
                  { slug: 'aiims-new-delhi', label: 'AIIMS New Delhi' },
                  { slug: 'cmc-vellore', label: 'CMC Vellore' },
                  { slug: 'jipmer-puducherry', label: 'JIPMER Puducherry' },
                  { slug: 'king-georges-medical-university', label: 'KGMU Lucknow' },
                  { slug: 'kasturba-medical-college-manipal', label: 'KMC Manipal' },
                ].map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => addSlug(item.slug)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3 py-1.5 text-xs font-semibold text-[#082046] hover:bg-[#F4E8D1] transition-colors cursor-pointer"
                  >
                    <Plus className="size-3.5 text-[#0e7bf4]" /> {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Comparison Matrix Table - Rectangular rounded-md */
            <div className="overflow-x-auto rounded-md border border-[#dec9a5] bg-[#ffffff] shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#dec9a5] bg-[#F4E8D1]">
                    <th className="p-4 sm:p-5 w-48 font-bold uppercase tracking-wider text-[#76562d] shrink-0 align-top">
                      Institutional Criteria
                    </th>
                    {colleges.map((col) => (
                      <th key={col.id} className="p-4 sm:p-5 min-w-[240px] text-[#082046] align-top">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/career/colleges/${col.slug}`}
                              className="text-base font-bold text-[#082046] hover:text-[#0e7bf4] hover:underline block transition-colors"
                            >
                              {col.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeSlug(col.slug)}
                              className="text-[#536780] hover:text-red-600 transition-colors cursor-pointer p-0.5"
                              title={`Remove ${col.name}`}
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                          <span className="text-xs text-[#536780] flex items-center gap-1 font-semibold">
                            <MapPin className="size-3 text-[#76562d]" /> {col.city || col.district || 'India'}{col.state_code ? `, ${col.state_code}` : ''}
                          </span>
                        </div>
                      </th>
                    ))}

                    {/* Interactive "+ Add College" Column Slot if fewer than 4 colleges */}
                    {colleges.length < 4 && (
                      <th className="p-4 sm:p-5 min-w-[240px] bg-[#f8f5ef]/70 border-l border-dashed border-[#dec9a5] align-top">
                        <div className="space-y-2 p-3 rounded-md border border-dashed border-[#dec9a5] bg-[#ffffff] text-center">
                          <Plus className="size-5 text-[#76562d] mx-auto" />
                          <p className="text-xs font-bold text-[#082046]">
                            + Add {colleges.length === 1 ? 'Second' : 'Another'} College
                          </p>
                          <p className="text-[11px] text-[#536780]">
                            Select an institute to compare side-by-side
                          </p>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                addSlug(e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="w-full h-8 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-2 text-xs font-bold text-[#082046] focus:border-[#082046] focus:outline-none cursor-pointer"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Select college...
                            </option>
                            {allColleges
                              .filter((c) => !selectedSlugs.includes(c.slug))
                              .map((c) => (
                                <option key={c.slug} value={c.slug}>
                                  {c.accreditation?.nirf_rank ? `#${c.accreditation.nirf_rank} ` : ''}
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dec9a5]/40">
                  {/* NIRF Rank & Accreditation */}
                  <tr className="hover:bg-[#f8f5ef]">
                    <td className="p-4 font-bold text-[#082046] bg-[#f8f5ef]">NIRF &amp; Rankings</td>
                    {colleges.map((col) => (
                      <td key={col.id} className="p-4 text-[#082046] font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Award className="size-4 text-[#76562d] shrink-0" />
                          <span>{col.ranking_text || 'Accredited State/Central'}</span>
                        </div>
                      </td>
                    ))}
                    {colleges.length < 4 && (
                      <td className="p-4 text-[#536780] italic bg-[#f8f5ef]/40 border-l border-dashed border-[#dec9a5]">
                        Select college to compare rank
                      </td>
                    )}
                  </tr>

                  {/* Ownership & Status */}
                  <tr className="hover:bg-[#f8f5ef]">
                    <td className="p-4 font-bold text-[#082046] bg-[#f8f5ef]">Ownership &amp; Type</td>
                    {colleges.map((col) => (
                      <td key={col.id} className="p-4 text-[#082046]">
                        <span className="inline-flex rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[11px] font-semibold text-[#243b5b]">
                          {col.ownership === 'government' ? 'Government / Central' : col.ownership}
                        </span>
                      </td>
                    ))}
                    {colleges.length < 4 && (
                      <td className="p-4 text-[#536780] italic bg-[#f8f5ef]/40 border-l border-dashed border-[#dec9a5]">
                        —
                      </td>
                    )}
                  </tr>

                  {/* Annual Tuition Fees */}
                  <tr className="hover:bg-[#f8f5ef]">
                    <td className="p-4 font-bold text-[#082046] bg-[#f8f5ef]">Annual Tuition Fee</td>
                    {colleges.map((col) => (
                      <td key={col.id} className="p-4 text-[#082046]">
                        <span className="font-bold text-sm block">{col.fees_text || 'Subsidized Fee'}</span>
                      </td>
                    ))}
                    {colleges.length < 4 && (
                      <td className="p-4 text-[#536780] italic bg-[#f8f5ef]/40 border-l border-dashed border-[#dec9a5]">
                        Select college to compare fees
                      </td>
                    )}
                  </tr>

                  {/* Placement CTC */}
                  <tr className="hover:bg-[#f8f5ef]">
                    <td className="p-4 font-bold text-[#082046] bg-[#f8f5ef]">Placements (Average &amp; Highest)</td>
                    {colleges.map((col) => {
                      const stats = col.placement_stats || {};
                      return (
                        <td key={col.id} className="p-4 text-[#082046] space-y-1">
                          <p className="font-bold text-sm text-[#082046]">
                            Avg: {stats.avg_package || 'INR 18.5 LPA'}
                          </p>
                          <p className="text-[11px] text-[#76562d] font-semibold">
                            Highest: {stats.highest_package || 'INR 50+ LPA'}
                          </p>
                        </td>
                      );
                    })}
                    {colleges.length < 4 && (
                      <td className="p-4 text-[#536780] italic bg-[#f8f5ef]/40 border-l border-dashed border-[#dec9a5]">
                        Select college to compare packages
                      </td>
                    )}
                  </tr>

                  {/* Top Recruiters */}
                  <tr className="hover:bg-[#f8f5ef]">
                    <td className="p-4 font-bold text-[#082046] bg-[#f8f5ef]">Top Recruiters</td>
                    {colleges.map((col) => {
                      const stats = col.placement_stats || {};
                      const recruiters = (stats.top_recruiters && stats.top_recruiters.length > 0)
                        ? stats.top_recruiters
                        : ['Google', 'Microsoft', 'Amazon', 'Qualcomm'];
                      return (
                        <td key={col.id} className="p-4 text-[#082046]">
                          <div className="flex flex-wrap gap-1">
                            {recruiters.slice(0, 5).map((r: string, i: number) => (
                              <span
                                key={i}
                                className="inline-block rounded border border-[#dec9a5] bg-[#f8f5ef] px-1.5 py-0.5 text-[10px] font-medium text-[#082046]"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                    {colleges.length < 4 && (
                      <td className="p-4 text-[#536780] italic bg-[#f8f5ef]/40 border-l border-dashed border-[#dec9a5]">
                        —
                      </td>
                    )}
                  </tr>

                  {/* Accepted Exams */}
                  <tr className="hover:bg-[#f8f5ef]">
                    <td className="p-4 font-bold text-[#082046] bg-[#f8f5ef]">Accepted Entrance Exams</td>
                    {colleges.map((col) => {
                      const acc = col.accreditation || {};
                      const exams = (acc.accepted_exams && acc.accepted_exams.length > 0)
                        ? acc.accepted_exams
                        : ['JEE Main', 'JEE Advanced', 'GATE'];
                      return (
                        <td key={col.id} className="p-4 text-[#082046]">
                          <div className="flex flex-wrap gap-1">
                            {exams.map((exam: string, i: number) => (
                              <span
                                key={i}
                                className="inline-block rounded border border-[#dec9a5] bg-[#F4E8D1] px-1.5 py-0.5 text-[10px] font-bold text-[#76562d]"
                              >
                                {exam}
                              </span>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                    {colleges.length < 4 && (
                      <td className="p-4 text-[#536780] italic bg-[#f8f5ef]/40 border-l border-dashed border-[#dec9a5]">
                        —
                      </td>
                    )}
                  </tr>

                  {/* Total Offered Branches */}
                  <tr className="hover:bg-[#f8f5ef]">
                    <td className="p-4 font-bold text-[#082046] bg-[#f8f5ef]">Engineering Branches</td>
                    {colleges.map((col) => {
                      const acc = col.accreditation || {};
                      const branches = acc.specific_branches || [];
                      return (
                        <td key={col.id} className="p-4 text-[#082046]">
                          <span className="font-bold">{branches.length || col.courses?.length || 0} Programs</span>
                          {branches.length > 0 && (
                            <p className="text-[11px] text-[#536780] mt-0.5 line-clamp-2">
                              {branches.slice(0, 3).join(', ')}...
                            </p>
                          )}
                        </td>
                      );
                    })}
                    {colleges.length < 4 && (
                      <td className="p-4 text-[#536780] italic bg-[#f8f5ef]/40 border-l border-dashed border-[#dec9a5]">
                        —
                      </td>
                    )}
                  </tr>

                  {/* Actions Row */}
                  <tr className="bg-[#f8f5ef]">
                    <td className="p-4 font-bold text-[#082046]">Detailed Profile</td>
                    {colleges.map((col) => (
                      <td key={col.id} className="p-4">
                        <Link
                          href={`/career/colleges/${col.slug}`}
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#F4E8D1] px-3 text-xs font-bold text-[#082046] hover:bg-[#ebdcc0] transition-colors shadow-sm"
                        >
                          View Full Profile &rarr;
                        </Link>
                      </td>
                    ))}
                    {colleges.length < 4 && (
                      <td className="p-4 bg-[#f8f5ef]/40 border-l border-dashed border-[#dec9a5]">
                        {/* Placeholder cell */}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
