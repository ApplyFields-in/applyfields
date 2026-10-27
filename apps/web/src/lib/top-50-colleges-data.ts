import type { InstitutionDetail, InstitutionSummary } from '@applyfields/types';
import rawData from './top-50-colleges.json';

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

export const TOP_50_COLLEGES: InstitutionDetail[] = (rawData as TopCollegeRaw[]).map((c) => {
  // Generate structured courses from specific branches & course text
  const courses = (c.accreditation.specific_branches || []).slice(0, 12).map((branch, idx) => {
    const isPg = branch.includes('M.Tech') || branch.includes('M.Sc') || branch.includes('MBA');
    const branchSlug = branch
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return {
      id: `${c.id}-c${idx + 1}`,
      slug: branchSlug || `course-${idx + 1}`,
      name: branch,
      short_name: branch.replace(/B\.Tech\.\s*in\s*/i, '').replace(/B\.E\.\s*in\s*/i, ''),
      level: isPg ? 'pg' : 'ug',
      seats: 60 + (idx % 4) * 30,
      fee_per_year: c.fees_text.includes('8') ? 200000 : c.fees_text.includes('1') ? 100000 : 250000,
      fees_text: c.fees_text,
      admission_process: `Admission via ${c.accreditation.accepted_exams?.[0] || 'Entrance Exam'} with merit counselling`,
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
});

/** Lookup top 50 college by slug */
export function getTop50CollegeBySlug(slug: string): InstitutionDetail | undefined {
  if (!slug) return undefined;
  const target = slug.trim().toLowerCase();
  return TOP_50_COLLEGES.find((c) => c.slug.toLowerCase() === target);
}

/**
 * Get 3-4 similar engineering colleges based on rank tier, institution type,
 * or cluster (IITs together, NITs together, top private together).
 */
export function getSimilarColleges(currentSlug: string, limit = 4): InstitutionSummary[] {
  const current = getTop50CollegeBySlug(currentSlug);
  if (!current) {
    return TOP_50_COLLEGES.slice(0, limit);
  }

  const currentRank = (current.accreditation?.nirf_rank as number) || 1;
  const isIit = current.name.toLowerCase().includes('iit') || current.name.toLowerCase().includes('indian institute of technology');
  const isNit = current.name.toLowerCase().includes('nit') || current.name.toLowerCase().includes('national institute of technology');
  const isPrivate = current.ownership === 'private';

  // Filter out the current college
  const pool = TOP_50_COLLEGES.filter((c) => c.slug !== currentSlug);

  // Score candidate colleges by similarity
  const scored = pool.map((item) => {
    let score = 0;
    const itemRank = (item.accreditation?.nirf_rank as number) || 50;
    const itemIsIit = item.name.toLowerCase().includes('iit') || item.name.toLowerCase().includes('indian institute of technology');
    const itemIsNit = item.name.toLowerCase().includes('nit') || item.name.toLowerCase().includes('national institute of technology');
    const itemIsPrivate = item.ownership === 'private';

    // Same category gets strong boost
    if (isIit && itemIsIit) score += 30;
    if (isNit && itemIsNit) score += 30;
    if (isPrivate && itemIsPrivate) score += 25;

    // Same state bonus
    if (current.state_code && item.state_code === current.state_code) {
      score += 15;
    }

    // Rank closeness bonus (up to 20 points)
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

  return TOP_50_COLLEGES.filter((c) => {
    if (normStream === 'top-50-engg' || normStream === 'top-50' || normStream === 'engineering') {
      // Top 50 are all engineering
    } else if (normStream === 'management' || normStream === 'mba') {
      const isMgmt = c.name.toLowerCase().includes('management') || (c.accreditation?.specific_branches || []).some((b: string) => b.toLowerCase().includes('mba'));
      if (!isMgmt) return false;
    } else if (normStream === 'polytechnic' || normStream === 'diploma') {
      const isPoly = c.name.toLowerCase().includes('polytechnic') || (c.accreditation?.specific_branches || []).some((b: string) => b.toLowerCase().includes('diploma'));
      if (!isPoly) return false;
    } else if (normStream === 'architecture') {
      const isArch = c.name.toLowerCase().includes('architecture') || (c.accreditation?.specific_branches || []).some((b: string) => b.toLowerCase().includes('arch'));
      if (!isArch) return false;
    } else if (normStream === 'pharmacy') {
      const isPharm = c.name.toLowerCase().includes('pharmacy') || (c.accreditation?.specific_branches || []).some((b: string) => b.toLowerCase().includes('pharm'));
      if (!isPharm) return false;
    }

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
