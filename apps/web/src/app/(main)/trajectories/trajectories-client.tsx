'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  Milestone,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Target,
  Trophy,
  Zap,
  ArrowRight,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@applyfields/ui';
import { PrintExportButton } from '@/components/print-export-button';

export interface MilestoneItem {
  id: string;
  phase: 'foundation' | 'reference' | 'writing_pyq' | 'mocks';
  title: string;
  description: string;
  estimatedHours: number;
  recommendedSources: string[];
}

export interface OverlapTarget {
  examId: string;
  examName: string;
  examCategory: string;
  overlapPercentage: number;
  preparationSynergy: 'Very High' | 'High' | 'Moderate';
  gapBridgeDays: number;
  sharedModules: string[];
  exclusiveModules: string[];
  strategicAdvice: string;
}

export interface TrajectoryExam {
  id: string;
  slug: string;
  name: string;
  fullName: string;
  authority: string;
  category: 'civil_services' | 'staff_selection' | 'railways' | 'banking' | 'defense';
  categoryLabel: string;
  frequency: string;
  annualAspirants: string;
  totalStages: number;
  stagesDescription: string;
  milestones: MilestoneItem[];
  overlaps: OverlapTarget[];
}

export const TRAJECTORY_EXAMS: TrajectoryExam[] = [
  {
    id: 'upsc-cse',
    slug: 'civil-services-ias',
    name: 'UPSC Civil Services',
    fullName: 'Civil Services Examination (IAS / IPS / IFS)',
    authority: 'Union Public Service Commission',
    category: 'civil_services',
    categoryLabel: 'Civil Services & Administration',
    frequency: 'Annual (May - Prelims, Sept - Mains)',
    annualAspirants: '1,100,000+ Aspirants',
    totalStages: 3,
    stagesDescription: 'Prelims (GS + CSAT) -> Mains (9 Descriptive Papers) -> Personality Interview',
    milestones: [
      {
        id: 'upsc-m1',
        phase: 'foundation',
        title: 'NCERT General Studies Foundation (Class 6 - 12)',
        description: 'Conceptual mastery of Indian History, Physical Geography, Polity, Macroeconomics, and Environmental Science.',
        estimatedHours: 180,
        recommendedSources: ['NCERT History (Our Pasts, Themes in World History)', 'NCERT Geography Class 11-12', 'NCERT Macroeconomics Class 12'],
      },
      {
        id: 'upsc-m2',
        phase: 'foundation',
        title: 'Indian Polity & Constitutional Framework Mastery',
        description: 'Comprehensive study of Fundamental Rights, Directive Principles, Parliamentary Procedures, and Supreme Court Doctrines.',
        estimatedHours: 90,
        recommendedSources: ['Indian Polity by M. Laxmikanth', 'The Constitution of India (Bare Act)', 'PRS Legislative Research summaries'],
      },
      {
        id: 'upsc-m3',
        phase: 'reference',
        title: 'Modern Indian History & Post-Independence Evolution',
        description: 'Chronological timeline of Freedom Struggle, socio-religious reforms, partition, and constitutional integration.',
        estimatedHours: 85,
        recommendedSources: ['A Brief History of Modern India (Spectrum)', 'India After Gandhi by Ramachandra Guha'],
      },
      {
        id: 'upsc-m4',
        phase: 'reference',
        title: 'Macroeconomics, Budget & Economic Survey Analytics',
        description: 'Analysis of Fiscal Policy, Monetary System, Inflation targeting, Balance of Payments, and Union Budget expenditure allocations.',
        estimatedHours: 110,
        recommendedSources: ['Indian Economy by Nitin Singhania / Ramesh Singh', 'Annual Union Budget & Economic Survey Highlights'],
      },
      {
        id: 'upsc-m5',
        phase: 'reference',
        title: 'Environment, Biodiversity & Climate Policy',
        description: 'UNFCCC COP resolutions, National Parks, Ramsar wetland sites, Wildlife Protection Act 1972, and Carbon Credit mechanisms.',
        estimatedHours: 75,
        recommendedSources: ['PMFIAS / Shankar IAS Environment Notes', 'Down To Earth Annual Compendiums'],
      },
      {
        id: 'upsc-m6',
        phase: 'reference',
        title: 'Ethics, Integrity & Case Study Analytical Framework',
        description: 'Mastery of ethical philosophers, public administration integrity, code of conduct, and resolving 60+ administrative case studies.',
        estimatedHours: 65,
        recommendedSources: ['Lexicon for Ethics, Integrity & Aptitude', 'ARC-2 Ethics in Governance Report'],
      },
      {
        id: 'upsc-m7',
        phase: 'writing_pyq',
        title: '10-Year Mains Topic-wise PYQ Solved Analysis',
        description: 'Reverse-engineering past question patterns across GS Paper 1 through 4 to formulate high-impact answering templates.',
        estimatedHours: 120,
        recommendedSources: ['Mains Topic-Wise Solved Compilations (2014-2025)', 'Official UPSC Model Answer Rubrics'],
      },
      {
        id: 'upsc-m8',
        phase: 'writing_pyq',
        title: 'Daily 2-Question Structured Answer Writing Drills',
        description: 'Strict adherence to Introduction, Diagrammatic Framework, Analytical Points, and Forward-Looking Conclusion under 7 minutes per answer.',
        estimatedHours: 150,
        recommendedSources: ['Daily Editorial Analysis Drills', 'Standard UPSC 150-word and 250-word Answer Booklets'],
      },
      {
        id: 'upsc-m9',
        phase: 'mocks',
        title: '30 Full-Length Prelims Simulated Tests & Error Log',
        description: 'Rigorous timed practice to calibrate negative marking threshold, intuitive elimination techniques, and CSAT aptitude qualifying mastery.',
        estimatedHours: 100,
        recommendedSources: ['All-India Simulator Series (GS Paper 1 & CSAT Paper 2)', 'Personalized Error Diary Notebook'],
      },
      {
        id: 'upsc-m10',
        phase: 'mocks',
        title: 'Full-Cycle Mains Simulated Test Series (9 Papers)',
        description: 'Simulating the grueling 5-day examination cycle with 6 hours of daily descriptive writing under timed exam hall conditions.',
        estimatedHours: 90,
        recommendedSources: ['Mains Evaluated Test Series with Mentor Feedback'],
      },
    ],
    overlaps: [
      {
        examId: 'state-psc',
        examName: 'State PSC (Group-I Administrative Officers)',
        examCategory: 'State Civil Services',
        overlapPercentage: 84,
        preparationSynergy: 'Very High',
        gapBridgeDays: 20,
        sharedModules: [
          'Indian Polity & Constitutional Doctrines',
          'Modern Indian History & National Movement',
          'Macroeconomics & Central Schemes',
          'Physical & Indian Geography',
          'Environmental Science & Ecology',
          'General Science & Current Affairs',
        ],
        exclusiveModules: [
          'State Specific History, Dynasties & Folk Culture',
          'State Physical Geography & River Basin Systems',
          'State Annual Budget & Local Welfare Initiatives',
          'State Panchayati Raj & Municipality Acts',
        ],
        strategicAdvice:
          'Preparing for UPSC CSE automatically covers 84% of State PSC Mains GS. Dedicating 3 weeks prior to the state exam to local history and state geography gives you top percentile ranking without extra coaching fees.',
      },
      {
        examId: 'ssc-cgl',
        examName: 'SSC CGL (Combined Graduate Level)',
        examCategory: 'Central Government Group-B/C',
        overlapPercentage: 62,
        preparationSynergy: 'High',
        gapBridgeDays: 35,
        sharedModules: [
          'General Awareness (Polity, History, Science)',
          'English Language Reading Comprehension',
          'Current National & International Affairs',
        ],
        exclusiveModules: [
          'Advanced Quantitative Aptitude (Trigonometry, Geometry, Algebra)',
          'High-Speed Reasoning & Non-Verbal Coding Drills',
          'Computer Proficiency Qualifying Module',
          'Typing Speed Test (27-30 WPM)',
        ],
        strategicAdvice:
          'UPSC aspirants consistently score in the 99th percentile on SSC General Awareness. Focus solely on speed math drills (solving 25 quant questions in 20 minutes) to clear SSC CGL Tier-1 comfortably.',
      },
      {
        examId: 'rbi-grade-b',
        examName: 'RBI Grade B (Officers in Grade B - DR)',
        examCategory: 'Central Banking & Financial Regulators',
        overlapPercentage: 58,
        preparationSynergy: 'Moderate',
        gapBridgeDays: 45,
        sharedModules: [
          'Economic & Social Issues (ESI)',
          'Macroeconomics, Monetary Policy & Fiscal Deficit',
          'General Awareness & Union Budget Analytics',
          'English Descriptive Essay & Précis Writing',
        ],
        exclusiveModules: [
          'Corporate Finance, Financial Ratios & Balance Sheets',
          'Management Principles & Organizational Behavior',
          'High-Speed Phase-1 Quantitative Aptitude & Complex Puzzles',
        ],
        strategicAdvice:
          'Phase-2 ESI and English Descriptive papers heavily favor UPSC economics preparation. Supplement with 4 weeks of dedicated Corporate Finance and Management theory.',
      },
      {
        examId: 'cds-exam',
        examName: 'UPSC CDS (Combined Defence Services - IMA / OTA)',
        examCategory: 'Armed Forces Officer Cadre',
        overlapPercentage: 76,
        preparationSynergy: 'Very High',
        gapBridgeDays: 15,
        sharedModules: [
          'General Knowledge (Identical to UPSC CSE Prelims syllabus)',
          'English Grammar, Vocabulary & Error Spotting',
          'Current Defense & Geopolitical Affairs',
        ],
        exclusiveModules: [
          'Elementary Mathematics (Arithmetic & Mensuration for IMA/AFA)',
          'SSB 5-Day Psychological Testing & Ground Task Conditioning',
        ],
        strategicAdvice:
          'The CDS General Knowledge paper is drafted by the exact same UPSC examination board. Candidates preparing for Civil Services find the CDS written exam exceptionally straightforward.',
      },
    ],
  },
  {
    id: 'ssc-cgl',
    slug: 'ssc-cgl',
    name: 'SSC CGL',
    fullName: 'Staff Selection Commission - Combined Graduate Level',
    authority: 'Staff Selection Commission (Govt of India)',
    category: 'staff_selection',
    categoryLabel: 'Central Ministries & Inspector Cadres',
    frequency: 'Annual (Tier-1: July-Aug, Tier-2: Oct-Nov)',
    annualAspirants: '2,800,000+ Aspirants',
    totalStages: 2,
    stagesDescription: 'Tier-1 (Computer Based 100 MCQs) -> Tier-2 (Maths, Reasoning, English, GA, Computer & Typing)',
    milestones: [
      {
        id: 'ssc-m1',
        phase: 'foundation',
        title: 'Quantitative Aptitude Arithmetic Fundamentals',
        description: 'Shortcuts, percentage chains, profit & loss, time & work, pipe & cistern, and speed-distance formulas.',
        estimatedHours: 80,
        recommendedSources: ['Quantitative Aptitude by R.S. Aggarwal', 'Rakesh Yadav Class Notes'],
      },
      {
        id: 'ssc-m2',
        phase: 'foundation',
        title: 'Advanced Mathematics (Geometry, Mensuration & Trigonometry)',
        description: 'Circle theorems, triangle congruence, height & distance, algebraic identities, and coordinate geometry.',
        estimatedHours: 95,
        recommendedSources: ['Advance Maths for General Competitions', 'NCERT Class 9-10 Math Theorems'],
      },
      {
        id: 'ssc-m3',
        phase: 'foundation',
        title: 'Logical Reasoning & Analytical Ability Speed Drills',
        description: 'Syllogisms, blood relations, seating arrangements, non-verbal paper folding, and analogical series.',
        estimatedHours: 60,
        recommendedSources: ['Verbal & Non-Verbal Reasoning by Kiran Publications'],
      },
      {
        id: 'ssc-m4',
        phase: 'reference',
        title: 'English Grammar Rules, Vocabulary & Cloze Tests',
        description: '100 Golden Grammar Rules, error spotting, active-passive voice, direct-indirect speech, and 1500 high-frequency idioms.',
        estimatedHours: 70,
        recommendedSources: ['From Plinth to Paramount by Neetu Singh', 'Word Power Made Easy by Norman Lewis'],
      },
      {
        id: 'ssc-m5',
        phase: 'reference',
        title: 'General Awareness Static GK & Current Affairs',
        description: 'Polity articles, ancient/medieval monuments, scientific discovery formulas, census data, and national awards.',
        estimatedHours: 85,
        recommendedSources: ['Lucent General Knowledge (Revised)', 'Pinnacle SSC General Studies 6500+ MCQs'],
      },
      {
        id: 'ssc-m6',
        phase: 'writing_pyq',
        title: 'SSC CGL 5-Year Tier-1 & Tier-2 Shift-wise PYQ Solving',
        description: 'Solving all 40+ official shifts under real time constraints to identify repeated math patterns and vocabulary.',
        estimatedHours: 110,
        recommendedSources: ['Kiran Chapter-wise Solved Papers (2019-2025)'],
      },
      {
        id: 'ssc-m7',
        phase: 'mocks',
        title: '50 Full-Length Computer-Based Simulated Speed Tests',
        description: 'Achieving the critical speed benchmark: 100 questions answered in 60 minutes with 90%+ accuracy.',
        estimatedHours: 90,
        recommendedSources: ['ApplyFields CBT Speed Engine / Test Series'],
      },
      {
        id: 'ssc-m8',
        phase: 'mocks',
        title: 'Computer Knowledge Qualifying & Typing Speed Drill',
        description: 'Hardware, networking, cyber threats, MS Office shortcuts, and securing 27+ WPM speed without backspace reliance.',
        estimatedHours: 35,
        recommendedSources: ['Arihant Computer Awareness', 'TypingMaster Speed Drills'],
      },
    ],
    overlaps: [
      {
        examId: 'rrb-ntpc',
        examName: 'RRB NTPC (Non-Technical Popular Categories)',
        examCategory: 'Indian Railways (Level 2 to Level 6)',
        overlapPercentage: 88,
        preparationSynergy: 'Very High',
        gapBridgeDays: 10,
        sharedModules: [
          'Arithmetic & General Mathematics',
          'Logical Reasoning & Non-Verbal Patterns',
          'General Awareness & Static Science',
        ],
        exclusiveModules: [
          'Railway Sector History & Indian Railways Operations',
          'Higher weightage on 10th Standard Physics & Chemistry',
        ],
        strategicAdvice:
          'RRB NTPC syllabus is nearly identical to SSC CGL. An SSC CGL aspirant requires zero additional preparation other than reviewing railway operations static trivia.',
      },
      {
        examId: 'ibps-po',
        examName: 'IBPS / SBI Bank PO',
        examCategory: 'Public Sector Banking Officers',
        overlapPercentage: 65,
        preparationSynergy: 'High',
        gapBridgeDays: 30,
        sharedModules: [
          'Basic Quantitative Aptitude Concepts',
          'English Language Reading & Grammar',
        ],
        exclusiveModules: [
          'High-Level Seating Arrangements & Floor Puzzles',
          'Complex Caselet Data Interpretation (DI)',
          'Banking Awareness, Monetary Policy & RBI Guidelines',
          'Descriptive Essay & Letter Writing Test',
        ],
        strategicAdvice:
          'While basic arithmetic overlaps, banking reasoning is vastly more puzzle-intensive. Dedicate 4 weeks specifically to circular and dual-row seating arrangements and DI charts.',
      },
      {
        examId: 'state-psc',
        examName: 'State PSC Group-II & Revenue Inspectors',
        examCategory: 'State Ministerial Services',
        overlapPercentage: 70,
        preparationSynergy: 'High',
        gapBridgeDays: 25,
        sharedModules: [
          'General Science & Technology',
          'Indian Polity & Governance Basics',
          'Arithmetic & Aptitude',
          'General English Comprehension',
        ],
        exclusiveModules: [
          'State Specific History & Freedom Fighters',
          'State Revenue Administration & Land Laws',
        ],
        strategicAdvice:
          'SSC CGL candidates hold a decisive scoring advantage in State PSC Group-II exams due to superior math and reasoning speeds.',
      },
    ],
  },
];

export function TrajectoriesClient() {
  const [selectedExamId, setSelectedExamId] = useState<string>('upsc-cse');
  const [activeTab, setActiveTab] = useState<'checklist' | 'overlap'>('overlap');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [completedMilestoneIds, setCompletedMilestoneIds] = useState<Record<string, boolean>>({});

  const currentExam =
    TRAJECTORY_EXAMS.find((e) => e.id === selectedExamId) || TRAJECTORY_EXAMS[0];

  // Load completed milestones from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = `applyfields_prep_checklist_${selectedExamId}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCompletedMilestoneIds(JSON.parse(stored));
      } else {
        setCompletedMilestoneIds({});
      }
    } catch {
      setCompletedMilestoneIds({});
    }
  }, [selectedExamId]);

  // Toggle milestone completion
  const handleToggleMilestone = (milestoneId: string) => {
    const nextState = {
      ...completedMilestoneIds,
      [milestoneId]: !completedMilestoneIds[milestoneId],
    };
    setCompletedMilestoneIds(nextState);
    if (typeof window !== 'undefined') {
      const storageKey = `applyfields_prep_checklist_${selectedExamId}`;
      localStorage.setItem(storageKey, JSON.stringify(nextState));
    }
  };

  // Reset all for current exam
  const handleResetChecklist = () => {
    setCompletedMilestoneIds({});
    if (typeof window !== 'undefined') {
      const storageKey = `applyfields_prep_checklist_${selectedExamId}`;
      localStorage.removeItem(storageKey);
    }
  };

  // Mark all completed
  const handleMarkAllDone = () => {
    const allDone: Record<string, boolean> = {};
    currentExam.milestones.forEach((m) => {
      allDone[m.id] = true;
    });
    setCompletedMilestoneIds(allDone);
    if (typeof window !== 'undefined') {
      const storageKey = `applyfields_prep_checklist_${selectedExamId}`;
      localStorage.setItem(storageKey, JSON.stringify(allDone));
    }
  };

  const totalMilestones = currentExam.milestones.length;
  const completedCount = currentExam.milestones.filter(
    (m) => completedMilestoneIds[m.id],
  ).length;
  const progressPercent =
    totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;
  const totalHours = currentExam.milestones.reduce((acc, m) => acc + m.estimatedHours, 0);

  const filteredMilestones = currentExam.milestones.filter((m) => {
    if (phaseFilter === 'all') return true;
    return m.phase === phaseFilter;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner Section */}
      <section className="rounded-2xl border border-[#dec9a5] bg-[#F4E8D1] p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#ffffff] px-2.5 py-1 text-xs font-bold text-[#76562d]">
              <Compass className="size-3.5 text-[#76562d]" /> Trajectories & Syllabus Engine
            </span>
            <span className="rounded-md bg-[#082046] px-2.5 py-1 text-xs font-bold text-[#ffffff]">
              {currentExam.categoryLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <PrintExportButton
              label="Print Study Plan / PDF"
              documentTitle={`${currentExam.name} - Official Syllabus & Trajectory Tracker - ApplyFields`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#082046] tracking-tight">
            {currentExam.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-[#435775] max-w-3xl leading-relaxed">
            {currentExam.stagesDescription} • Conducted by {currentExam.authority}. Featuring step-by-step milestone tracking and cross-exam curriculum overlap analysis.
          </p>
        </div>

        {/* Exam Selection Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#dec9a5]/70">
          <span className="text-xs font-bold text-[#76562d] uppercase tracking-wider mr-2">
            Select Target Exam:
          </span>
          {TRAJECTORY_EXAMS.map((exam) => (
            <button
              key={exam.id}
              type="button"
              onClick={() => setSelectedExamId(exam.id)}
              className={cn(
                'rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5',
                selectedExamId === exam.id
                  ? 'bg-[#082046] text-[#ffffff] ring-1 ring-[#082046]'
                  : 'bg-[#ffffff] text-[#082046] border border-[#dec9a5] hover:bg-[#ebdcc0]',
              )}
            >
              <Target className="size-3.5" />
              <span>{exam.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Switcher Tabs (Overlap Analyzer vs Preparation Checklist) */}
      <div className="flex items-center justify-between border-b border-[#dec9a5] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('overlap')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2',
              activeTab === 'overlap'
                ? 'bg-[#082046] text-[#ffffff] shadow-sm'
                : 'bg-[#ffffff] text-[#435775] border border-[#dec9a5] hover:text-[#082046]',
            )}
          >
            <Scale className="size-4" /> Curriculum Overlap Analyzer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-2',
              activeTab === 'checklist'
                ? 'bg-[#082046] text-[#ffffff] shadow-sm'
                : 'bg-[#ffffff] text-[#435775] border border-[#dec9a5] hover:text-[#082046]',
            )}
          >
            <CheckCircle2 className="size-4" /> Interactive Preparation Checklist
            <span className="rounded-full bg-[#0e7bf4] px-1.5 py-0.2 text-[10px] text-white font-mono">
              {progressPercent}%
            </span>
          </button>
        </div>

        <span className="hidden sm:inline-block text-xs text-[#536780]">
          Total Prep Effort: ~{totalHours} Structured Study Hours
        </span>
      </div>

      {/* TAB 1: CURRICULUM OVERLAP ANALYZER */}
      {activeTab === 'overlap' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-[#ffffff] p-5 border border-[#dec9a5] space-y-2 shadow-sm">
            <h3 className="text-sm font-bold text-[#082046] flex items-center gap-2">
              <Zap className="size-4 text-[#0e7bf4]" />
              Strategic Multi-Exam Filing Intelligence
            </h3>
            <p className="text-xs text-[#536780] leading-relaxed">
              Competitive exam preparation in India has massive syllabus synergies. By preparing for <strong>{currentExam.name}</strong>, you cover up to <strong>88%</strong> of related exams conducted by State PSCs, Railways, and Central Ministries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {currentExam.overlaps.map((overlap) => (
              <div
                key={overlap.examId}
                className="rounded-2xl border border-[#dec9a5] bg-[#ffffff] p-5 sm:p-6 space-y-4 shadow-sm hover:border-[#082046]/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header & Overlap Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#76562d] block">
                        {overlap.examCategory}
                      </span>
                      <h4 className="text-base font-bold text-[#082046] mt-0.5">
                        {overlap.examName}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl sm:text-2xl font-black text-[#082046] tabular-nums">
                        {overlap.overlapPercentage}%
                      </div>
                      <span className="text-[10px] font-bold text-[#0e7bf4] uppercase">
                        Syllabus Overlap
                      </span>
                    </div>
                  </div>

                  {/* Overlap Progress Bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#f8f5ef] border border-[#dec9a5]/50">
                    <div
                      className="h-full rounded-full bg-[#082046]"
                      style={{ width: `${overlap.overlapPercentage}%` }}
                    />
                  </div>

                  {/* Preparation Synergy & Gap Bridge Days */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-[#F4E8D1] px-2 py-0.5 font-bold text-[#76562d]">
                      Synergy: {overlap.preparationSynergy}
                    </span>
                    <span className="rounded bg-[#f8f5ef] border border-[#dec9a5] px-2 py-0.5 text-[#435775] font-mono">
                      Gap Bridge Effort: ~{overlap.gapBridgeDays} Days
                    </span>
                  </div>

                  {/* Shared Modules (Green) */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="size-3.5 text-emerald-700" />
                      Shared Curriculum (Automatically Covered)
                    </span>
                    <ul className="text-xs text-stone-700 space-y-1 pl-1">
                      {overlap.sharedModules.map((mod, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="size-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{mod}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Exclusive Modules Required (Amber) */}
                  <div className="space-y-1.5 pt-2 border-t border-[#dec9a5]/40">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                      <Target className="size-3.5 text-amber-700" />
                      Additional Modules Required for Target
                    </span>
                    <ul className="text-xs text-stone-700 space-y-1 pl-1">
                      {overlap.exclusiveModules.map((mod, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="size-1.5 rounded-full bg-amber-600 shrink-0 mt-1.5" />
                          <span>{mod}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Strategic Guidance Box */}
                  <div className="rounded-xl bg-[#F4E8D1]/40 p-3 border border-[#dec9a5] text-xs text-[#435775] leading-relaxed">
                    <strong className="text-[#082046] block mb-0.5">Filing Strategy:</strong>
                    {overlap.strategicAdvice}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#dec9a5]/40 flex justify-end">
                  <Link
                    href={`/career/roadmaps/${currentExam.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0e7bf4] hover:underline"
                  >
                    View Complete Roadmap <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE PREPARATION CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {/* Progress Overview Card */}
          <div className="rounded-2xl border border-[#dec9a5] bg-[#ffffff] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#082046]">
                  {currentExam.name} Preparation Tracker
                </h3>
                <p className="text-xs text-[#536780] mt-0.5">
                  Save your progress as you complete foundational NCERTs, reference literature, PYQs, and mocks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllDone}
                  className="rounded-lg border border-[#dec9a5] bg-[#f8f5ef] px-2.5 py-1 text-xs font-semibold text-[#082046] hover:bg-[#ffffff] transition"
                >
                  Mark All Complete
                </button>
                <button
                  type="button"
                  onClick={handleResetChecklist}
                  className="rounded-lg border border-[#dec9a5] bg-[#f8f5ef] px-2.5 py-1 text-xs font-semibold text-[#76562d] hover:bg-[#ffffff] transition flex items-center gap-1"
                >
                  <RotateCcw className="size-3" /> Reset
                </button>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-[#082046]">
                <span>Overall Syllabus Readiness</span>
                <span className="font-mono">
                  {completedCount} of {totalMilestones} Milestones ({progressPercent}%)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[#f8f5ef] border border-[#dec9a5]/70">
                <div
                  className="h-full rounded-full bg-[#0e7bf4] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Phase Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#dec9a5]/40 text-xs">
              <span className="font-bold text-[#76562d] uppercase text-[11px] mr-1">
                Filter Phase:
              </span>
              {[
                { id: 'all', label: 'All Milestones' },
                { id: 'foundation', label: '1. Foundation & NCERTs' },
                { id: 'reference', label: '2. Standard Books & Theory' },
                { id: 'writing_pyq', label: '3. PYQs & Answer Writing' },
                { id: 'mocks', label: '4. Mock Test Series' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPhaseFilter(f.id)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold transition',
                    phaseFilter === f.id
                      ? 'bg-[#082046] text-white shadow-xs'
                      : 'bg-[#f8f5ef] text-[#435775] border border-[#dec9a5] hover:bg-white',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist Items List */}
          <div className="space-y-3">
            {filteredMilestones.map((m) => {
              const isChecked = !!completedMilestoneIds[m.id];

              return (
                <div
                  key={m.id}
                  className={cn(
                    'p-4 sm:p-5 rounded-xl border transition-all shadow-xs flex items-start gap-4',
                    isChecked
                      ? 'border-[#dec9a5] bg-[#F4E8D1]/30'
                      : 'border-[#dec9a5] bg-[#ffffff] hover:border-[#082046]/40',
                  )}
                >
                  {/* Custom Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleMilestone(m.id)}
                    className={cn(
                      'mt-0.5 flex size-5.5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                      isChecked
                        ? 'border-[#082046] bg-[#082046] text-[#ffffff] shadow-sm'
                        : 'border-[#dec9a5] bg-[#f8f5ef] hover:border-[#082046] hover:bg-[#ffffff]',
                    )}
                    aria-label={`Toggle ${m.title}`}
                  >
                    {isChecked && <Check className="size-3.5 stroke-[3]" />}
                  </button>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'text-sm font-bold text-[#082046]',
                            isChecked && 'line-through text-[#536780]',
                          )}
                        >
                          {m.title}
                        </span>
                        <span className="rounded bg-[#f8f5ef] border border-[#dec9a5] px-2 py-0.5 text-[10px] font-bold text-[#76562d] uppercase">
                          Phase: {m.phase.replace('_', ' ')}
                        </span>
                      </div>

                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#536780]">
                        <Clock className="size-3 text-[#76562d]" /> ~{m.estimatedHours}h
                      </span>
                    </div>

                    <p
                      className={cn(
                        'text-xs text-[#536780] leading-relaxed',
                        isChecked && 'text-[#536780]/70',
                      )}
                    >
                      {m.description}
                    </p>

                    {/* Recommended Study Literature */}
                    <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-bold text-[#082046] text-[10px] uppercase">
                        Recommended Literature:
                      </span>
                      {m.recommendedSources.map((source, sIdx) => (
                        <span
                          key={sIdx}
                          className="rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[#243b5b]"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

