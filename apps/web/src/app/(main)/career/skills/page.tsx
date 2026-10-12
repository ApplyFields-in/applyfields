'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  Search,
  Code2,
  Landmark,
  Cpu,
  TrendingUp,
  Stethoscope,
  ArrowRight,
  BookOpen,
  Route,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface SkillItem {
  id: string;
  name: string;
  domain: string;
  demand: 'Crucial' | 'High Growth' | 'Foundational';
  description: string;
  careers: string[];
  learningSource: string;
}

const SKILL_ITEMS: SkillItem[] = [
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    domain: 'Tech & Software',
    demand: 'Crucial',
    description: 'Fundamental problem solving, memory optimization, graph theory, and algorithmic complexity for software roles.',
    careers: ['Software Engineer', 'Backend Developer', 'Machine Learning Engineer'],
    learningSource: 'LeetCode, NeetCode 150, MIT OpenCourseWare',
  },
  {
    id: 'public_policy',
    name: 'Public Administration & Constitutional Law',
    domain: 'Civil Services & Governance',
    demand: 'Crucial',
    description: 'Constitutional framework, parliamentary procedures, public governance ethics, and policy formulation.',
    careers: ['IAS Officer', 'IPS Officer', 'Public Policy Analyst'],
    learningSource: 'M. Laxmikanth Indian Polity, PRS Legislative Research',
  },
  {
    id: 'system_design',
    name: 'Distributed Systems & Cloud Architecture',
    domain: 'Tech & Software',
    demand: 'High Growth',
    description: 'Scalable service topology, microservices, load balancing, relational vs NoSQL caching strategies.',
    careers: ['Software Engineer', 'Solutions Architect', 'DevOps Engineer'],
    learningSource: 'Designing Data-Intensive Applications (Kleppmann)',
  },
  {
    id: 'quant_aptitude',
    name: 'Quantitative Aptitude & Data Interpretation',
    domain: 'Civil Services & Governance',
    demand: 'Foundational',
    description: 'Mathematical problem solving, statistics, probability, and numerical reasoning tested in competitive government exams.',
    careers: ['SSC CGL Officer', 'Bank PO', 'RBI Grade B Officer'],
    learningSource: 'RS Aggarwal Quantitative Aptitude, Oliveboard',
  },
  {
    id: 'financial_modeling',
    name: 'Financial Modeling & Valuation',
    domain: 'Finance & Markets',
    demand: 'High Growth',
    description: 'Discounted cash flow, three-statement modeling, risk evaluation, and investment banking analysis.',
    careers: ['Investment Banker', 'Chartered Accountant', 'Financial Analyst'],
    learningSource: 'CFI Financial Modeling, Zerodha Varsity',
  },
  {
    id: 'clinical_medicine',
    name: 'Clinical Diagnostics & Patient Care',
    domain: 'Healthcare & Medicine',
    demand: 'Crucial',
    description: 'Differential diagnosis, pathology evaluation, pharmacological therapy, and emergency care.',
    careers: ['Physician (MBBS)', 'Surgeon', 'Clinical Researcher'],
    learningSource: 'Harrison’s Principles of Internal Medicine, Marrow',
  },
];

const DOMAINS = [
  { id: 'all', label: 'All Domains' },
  { id: 'Tech & Software', label: 'Tech & Software' },
  { id: 'Civil Services & Governance', label: 'Governance & Civil Services' },
  { id: 'Finance & Markets', label: 'Finance & Banking' },
  { id: 'Healthcare & Medicine', label: 'Healthcare' },
];

export default function SkillsPage() {
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSkills = SKILL_ITEMS.filter((skill) => {
    if (selectedDomain !== 'all' && skill.domain !== selectedDomain) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q) ||
        skill.careers.some((c) => c.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
            <Lightbulb className="size-4" />
            <span>Career Mode · Skills &amp; Competencies</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
            Skills Explorer
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#435775]">
            Discover critical competencies, entrance exam syllabi, and practice trajectories needed across engineering, administrative services, finance, and medicine.
          </p>
        </div>

        <div>
          <Link
            href="/career/roadmaps"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#061835]"
          >
            <Route className="size-4 text-[#0e7bf4]" /> View Career Roadmaps
          </Link>
        </div>
      </div>

      {/* Search & Domain Filter */}
      <div className="rounded-2xl border border-[#c4d2e3] bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-4 py-2.5">
            <Search className="mr-3 size-4 text-[#536780]" />
            <input
              type="text"
              placeholder="Search skills, topics, or career keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-[#082046] outline-none placeholder:text-[#71839b]"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {DOMAINS.map((dom) => (
              <button
                key={dom.id}
                type="button"
                onClick={() => setSelectedDomain(dom.id)}
                className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  selectedDomain === dom.id
                    ? 'bg-[#082046] text-white shadow-sm'
                    : 'bg-[#F0F4F8] text-[#435775] hover:bg-[#e2eaf4] hover:text-[#082046]'
                }`}
              >
                {dom.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSkills.map((skill) => {
          const demandColor =
            skill.demand === 'Crucial'
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : skill.demand === 'High Growth'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200';

          return (
            <div
              key={skill.id}
              className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm transition hover:border-[#91a8c7] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#536780]">
                    {skill.domain}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${demandColor}`}>
                    {skill.demand}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#082046] leading-snug">
                  {skill.name}
                </h3>

                <p className="text-xs text-[#536780] leading-relaxed">
                  {skill.description}
                </p>

                <div className="border-t border-slate-100 pt-3 space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#082046]">
                    Direct Career Pathways:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skill.careers.map((c) => (
                      <span
                        key={c}
                        className="rounded-md bg-[#F0F4F8] px-2 py-0.5 text-[11px] font-medium text-[#243b5b]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-[#536780] bg-[#F8FBFF] border border-[#dce7f3] rounded-lg p-2.5">
                  <strong>Recommended Source:</strong> {skill.learningSource}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <Link
                  href={`/career?q=${encodeURIComponent(skill.name)}`}
                  className="flex items-center justify-between text-xs font-semibold text-[#0e7bf4] hover:underline"
                >
                  <span>Explore matching careers</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
