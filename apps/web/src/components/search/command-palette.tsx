'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Building2,
  Briefcase,
  Route,
  BookOpen,
  ArrowRight,
  CornerDownLeft,
  X,
  Compass,
  FileText,
} from 'lucide-react';
import { TOP_50_COLLEGES } from '@/lib/top-50-colleges-data';

interface PaletteItem {
  id: string;
  category: 'colleges' | 'jobs' | 'roadmaps' | 'courses';
  categoryLabel: string;
  categoryIcon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
}

const STATIC_JOBS_AND_EXAMS: PaletteItem[] = [
  {
    id: 'j-ssc-cgl',
    category: 'jobs',
    categoryLabel: 'Live Jobs & Exams',
    categoryIcon: <Briefcase className="size-4 text-emerald-600" />,
    title: 'Staff Selection Commission - Combined Graduate Level (SSC CGL 2026)',
    subtitle: 'Group B & C Central Govt Posts - 17,727 Vacancies',
    href: '/jobs?q=SSC+CGL',
    badge: '17.7k Posts',
  },
  {
    id: 'j-upsc-cse',
    category: 'jobs',
    categoryLabel: 'Live Jobs & Exams',
    categoryIcon: <Briefcase className="size-4 text-emerald-600" />,
    title: 'UPSC Civil Services Examination (IAS / IPS / IFS)',
    subtitle: 'Union Public Service Commission - All India Merit',
    href: '/exams?q=UPSC+Civil+Services',
    badge: 'Premier Exam',
  },
  {
    id: 'j-upsc-nda',
    category: 'jobs',
    categoryLabel: 'Live Jobs & Exams',
    categoryIcon: <Briefcase className="size-4 text-emerald-600" />,
    title: 'National Defence Academy & Naval Academy Exam (NDA / NA)',
    subtitle: 'Indian Armed Forces - 10+2 Officers Cadre',
    href: '/exams?q=NDA',
    badge: '10+2 Entry',
  },
  {
    id: 'j-ibps-po',
    category: 'jobs',
    categoryLabel: 'Live Jobs & Exams',
    categoryIcon: <Briefcase className="size-4 text-emerald-600" />,
    title: 'IBPS Probationary Officer (PO) & Management Trainee',
    subtitle: 'Public Sector Banks - 3,955 Vacancies',
    href: '/jobs?q=IBPS+PO',
    badge: 'Banking',
  },
  {
    id: 'j-rrb-ntpc',
    category: 'jobs',
    categoryLabel: 'Live Jobs & Exams',
    categoryIcon: <Briefcase className="size-4 text-emerald-600" />,
    title: 'Railway Recruitment Board - RRB NTPC Non-Technical Categories',
    subtitle: 'Indian Railways - Station Master & Goods Guard',
    href: '/jobs?q=RRB+NTPC',
    badge: 'Railways',
  },
  {
    id: 'j-neet-ug',
    category: 'jobs',
    categoryLabel: 'Live Jobs & Exams',
    categoryIcon: <Briefcase className="size-4 text-emerald-600" />,
    title: 'National Eligibility cum Entrance Test (NEET-UG)',
    subtitle: 'NTA - National Medical Entrance for MBBS & BDS Admissions',
    href: '/exams?q=NEET',
    badge: 'Medical Entrance',
  },
  {
    id: 'j-jee-adv',
    category: 'jobs',
    categoryLabel: 'Live Jobs & Exams',
    categoryIcon: <Briefcase className="size-4 text-emerald-600" />,
    title: 'Joint Entrance Examination - Advanced (JEE Advanced)',
    subtitle: 'IIT Entrance Examination for B.Tech Admissions',
    href: '/exams?q=JEE',
    badge: 'IIT Entrance',
  },
];

const STATIC_ROADMAPS: PaletteItem[] = [
  {
    id: 'r-med-doc',
    category: 'roadmaps',
    categoryLabel: 'Roadmaps',
    categoryIcon: <Route className="size-4 text-[#0e7bf4]" />,
    title: 'Medical Specialist Trajectory (MBBS to MD / MS Specialist)',
    subtitle: 'NEET-UG -> MBBS 4.5 Yrs -> 1 Yr Internship -> NEET-PG -> Residency',
    href: '/career/roadmaps/medical-doctor-trajectory',
    badge: 'Healthcare',
  },
  {
    id: 'r-ai-ml',
    category: 'roadmaps',
    categoryLabel: 'Roadmaps',
    categoryIcon: <Route className="size-4 text-[#0e7bf4]" />,
    title: 'Artificial Intelligence & Machine Learning Architect',
    subtitle: 'Python & Linear Algebra -> PyTorch -> LLMs & RAG -> Model Production',
    href: '/career/roadmaps/ai-machine-learning-engineer',
    badge: 'Tech',
  },
  {
    id: 'r-cloud-dev',
    category: 'roadmaps',
    categoryLabel: 'Roadmaps',
    categoryIcon: <Route className="size-4 text-[#0e7bf4]" />,
    title: 'Full-Stack Cloud & Platform Engineer',
    subtitle: 'TypeScript -> Next.js & Node -> Distributed SQL -> Kubernetes & DevOps',
    href: '/career/roadmaps/full-stack-cloud-engineer',
    badge: 'Software',
  },
  {
    id: 'r-civil-serv',
    category: 'roadmaps',
    categoryLabel: 'Roadmaps',
    categoryIcon: <Route className="size-4 text-[#0e7bf4]" />,
    title: 'Civil Services Officer (IAS / IPS)',
    subtitle: 'NCERT Foundations -> GS Mains & Optional -> Answer Writing -> Interview Board',
    href: '/career/roadmaps/civil-services-ias-officer',
    badge: 'Public Service',
  },
];

const STATIC_COURSES: PaletteItem[] = [
  {
    id: 'c-mbbs',
    category: 'courses',
    categoryLabel: 'Courses',
    categoryIcon: <BookOpen className="size-4 text-amber-700" />,
    title: 'Bachelor of Medicine, Bachelor of Surgery (MBBS)',
    subtitle: 'Undergraduate - 66 Months - NEET-UG Merit',
    href: '/career/courses/mbbs',
    badge: 'Medicine',
  },
  {
    id: 'c-md-med',
    category: 'courses',
    categoryLabel: 'Courses',
    categoryIcon: <BookOpen className="size-4 text-amber-700" />,
    title: 'Doctor of Medicine (MD) in General Medicine',
    subtitle: 'Postgraduate - 36 Months - NEET-PG Merit',
    href: '/career/courses/md-general-medicine',
    badge: 'PG Medical',
  },
  {
    id: 'c-btech-cse',
    category: 'courses',
    categoryLabel: 'Courses',
    categoryIcon: <BookOpen className="size-4 text-amber-700" />,
    title: 'B.Tech in Computer Science & Engineering',
    subtitle: 'Undergraduate - 48 Months - JoSAA / State Counseling',
    href: '/career/courses/btech-computer-science',
    badge: 'Engineering',
  },
  {
    id: 'c-btech-ece',
    category: 'courses',
    categoryLabel: 'Courses',
    categoryIcon: <BookOpen className="size-4 text-amber-700" />,
    title: 'B.Tech in Electronics & Communication Engineering',
    subtitle: 'Undergraduate - 48 Months - VLSI & Embedded Systems',
    href: '/career/courses/btech-ece',
    badge: 'Engineering',
  },
  {
    id: 'c-mba',
    category: 'courses',
    categoryLabel: 'Courses',
    categoryIcon: <BookOpen className="size-4 text-amber-700" />,
    title: 'Master of Business Administration (MBA)',
    subtitle: 'Postgraduate - 24 Months - CAT, XAT, MAT',
    href: '/career/courses/master-of-business-administration',
    badge: 'Management',
  },
  {
    id: 'c-bpharm',
    category: 'courses',
    categoryLabel: 'Courses',
    categoryIcon: <BookOpen className="size-4 text-amber-700" />,
    title: 'Bachelor of Pharmacy (B.Pharm)',
    subtitle: 'Undergraduate - 48 Months - PCI Approved',
    href: '/career/courses/bachelor-of-pharmacy',
    badge: 'Pharmacy',
  },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Convert TOP_50_COLLEGES to PaletteItems
  const collegeItems = useMemo<PaletteItem[]>(() => {
    return TOP_50_COLLEGES.map((c) => {
      const isMed = c.accreditation?.nirf_category === 'Medical';
      return {
        id: `col-${c.slug}`,
        category: 'colleges',
        categoryLabel: 'Colleges',
        categoryIcon: <Building2 className="size-4 text-[#76562d]" />,
        title: c.name,
        subtitle: `${c.city || 'India'}, ${c.state_code || ''} - ${c.accreditation?.nirf_rank ? `NIRF #${c.accreditation.nirf_rank}` : c.type}`,
        href: `/career/colleges/${c.slug}`,
        badge: isMed ? 'Medical' : 'Engineering',
      };
    });
  }, []);

  // Global keydown listener for Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Filter items across all 4 categories
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matches = (item: PaletteItem) => {
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
    };

    const colleges = collegeItems.filter(matches).slice(0, 5);
    const jobs = STATIC_JOBS_AND_EXAMS.filter(matches).slice(0, 5);
    const roadmaps = STATIC_ROADMAPS.filter(matches).slice(0, 4);
    const courses = STATIC_COURSES.filter(matches).slice(0, 4);

    return [
      { key: 'colleges', label: 'Colleges and Universities', items: colleges },
      { key: 'jobs', label: 'Live Jobs and Entrance Exams', items: jobs },
      { key: 'roadmaps', label: 'Career Roadmaps', items: roadmaps },
      { key: 'courses', label: 'Courses and Degrees', items: courses },
    ].filter((g) => g.items.length > 0);
  }, [query, collegeItems]);

  // Flattened list for keyboard navigation
  const flatItems = useMemo(() => {
    return filteredGroups.flatMap((g) => g.items);
  }, [filteredGroups]);

  // Handle arrow key navigation & Enter select
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flatItems[selectedIndex];
      if (target) {
        setIsOpen(false);
        router.push(target.href);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Universal Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#082046]/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-[#dec9a5] bg-[#ffffff] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-[#dec9a5] bg-[#F4E8D1] px-4 py-3.5 shrink-0">
          <Search className="size-5 text-[#76562d] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command or search colleges, jobs, roadmaps, degrees..."
            className="w-full bg-transparent text-sm font-semibold text-[#082046] placeholder:text-[#536780]/70 outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="rounded p-1 text-[#536780] hover:text-[#082046]"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block rounded border border-[#dec9a5] bg-[#ffffff] px-2 py-0.5 text-[10px] font-mono font-bold text-[#76562d]">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#dec9a5]/30">
          {flatItems.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Compass className="size-8 text-[#76562d] mx-auto opacity-70" />
              <p className="text-sm font-bold text-[#082046]">No matching records found</p>
              <p className="text-xs text-[#536780]">
                Try searching for &quot;AIIMS&quot;, &quot;IIT Bombay&quot;, &quot;SSC&quot;, &quot;MBBS&quot;, or &quot;UPSC&quot;.
              </p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.key} className="py-2 first:pt-1 last:pb-1">
                <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#76562d]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const itemGlobalIndex = flatItems.findIndex((fi) => fi.id === item.id);
                    const isSelected = itemGlobalIndex === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          router.push(item.href);
                        }}
                        onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                        className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#F4E8D1] text-[#082046]'
                            : 'hover:bg-[#f8f5ef] text-[#243b5b]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-[#dec9a5] bg-[#ffffff]">
                            {item.categoryIcon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#082046] truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[#536780] truncate">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span className="rounded border border-[#dec9a5] bg-[#ffffff] px-2 py-0.5 text-[10px] font-semibold text-[#76562d]">
                              {item.badge}
                            </span>
                          )}
                          {isSelected && (
                            <CornerDownLeft className="size-3.5 text-[#082046] animate-in fade-in" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="border-t border-[#dec9a5] bg-[#f8f5ef] px-4 py-2.5 flex items-center justify-between text-[11px] text-[#536780] shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[#dec9a5] bg-[#ffffff] px-1.5 py-0.5 font-mono text-[10px] font-bold">Up</kbd>
              <kbd className="rounded border border-[#dec9a5] bg-[#ffffff] px-1.5 py-0.5 font-mono text-[10px] font-bold">Down</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[#dec9a5] bg-[#ffffff] px-1.5 py-0.5 font-mono text-[10px] font-bold">Enter</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[#dec9a5] bg-[#ffffff] px-1.5 py-0.5 font-mono text-[10px] font-bold">ESC</kbd>
              <span>to close</span>
            </span>
          </div>
          <span className="font-semibold text-[#76562d]">ApplyFields Fast Search</span>
        </div>
      </div>
    </div>
  );
}

/** Global trigger helper */
export function openCommandPalette() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  }
}

