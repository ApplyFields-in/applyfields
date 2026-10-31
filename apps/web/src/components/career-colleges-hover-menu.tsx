'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Award,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Compass,
  FlaskConical,
  Layers,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@applyfields/ui';
import { useLanguage } from '@/lib/i18n/language-context';

export interface CollegeCategoryOption {
  title: string;
  subtitle: string;
  href: string;
  streamKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STREAM_TRANSLATIONS: Record<string, { te: { title: string; subtitle: string }; hi: { title: string; subtitle: string } }> = {
  '': {
    te: { title: 'భారతదేశంలోని అన్ని కళాశాలలు', subtitle: '13,000+ ధృవీకరించబడిన విశ్వవిద్యాలయాలు & కళాశాలలు' },
    hi: { title: 'भारत के सभी कॉलेज', subtitle: '13,000+ सत्यापित विश्वविद्यालय और कॉलेज' },
  },
  'top-50-engg': {
    te: { title: 'టాప్ 50 ఇంజనీరింగ్ కళాశాలలు', subtitle: 'NIRF ర్యాంక్ పొందిన IITలు, NITలు, BITS & ప్రఖ్యాత సంస్థలు' },
    hi: { title: 'शीर्ष 50 इंजीनियरिंग कॉलेज', subtitle: 'एनआईआरएफ रैंक वाले आईआईटी, एनआईटी और तकनीकी संस्थान' },
  },
  management: {
    te: { title: 'మేనేజ్‌మెంట్ కళాశాలలు (MBA)', subtitle: 'MBA, PGDM, బిజినెస్ స్కూల్స్ & ఎగ్జిక్యూటివ్ మేనేజ్‌మెంట్' },
    hi: { title: 'प्रबंधन कॉलेज (MBA)', subtitle: 'एमबीए, पीजीडीएम, बिजनेस स्कूल और प्रबंधन संस्थान' },
  },
  polytechnic: {
    te: { title: 'పాలిటెక్నిక్ కళాశాలలు (డిప్లొమా)', subtitle: '3 సంవత్సరాల సాంకేతిక విద్య & ప్రాక్టికల్ డిప్లొమాలు' },
    hi: { title: 'पॉलीटेक्निक कॉलेज (डिप्लोमा)', subtitle: '3-वर्षीय तकनीकी शिक्षा और इंजीनियरिंग डिप्लोमा' },
  },
  architecture: {
    te: { title: 'ఆర్కిటెక్చర్ & టౌన్ ప్లానింగ్', subtitle: 'B.Arch, ప్లానింగ్, ఇంటీరియర్ & డిజైన్ సంస్థలు' },
    hi: { title: 'आर्किटेक्चर और टाउन प्लानिंग', subtitle: 'बी.आर्क, प्लानिंग और डिजाइन संस्थान' },
  },
  pharmacy: {
    te: { title: 'ఫార్మసీ కళాశాలలు', subtitle: 'B.Pharm, M.Pharm & ఫార్మాస్యూటికల్ సైన్స్ ఇన్‌స్టిట్యూట్‌లు' },
    hi: { title: 'फार्मेसी कॉलेज', subtitle: 'बी.फार्मा, एम.फार्मा और फार्मास्युटिकल संस्थान' },
  },
  medical: {
    te: { title: 'టాప్ 50 మెడికల్ కళాశాలలు', subtitle: 'NIRF ర్యాంక్ పొందిన AIIMS, JIPMER, CMC & వైద్య సంస్థలు' },
    hi: { title: 'शीर्ष 50 मेडिकल कॉलेज', subtitle: 'एम्स, जिपमर, सीएमसी और शीर्ष मेडिकल संस्थान' },
  },
};

export const COLLEGE_CATEGORIES: CollegeCategoryOption[] = [
  {
    title: 'All Colleges in India',
    subtitle: '13,000+ Verified Universities, Institutes & Colleges',
    href: '/career/colleges',
    streamKey: '',
    icon: Building2,
  },
  {
    title: 'Top 50 Engineering Colleges',
    subtitle: 'NIRF Ranked Premier IITs, NITs, BITS & Top Tech Institutes',
    href: '/career/colleges?stream=top-50-engg',
    streamKey: 'top-50-engg',
    icon: Award,
  },
  {
    title: 'Management Colleges',
    subtitle: 'MBA, PGDM, Business Schools & Executive Management',
    href: '/career/colleges?stream=management',
    streamKey: 'management',
    icon: Briefcase,
  },
  {
    title: 'Polytechnic Colleges',
    subtitle: '3-Year Technical Education & Hands-on Engineering Diplomas',
    href: '/career/colleges?stream=polytechnic',
    streamKey: 'polytechnic',
    icon: Layers,
  },
  {
    title: 'Architecture & Town Planning',
    subtitle: 'B.Arch, Planning, Interior & Environmental Design Institutes',
    href: '/career/colleges?stream=architecture',
    streamKey: 'architecture',
    icon: Compass,
  },
  {
    title: 'Pharmacy Colleges',
    subtitle: 'B.Pharm, M.Pharm & Pharmaceutical Science Institutes',
    href: '/career/colleges?stream=pharmacy',
    streamKey: 'pharmacy',
    icon: FlaskConical,
  },
  {
    title: 'Top 50 Medical Colleges',
    subtitle: 'NIRF Ranked Premier AIIMS, JIPMER, CMC & Apex Medical Institutes',
    href: '/career/colleges?stream=medical',
    streamKey: 'medical',
    icon: Stethoscope,
  },
];

export function CareerCollegesHoverMenu({ className }: { className?: string }) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    // If clicked on mobile or touch device, toggle open
    if (!isOpen) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div
      className={cn('relative inline-block group', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button with Hover & Click Support - Rectangular rounded-md */}
      <Link
        href="/career/colleges"
        className={cn(
          'inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-semibold text-[#082046] transition-all duration-200 hover:bg-[#ffffff] hover:border-[#082046]/40 cursor-pointer',
          isOpen && 'bg-[#ffffff] border-[#082046] text-[#0e7bf4] shadow-sm',
        )}
        onClick={handleToggleClick}
      >
        <Building2 className="size-4 text-[#0e7bf4]" />
        <span>{t('career_link_colleges', 'Colleges & universities')}</span>
        <ChevronDown
          className={cn(
            'size-3.5 text-[#082046]/60 transition-transform duration-200',
            isOpen && 'rotate-180 text-[#0e7bf4]',
          )}
        />
      </Link>

      {/* Flyout Dropdown Menu - Rectangular rounded-md */}
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-[380px] sm:w-[420px] rounded-md border border-[#dec9a5] bg-[#fbf9f4] p-2.5 shadow-2xl backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-150 before:absolute before:-top-2 before:left-0 before:right-0 before:h-2"
          role="menu"
          aria-label="Colleges and Universities in India"
        >
          <div className="px-3 py-2 border-b border-[#dec9a5]/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#76562d]">
              {t('career_colleges_menu_title', 'Browse Higher Education in India')}
            </p>
            <p className="text-xs font-semibold text-[#082046] mt-0.5">
              {t('career_colleges_menu_subtitle', 'Select stream or explore premier ranked institutions')}
            </p>
          </div>

          <div className="space-y-1 pt-1.5 max-h-[460px] overflow-y-auto scrollbar-thin">
            {COLLEGE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const streamLocale = language !== 'en' ? STREAM_TRANSLATIONS[cat.streamKey]?.[language as 'te' | 'hi'] : null;
              const title = streamLocale?.title || cat.title;
              const subtitle = streamLocale?.subtitle || cat.subtitle;

              return (
                <Link
                  key={cat.streamKey || 'all'}
                  href={cat.href}
                  onClick={() => setIsOpen(false)}
                  className="group/item flex items-start justify-between gap-3 rounded-md p-2.5 transition-all duration-150 hover:bg-[#F4E8D1] border border-transparent hover:border-[#dec9a5]"
                  role="menuitem"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="size-8 rounded-md flex items-center justify-center shrink-0 border border-[#dec9a5] bg-[#ffffff] text-[#082046] group-hover/item:text-[#0e7bf4] group-hover/item:border-[#082046]/30 transition-colors">
                      <Icon className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#082046] group-hover/item:text-[#0e7bf4] transition-colors leading-snug">
                        {title}
                      </span>
                      <p className="text-[11px] text-[#536780] leading-tight mt-0.5 line-clamp-1">
                        {subtitle}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="size-3.5 text-[#536780]/60 group-hover/item:text-[#0e7bf4] group-hover/item:translate-x-0.5 transition-all shrink-0 mt-1" />
                </Link>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-[#dec9a5]/50 px-2 flex items-center justify-between text-[11px] font-semibold text-[#536780]">
            <span>{language === 'te' ? 'పోలిక అందుబాటులో ఉంది' : language === 'hi' ? 'सीधी तुलना उपलब्ध है' : 'Direct Comparison Available'}</span>
            <Link
              href="/career/colleges/compare"
              onClick={() => setIsOpen(false)}
              className="text-[#0e7bf4] hover:underline flex items-center gap-1 font-bold"
            >
              {t('career_colleges_compare_btn', 'Compare Colleges Tool →')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
