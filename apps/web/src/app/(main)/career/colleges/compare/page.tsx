'use client';

import { useEffect, useState, use } from 'react';
import type { InstitutionDetail, InstitutionSummary } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, PageHeader } from '@applyfields/ui';
import {
  ArrowLeft,
  Award,
  Building,
  CheckCircle2,
  Columns,
  ExternalLink,
  GraduationCap,
  MapPin,
  Plus,
  TrendingUp,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api';

export default function CollegeComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const slugsParam = searchParams.get('slugs') || 'iit-madras,bits-pilani';
  const selectedSlugs = slugsParam.split(',').map((s) => s.trim()).filter(Boolean);

  const [colleges, setColleges] = useState<InstitutionDetail[]>([]);
  const [allColleges, setAllColleges] = useState<InstitutionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [compData, allList] = await Promise.all([
          apiGet<InstitutionDetail[]>(`/career/colleges/compare?slugs=${selectedSlugs.join(',')}`),
          apiGet<InstitutionSummary[]>('/career/colleges'),
        ]);

        if (compData) setColleges(compData);
        if (allList) setAllColleges(allList);
      } catch (err) {
        console.error('Failed to load comparison data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slugsParam]);

  const removeSlug = (slugToRemove: string) => {
    const next = selectedSlugs.filter((s) => s !== slugToRemove);
    router.push(`/career/colleges/compare?slugs=${next.join(',')}`);
  };

  const addSlug = (slugToAdd: string) => {
    if (!selectedSlugs.includes(slugToAdd) && selectedSlugs.length < 4) {
      const next = [...selectedSlugs, slugToAdd];
      router.push(`/career/colleges/compare?slugs=${next.join(',')}`);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <Link
          href="/career/colleges"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal/70 hover:text-teal"
        >
          <ArrowLeft className="size-3.5" /> Back to colleges
        </Link>
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          eyebrow="Decision Support"
          title="Side-by-Side College Comparison"
          description="Directly compare rankings, fee structures, placement packages, recruiters, and admission processes across premier Indian institutions."
          icon={<Columns />}
        />
      </div>

      {/* Selector Pill Tray */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-teal">Comparing ({colleges.length}/4):</span>
            {colleges.map((col) => (
              <span
                key={col.slug}
                className="inline-flex items-center gap-1.5 rounded-full bg-teal text-cream px-3 py-1 text-xs font-semibold shadow-sm"
              >
                {col.short_name || col.name}
                {colleges.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlug(col.slug)}
                    className="hover:opacity-80"
                    title="Remove college"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {colleges.length < 4 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-teal/70 font-medium">Add to compare:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addSlug(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="rounded-xl border border-line bg-canvas px-3 py-1 text-xs font-bold text-teal focus:border-teal focus:outline-none"
                defaultValue=""
              >
                <option value="" disabled>
                  Select college...
                </option>
                {allColleges
                  .filter((c) => !selectedSlugs.includes(c.slug))
                  .map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        </div>
      ) : colleges.length === 0 ? (
        <Card className="p-8 text-center text-teal">
          <p className="text-sm font-semibold">No colleges selected to compare.</p>
        </Card>
      ) : (
        /* Comparison Matrix Table */
        <div className="overflow-x-auto rounded-3xl border border-line/60 bg-canvas shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-cream/40">
                <th className="p-4 sm:p-5 w-44 font-bold uppercase tracking-wider text-teal/70 shrink-0">
                  Parameter
                </th>
                {colleges.map((col) => (
                  <th key={col.id} className="p-4 sm:p-5 min-w-[240px] text-teal">
                    <div className="space-y-1">
                      <Link
                        href={`/career/colleges/${col.slug}`}
                        className="text-base font-extrabold hover:underline block"
                      >
                        {col.name}
                      </Link>
                      <span className="text-xs text-teal/70 flex items-center gap-1 font-semibold">
                        <MapPin className="size-3 text-teal/50" /> {col.city}, {col.state_code}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {/* NIRF Rank & Accreditation */}
              <tr className="hover:bg-cream/20">
                <td className="p-4 font-bold text-teal bg-cream/30">NIRF & Rankings</td>
                {colleges.map((col) => (
                  <td key={col.id} className="p-4 text-teal font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Award className="size-4 text-celadon shrink-0" />
                      <span>{col.ranking_text || 'Accredited State/Central'}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Ownership & Status */}
              <tr className="hover:bg-cream/20">
                <td className="p-4 font-bold text-teal bg-cream/30">Ownership</td>
                {colleges.map((col) => (
                  <td key={col.id} className="p-4 text-teal">
                    <Badge tone="tea" className="text-[11px] uppercase">
                      {col.ownership === 'government' ? 'Government / Central' : col.ownership}
                    </Badge>
                  </td>
                ))}
              </tr>

              {/* Annual Tuition Fees */}
              <tr className="hover:bg-cream/20">
                <td className="p-4 font-bold text-teal bg-cream/30">Annual Tuition Fee</td>
                {colleges.map((col) => (
                  <td key={col.id} className="p-4 text-teal">
                    <span className="font-extrabold text-sm block">{col.fees_text}</span>
                  </td>
                ))}
              </tr>

              {/* Average Placement Package */}
              <tr className="hover:bg-cream/20 bg-tea/10">
                <td className="p-4 font-bold text-teal bg-cream/30">Average Placement</td>
                {colleges.map((col) => (
                  <td key={col.id} className="p-4 text-teal">
                    <span className="font-extrabold text-base text-teal block">
                      {col.placement_stats?.avg_package || 'Industry standard'}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Highest Placement Package */}
              <tr className="hover:bg-cream/20">
                <td className="p-4 font-bold text-teal bg-cream/30">Highest Package</td>
                {colleges.map((col) => (
                  <td key={col.id} className="p-4 text-teal font-semibold">
                    {col.placement_stats?.highest_package || 'N/A'}
                  </td>
                ))}
              </tr>

              {/* Top Recruiters */}
              <tr className="hover:bg-cream/20">
                <td className="p-4 font-bold text-teal bg-cream/30">Top Recruiters</td>
                {colleges.map((col) => (
                  <td key={col.id} className="p-4 text-teal">
                    <div className="flex flex-wrap gap-1">
                      {col.placement_stats?.top_recruiters?.map((rec, rIdx) => (
                        <span
                          key={rIdx}
                          className="rounded-md bg-canvas px-2 py-0.5 text-[11px] font-medium border border-line/60"
                        >
                          {rec}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Campus Facilities */}
              <tr className="hover:bg-cream/20">
                <td className="p-4 font-bold text-teal bg-cream/30">Campus Infrastructure</td>
                {colleges.map((col) => (
                  <td key={col.id} className="p-4 text-teal">
                    <ul className="space-y-1">
                      {col.campus_facilities?.map((fac, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-1.5 text-[11px] text-teal/80">
                          <CheckCircle2 className="size-3 text-celadon shrink-0" />
                          <span>{fac}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              {/* Programs Count */}
              <tr className="hover:bg-cream/20">
                <td className="p-4 font-bold text-teal bg-cream/30">Available Degrees</td>
                {colleges.map((col) => (
                  <td key={col.id} className="p-4 text-teal">
                    <span className="font-bold text-xs">{col.courses.length} Programmes</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {col.courses.map((c) => (
                        <Link
                          key={c.id}
                          href={`/career/courses/${c.slug}`}
                          className="rounded bg-cream px-1.5 py-0.5 text-[10px] font-semibold text-teal hover:underline"
                        >
                          {c.short_name || c.name}
                        </Link>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Action Buttons */}
              <tr className="bg-canvas">
                <td className="p-4 font-bold text-teal bg-cream/30">Official Profile</td>
                {colleges.map((col) => (
                  <td key={col.id} className="p-4">
                    <Link
                      href={`/career/colleges/${col.slug}`}
                      className={buttonClass({ variant: 'primary', size: 'sm', className: 'w-full text-center shadow-clay' })}
                    >
                      View College Profile
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
