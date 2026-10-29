'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import {
  HorizontalOpportunityCard,
  type ExtendedOpportunityCard,
} from '@/components/opportunity/horizontal-opportunity-card';
import { apiGet } from '@/lib/api';
import type { OpportunityList } from '@applyfields/types';
import { useLanguage } from '@/lib/i18n/language-context';

export default function ApplyPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [opportunities, setOpportunities] = useState<ExtendedOpportunityCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  // Filters state
  const [typeFilter, setTypeFilter] = useState('Any');
  const [educationFilter, setEducationFilter] = useState('Any');
  const [locationFilter, setLocationFilter] = useState('Any');
  const [deadlineFilter, setDeadlineFilter] = useState('Any');
  const [eligibilityFilter, setEligibilityFilter] = useState('Any');
  const [orgFilter, setOrgFilter] = useState('Any');

  const categoryTabs = [
    { id: 'all', label: t('apply_tab_all', 'All') },
    { id: 'govt_job', label: t('apply_tab_jobs', 'Government Jobs') },
    { id: 'exam', label: t('apply_tab_exams', 'Exams') },
    { id: 'scholarship', label: t('apply_tab_scholarships', 'Scholarships') },
    { id: 'admission', label: t('apply_tab_admissions', 'Admissions') },
    { id: 'service', label: t('apply_tab_services', 'Government Services') },
  ];

  // Pre-load user state filter from settings if set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('applyfields_pref_state');
      if (savedState && savedState !== 'ALL') {
        const stateNameMap: Record<string, string> = {
          TG: 'Telangana',
          AP: 'Andhra Pradesh',
          KA: 'Karnataka',
          MH: 'Maharashtra',
          DL: 'Delhi',
          TN: 'Tamil Nadu',
        };
        if (stateNameMap[savedState]) {
          setLocationFilter(stateNameMap[savedState]);
        }
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (activeTab !== 'all') {
      queryParams.set('type', activeTab);
    }
    if (searchQuery.trim()) {
      queryParams.set('q', searchQuery.trim());
    }

    apiGet<OpportunityList>(`/opportunities?${queryParams.toString()}`)
      .then((res) => {
        setOpportunities(res && !res.sample ? res.items : []);
        setApiUnavailable(!res);
      })
      .finally(() => setLoading(false));
  }, [activeTab, searchQuery]);

  // Client-side filtering based on dropdowns
  const filteredList = opportunities.filter((item) => {
    if (activeTab !== 'all' && item.type !== activeTab) return false;
    if (educationFilter !== 'Any') {
      if (!item.qualification?.toLowerCase().includes(educationFilter.toLowerCase())) return false;
    }
    if (locationFilter !== 'Any') {
      if (!item.location?.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <section className="border-y border-[#c4d2e3] bg-[#DCE7F3]">
        <div className="mx-auto max-w-[1360px] space-y-5 px-4 pt-8 pb-7 sm:pt-10 sm:pb-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#082046] sm:text-3xl">
              {t('apply_page_title', 'Apply')}
            </h1>
            <p className="mt-1 text-sm text-[#435775]">
              {t('apply_page_subtitle', 'Find an opportunity, check eligibility and go to the official application route.')}
            </p>
          </div>

          <div className="flex max-w-3xl items-center gap-2">
            <div className="flex flex-1 items-center rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-4 py-3 shadow-sm transition focus-within:border-[#0e7bf4] focus-within:ring-2 focus-within:ring-blue-100">
              <Search className="mr-2 size-4 shrink-0 text-[#435775]" />
              <input
                type="text"
                placeholder={t('apply_search_placeholder', 'Search jobs, exams, scholarships, careers, courses...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-[#082046] outline-none placeholder:text-[#64748b]"
              />
            </div>
            <button
              type="button"
              className="shrink-0 rounded-xl bg-[#0e7bf4] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0c6fdc]"
            >
              {t('apply_search_btn', 'Search')}
            </button>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto border-b border-[#c4d2e3] scrollbar-none">
            {categoryTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#F0F4F8] text-[#082046] font-bold border-b-2 border-[#0e7bf4]'
                      : 'text-[#435775] hover:bg-white/60 hover:text-[#082046]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1360px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        {/* Secondary Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#435775]">
          <div className="flex flex-wrap items-center gap-2">
            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 font-medium text-[#243b5b] outline-none transition-colors hover:border-[#91a8c7]"
            >
              <option value="Any">{t('apply_filter_type', 'Type')}: Any</option>
              <option value="govt_job">{t('apply_tab_jobs', 'Government Jobs')}</option>
              <option value="exam">{t('apply_tab_exams', 'Exams')}</option>
              <option value="scholarship">{t('apply_tab_scholarships', 'Scholarships')}</option>
              <option value="admission">{t('apply_tab_admissions', 'Admissions')}</option>
            </select>

            {/* Education */}
            <select
              value={educationFilter}
              onChange={(e) => setEducationFilter(e.target.value)}
              className="rounded-lg border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 font-medium text-[#243b5b] outline-none transition-colors hover:border-[#91a8c7]"
            >
              <option value="Any">{t('apply_filter_education', 'Education')}: Any</option>
              <option value="Graduate">Bachelor&apos;s degree</option>
              <option value="12th">Class 12th pass</option>
              <option value="10th">Class 10th pass</option>
            </select>

            {/* Location */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-lg border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 font-medium text-[#243b5b] outline-none transition-colors hover:border-[#91a8c7]"
            >
              <option value="Any">{t('apply_filter_location', 'Location')}: Any</option>
              <option value="All India">All India</option>
              <option value="Telangana">Telangana</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Delhi">Delhi</option>
            </select>

            {/* Deadline */}
            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
              className="rounded-lg border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 font-medium text-[#243b5b] outline-none transition-colors hover:border-[#91a8c7]"
            >
              <option value="Any">{t('apply_filter_deadline', 'Deadline')}: Any</option>
              <option value="7d">Closing in 7 days</option>
              <option value="30d">Closing in 30 days</option>
            </select>

            {/* Eligibility */}
            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value)}
              className="rounded-lg border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 font-medium text-[#243b5b] outline-none transition-colors hover:border-[#91a8c7]"
            >
              <option value="Any">{t('apply_filter_eligibility', 'Eligibility')}: Any</option>
              <option value="eligible">Eligible for me</option>
            </select>

            {/* Organization */}
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="rounded-lg border border-[#c4d2e3] bg-[#F8FBFF] px-3 py-2 font-medium text-[#243b5b] outline-none transition-colors hover:border-[#91a8c7]"
            >
              <option value="Any">{t('apply_filter_authority', 'Authority')}: Any</option>
              <option value="SSC">SSC</option>
              <option value="UPSC">UPSC</option>
              <option value="NTA">NTA</option>
              <option value="IBPS">IBPS</option>
            </select>
          </div>

          {/* Results count */}
          <span className="text-sm font-medium text-[#435775]">
            {filteredList.length} results
          </span>
        </div>

        {/* Opportunity List Rows */}
        <div className="space-y-3 border-t border-[#c4d2e3] pt-4">
          {loading ? (
            <p className="rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] p-6 text-sm text-[#435775]">Loading opportunities…</p>
          ) : filteredList.length ? (
            filteredList.map((item) => <HorizontalOpportunityCard key={item.slug} item={item} />)
          ) : (
            <div className="rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-8 text-center space-y-2">
              <h3 className="text-base font-black text-[#082046]">{t('apply_empty_title')}</h3>
              <p className="text-xs text-[#526987]">
                {apiUnavailable ? 'Opportunities are temporarily unavailable. Please try again shortly.' : t('apply_empty_desc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
