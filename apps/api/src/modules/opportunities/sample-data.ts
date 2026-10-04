/**
 * SAMPLE DATA ONLY — lets the website show real-looking pages before the database is wired up.
 * Dates are relative to today so "closes in N days" always looks right.
 * Replace with Prisma queries in Week 2–3 (opportunities module).
 */
import type { OpportunityCard, UpdateItem } from '@applyfields/types';

const DAY_MS = 86_400_000;

export function isoDate(daysFromToday: number): string {
  return new Date(Date.now() + daysFromToday * DAY_MS).toISOString().slice(0, 10);
}

type Seed = Omit<OpportunityCard, 'last_date' | 'days_left'> & { closes_in: number | null };

const SEEDS: Seed[] = [
  // ---------- government jobs
  { slug: 'ssc-cgl-2026', type: 'govt_job', title: 'Combined Graduate Level Examination 2026', organization: 'Staff Selection Commission (SSC)', location: 'All India', qualification: 'Graduate', vacancies: 7500, tags: ['SSC CGL', 'Central Govt'], closes_in: 6 },
  { slug: 'rrb-ntpc-graduate-2026', type: 'govt_job', title: 'Non-Technical Popular Categories (Graduate)', organization: 'Railway Recruitment Boards (RRB)', location: 'All India', qualification: 'Graduate', vacancies: 8100, tags: ['RRB NTPC', 'Railways'], closes_in: 3 },
  { slug: 'ibps-po-2026', type: 'govt_job', title: 'Probationary Officers / Management Trainees', organization: 'IBPS', location: 'All India', qualification: 'Graduate', vacancies: 4400, tags: ['IBPS PO', 'Banking'], closes_in: 9 },
  { slug: 'appsc-group-2-2026', type: 'govt_job', title: 'Group II Services', organization: 'Andhra Pradesh Public Service Commission (APPSC)', location: 'Andhra Pradesh', qualification: 'Graduate', vacancies: 900, tags: ['APPSC Group 2', 'State Govt'], closes_in: 12 },
  { slug: 'tspsc-group-4-2026', type: 'govt_job', title: 'Group IV Services', organization: 'Telangana State Public Service Commission (TSPSC)', location: 'Telangana', qualification: '12th pass', vacancies: 8000, tags: ['TSPSC Group 4', 'State Govt'], closes_in: 20 },
  { slug: 'ap-police-constable-2026', type: 'govt_job', title: 'Police Constable (Civil)', organization: 'AP State Level Police Recruitment Board', location: 'Andhra Pradesh', qualification: '12th pass', vacancies: 6100, tags: ['Police', 'State Govt'], closes_in: 25 },
  { slug: 'ts-district-court-2026', type: 'govt_job', title: 'Office Subordinate — District Courts', organization: 'High Court for the State of Telangana', location: 'Telangana', qualification: '10th pass', vacancies: 1200, tags: ['District Recruitment'], closes_in: 15 },

  // ---------- exams
  { slug: 'jee-main-2027-session-1', type: 'exam', title: 'JEE Main 2027 — Session 1', organization: 'National Testing Agency (NTA)', location: 'All India', qualification: '12th (MPC)', vacancies: null, tags: ['JEE', 'Engineering'], closes_in: 18 },
  { slug: 'neet-ug-2027', type: 'exam', title: 'NEET (UG) 2027', organization: 'National Testing Agency (NTA)', location: 'All India', qualification: '12th (BiPC)', vacancies: null, tags: ['NEET', 'Medical'], closes_in: 40 },
  { slug: 'cuet-ug-2027', type: 'exam', title: 'CUET (UG) 2027', organization: 'National Testing Agency (NTA)', location: 'All India', qualification: '12th pass', vacancies: null, tags: ['CUET', 'Central Universities'], closes_in: 30 },
  { slug: 'cat-2026', type: 'exam', title: 'Common Admission Test (CAT) 2026', organization: 'Indian Institutes of Management', location: 'All India', qualification: 'Graduate', vacancies: null, tags: ['CAT', 'MBA'], closes_in: 2 },
  { slug: 'upsc-cse-2027', type: 'exam', title: 'Civil Services (Preliminary) Examination 2027', organization: 'Union Public Service Commission (UPSC)', location: 'All India', qualification: 'Graduate', vacancies: null, tags: ['UPSC', 'IAS'], closes_in: 60 },

  // ---------- scholarships
  { slug: 'nsp-post-matric-minorities', type: 'scholarship', title: 'Post-Matric Scholarship for Minorities', organization: 'National Scholarship Portal (NSP)', location: 'All India', qualification: 'Class 11 to PhD', vacancies: null, tags: ['NSP', 'Minority'], closes_in: 21 },
  { slug: 'central-sector-scholarship', type: 'scholarship', title: 'Central Sector Scheme of Scholarship', organization: 'Ministry of Education (via NSP)', location: 'All India', qualification: 'College students', vacancies: null, tags: ['NSP', 'Merit'], closes_in: 45 },
  { slug: 'ts-epass-post-matric', type: 'scholarship', title: 'ePASS Post-Matric Scholarship', organization: 'Government of Telangana', location: 'Telangana', qualification: '12th and above', vacancies: null, tags: ['State', 'SC/ST/BC'], closes_in: 35 },
  { slug: 'ap-post-matric-scholarship', type: 'scholarship', title: 'Post-Matric Scholarship', organization: 'Government of Andhra Pradesh', location: 'Andhra Pradesh', qualification: '12th and above', vacancies: null, tags: ['State'], closes_in: 28 },

  // ---------- admissions
  { slug: 'ap-eapcet-2027-counselling', type: 'admission', title: 'EAPCET 2027 — Engineering Counselling', organization: 'APSCHE', location: 'Andhra Pradesh', qualification: '12th (MPC)', vacancies: null, tags: ['B.Tech'], closes_in: 50 },
  { slug: 'ts-icet-2027', type: 'admission', title: 'ICET 2027 — MBA / MCA Admissions', organization: 'TSCHE', location: 'Telangana', qualification: 'Graduate', vacancies: null, tags: ['MBA', 'MCA'], closes_in: 55 },
  { slug: 'ap-polycet-2027', type: 'admission', title: 'POLYCET 2027 — Polytechnic Diploma Admissions', organization: 'SBTET Andhra Pradesh', location: 'Andhra Pradesh', qualification: '10th pass', vacancies: null, tags: ['Diploma'], closes_in: 70 },
];

export function sampleOpportunities(): OpportunityCard[] {
  return SEEDS.map(({ closes_in, ...card }) => ({
    ...card,
    last_date: closes_in === null ? null : isoDate(closes_in),
    days_left: closes_in,
  }));
}

export function sampleUpdates(): UpdateItem[] {
  return [
    { id: 'u1', kind: 'admit_card', title: 'Admit card released — CBT 1', organization: 'RRB NTPC (Graduate)', date: isoDate(0), opportunity_slug: 'rrb-ntpc-graduate-2026' },
    { id: 'u2', kind: 'extension', title: 'Last date extended for applications', organization: 'IBPS PO / MT', date: isoDate(-1), opportunity_slug: 'ibps-po-2026' },
    { id: 'u3', kind: 'correction_window', title: 'Correction window open', organization: 'JEE Main 2027 — Session 1', date: isoDate(-1), opportunity_slug: 'jee-main-2027-session-1' },
    { id: 'u4', kind: 'answer_key', title: 'Provisional answer key published', organization: 'SSC CGL Tier 1', date: isoDate(-2), opportunity_slug: 'ssc-cgl-2026' },
    { id: 'u5', kind: 'result', title: 'Result declared — Mains', organization: 'APPSC Group I', date: isoDate(-3), opportunity_slug: null },
  ];
}
