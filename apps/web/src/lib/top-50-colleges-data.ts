import type { InstitutionDetail, InstitutionSummary } from '@applyfields/types';
import rawData from './top-50-colleges.json';
import rawMedicalData from './top-50-medical-colleges.json';

export interface TopCollegeRaw {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  type: string;
  ownership: string;
  state_code: string;
  district: string;
  city: string;
  address: string;
  established_year: number;
  website: string;
  ranking_text: string;
  fees_text: string;
  description: string;
  status: string;
  campus_facilities: string[];
  accreditation: {
    nirf_rank: number;
    nirf_rank_text: string;
    nirf_category: string;
    institute_type_raw: string;
    established_text: string;
    source_url: string;
    specific_branches: string[];
    admissions_details: string;
    accepted_exams: string[];
    cutoff_details: string;
    rankings_details: string;
    courses_details: string;
    campus_scholarships_details: string;
    location_shown: string;
  };
  placement_stats: {
    avg_package: string;
    highest_package: string;
    top_recruiters: string[];
    details: string;
  };
}

function mapRawToDetail(c: TopCollegeRaw, defaultStream: 'Engineering' | 'Medical' = 'Engineering'): InstitutionDetail {
  const isMed = defaultStream === 'Medical' || c.accreditation?.nirf_category === 'Medical';
  const courses = (c.accreditation.specific_branches || []).slice(0, 12).map((branch, idx) => {
    const isPg = branch.includes('M.Tech') || branch.includes('M.Sc') || branch.includes('MBA') || branch.includes('MD') || branch.includes('MS') || branch.includes('DM') || branch.includes('M.Ch');
    const branchSlug = branch
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return {
      id: `${c.id}-c${idx + 1}`,
      slug: branchSlug || `course-${idx + 1}`,
      name: branch,
      short_name: branch
        .replace(/B\.Tech\.\s*in\s*/i, '')
        .replace(/B\.E\.\s*in\s*/i, '')
        .replace(/MD\s*in\s*/i, 'MD ')
        .replace(/MS\s*in\s*/i, 'MS '),
      level: isPg ? 'pg' : 'ug',
      seats: isMed ? (isPg ? 15 : 150) : (60 + (idx % 4) * 30),
      fee_per_year: isMed
        ? (c.ownership === 'government' ? 15000 : 1650000)
        : (c.fees_text.includes('8') ? 200000 : c.fees_text.includes('1') ? 100000 : 250000),
      fees_text: c.fees_text,
      admission_process: `Admission via ${c.accreditation.accepted_exams?.[0] || (isMed ? 'NEET UG' : 'Entrance Exam')} with merit counselling`,
    };
  });

  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    short_name: c.short_name,
    type: c.type,
    ownership: c.ownership,
    state_code: c.state_code,
    city: c.city,
    district: c.district,
    website: c.website,
    ranking_text: c.ranking_text,
    fees_text: c.fees_text,
    description: c.description,
    established_year: c.established_year,
    accreditation: c.accreditation,
    placement_stats: c.placement_stats,
    campus_facilities: c.campus_facilities,
    courses_count: courses.length || 8,
    courses,
  };
}

export const TOP_50_ENGINEERING_COLLEGES: InstitutionDetail[] = (rawData as TopCollegeRaw[]).map((c) =>
  mapRawToDetail(c, 'Engineering'),
);

export const TOP_50_MEDICAL_COLLEGES: InstitutionDetail[] = (rawMedicalData as TopCollegeRaw[]).map((c) =>
  mapRawToDetail(c, 'Medical'),
);

export const TOP_50_COLLEGES: InstitutionDetail[] = [
  ...TOP_50_ENGINEERING_COLLEGES,
  ...TOP_50_MEDICAL_COLLEGES,
];

/** Lookup top 50 college by slug */
export function getTop50CollegeBySlug(slug: string): InstitutionDetail | undefined {
  if (!slug) return undefined;
  const target = slug.trim().toLowerCase();
  return TOP_50_COLLEGES.find((c) => c.slug.toLowerCase() === target);
}

/**
 * Get 3-4 similar colleges based on rank tier, institution type,
 * or cluster (IITs together, NITs together, AIIMS together, top private together).
 */
export function getSimilarColleges(currentSlug: string, limit = 4): InstitutionSummary[] {
  const current = getTop50CollegeBySlug(currentSlug);
  if (!current) {
    return TOP_50_COLLEGES.slice(0, limit);
  }

  const isMedical =
    current.accreditation?.nirf_category === 'Medical' ||
    current.name.toLowerCase().includes('medical') ||
    current.name.toLowerCase().includes('aiims');

  const pool = (isMedical ? TOP_50_MEDICAL_COLLEGES : TOP_50_ENGINEERING_COLLEGES).filter(
    (c) => c.slug !== currentSlug,
  );

  const currentRank = (current.accreditation?.nirf_rank as number) || 1;
  const isIit = current.name.toLowerCase().includes('iit') || current.name.toLowerCase().includes('indian institute of technology');
  const isNit = current.name.toLowerCase().includes('nit') || current.name.toLowerCase().includes('national institute of technology');
  const isAiims = current.name.toLowerCase().includes('aiims');
  const isPrivate = current.ownership === 'private';

  const scored = pool.map((item) => {
    let score = 0;
    const itemRank = (item.accreditation?.nirf_rank as number) || 50;
    const itemIsIit = item.name.toLowerCase().includes('iit') || item.name.toLowerCase().includes('indian institute of technology');
    const itemIsNit = item.name.toLowerCase().includes('nit') || item.name.toLowerCase().includes('national institute of technology');
    const itemIsAiims = item.name.toLowerCase().includes('aiims');
    const itemIsPrivate = item.ownership === 'private';

    if (isAiims && itemIsAiims) score += 35;
    if (isIit && itemIsIit) score += 30;
    if (isNit && itemIsNit) score += 30;
    if (isPrivate && itemIsPrivate) score += 25;
    if (!isPrivate && !itemIsPrivate) score += 20;

    if (current.state_code && item.state_code === current.state_code) {
      score += 15;
    }

    const rankDiff = Math.abs(currentRank - itemRank);
    score += Math.max(0, 20 - rankDiff * 1.5);

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}

/** Filter top 50 colleges */
export function filterTop50Colleges(
  q?: string,
  type?: string,
  state?: string,
  stream?: string,
): InstitutionSummary[] {
  const normStream = stream?.trim().toLowerCase();

  let targetList: InstitutionDetail[] = TOP_50_COLLEGES;
  if (normStream === 'top-50-engg' || normStream === 'top-50' || normStream === 'engineering') {
    targetList = TOP_50_ENGINEERING_COLLEGES;
  } else if (normStream === 'medical' || normStream === 'top-50-medical' || normStream === 'top-50-med') {
    targetList = TOP_50_MEDICAL_COLLEGES;
  } else if (normStream === 'management' || normStream === 'mba') {
    targetList = TOP_50_COLLEGES.filter((c) =>
      c.name.toLowerCase().includes('management') || (c.accreditation?.specific_branches || []).some((b: string) => b.toLowerCase().includes('mba')),
    );
  } else if (normStream === 'polytechnic' || normStream === 'diploma') {
    targetList = TOP_50_COLLEGES.filter((c) =>
      c.name.toLowerCase().includes('polytechnic') || (c.accreditation?.specific_branches || []).some((b: string) => b.toLowerCase().includes('diploma')),
    );
  } else if (normStream === 'architecture') {
    targetList = TOP_50_COLLEGES.filter((c) =>
      c.name.toLowerCase().includes('architecture') || (c.accreditation?.specific_branches || []).some((b: string) => b.toLowerCase().includes('arch')),
    );
  } else if (normStream === 'pharmacy') {
    targetList = TOP_50_COLLEGES.filter((c) =>
      c.name.toLowerCase().includes('pharmacy') || (c.accreditation?.specific_branches || []).some((b: string) => b.toLowerCase().includes('pharm')),
    );
  }

  return targetList.filter((c) => {
    if (type && c.type !== type && c.accreditation?.institute_type_raw !== type) {
      return false;
    }
    if (state && c.state_code !== state) {
      return false;
    }
    if (q) {
      const query = q.toLowerCase();
      const matchName = c.name.toLowerCase().includes(query);
      const matchShort = c.short_name?.toLowerCase().includes(query);
      const matchCity = c.city?.toLowerCase().includes(query);
      const matchDistrict = c.district?.toLowerCase().includes(query);
      const matchRank = c.ranking_text?.toLowerCase().includes(query);
      const matchBranch = (c.accreditation?.specific_branches || []).some((b: string) =>
        b.toLowerCase().includes(query),
      );
      if (!matchName && !matchShort && !matchCity && !matchDistrict && !matchRank && !matchBranch) {
        return false;
      }
    }
    return true;
  });
}
