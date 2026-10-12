'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LifeBuoy,
  Search,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Mail,
  AlertTriangle,
  FileCheck2,
  Bell,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Applying & Links',
    question: 'Is ApplyFields an official government website?',
    answer:
      'No. ApplyFields is an independent guidance and discovery platform for Indian citizens and students. We never host payment gateways for official application fees or issue admit cards ourselves. Every opportunity listing displays a direct, verified link to the official commission portal (such as ssc.gov.in, upsc.gov.in, or state recruitment portals).',
  },
  {
    category: 'Applying & Links',
    question: 'How do you verify official links?',
    answer:
      'Our team and automated scrapers verify government domain origins (.gov.in, .nic.in, or accredited university domains). We reject phishing portals, unofficial private job boards, and unauthorized intermediaries.',
  },
  {
    category: 'Eligibility',
    question: 'How does the Eligibility Check work?',
    answer:
      'We compare your date of birth, highest completed educational qualification, social reservation category (General, OBC, SC, ST, EWS), and state domicile against the exact eligibility clauses in the official notification. Age relaxations (e.g. +3 years for OBC, +5 years for SC/ST) are calculated against the specific cut-off date stated in the gazette notice.',
  },
  {
    category: 'Notifications',
    question: 'When will I receive deadline reminders?',
    answer:
      'When you save a recruitment notice and enable notifications, you receive reminders 7 days, 3 days, and 24 hours before the application window closes. You will also receive alerts when hall tickets/admit cards or final results are published.',
  },
  {
    category: 'Documents',
    question: 'Are my uploaded certificates and resumes safe?',
    answer:
      'Yes. Your documents in My Documents are stored in an encrypted, private vault accessible only by you. We mask sensitive identifiers such as Aadhaar numbers to the last 4 digits.',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [reportNote, setReportNote] = useState('');

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNote.trim()) return;
    setFeedbackSent(true);
    setReportNote('');
    setTimeout(() => setFeedbackSent(false), 5000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
          <LifeBuoy className="size-4" />
          <span>Support &amp; Knowledge Base</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
          Help Centre &amp; FAQs
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#435775]">
          Clear answers about official application processes, eligibility verification rules, deadline alerts, and reporting inaccurate data.
        </p>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-[#c4d2e3] bg-white p-5 shadow-sm">
        <div className="flex items-center rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] px-4 py-3">
          <Search className="mr-3 size-4 text-[#536780]" />
          <input
            type="text"
            placeholder="Search FAQs, official procedures, or guidelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-[#082046] outline-none placeholder:text-[#71839b]"
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left Column: FAQs */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#082046]">Frequently Asked Questions</h2>

          <div className="space-y-3">
            {filteredFaqs.map((faq, i) => {
              const isOpen = openIdx === i;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-[#c4d2e3] bg-white overflow-hidden shadow-sm transition hover:border-[#91a8c7]"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(i)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-[#082046]"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="size-4 text-[#0e7bf4] shrink-0" />
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="size-4 text-[#536780] shrink-0" />
                    ) : (
                      <ChevronDown className="size-4 text-[#536780] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-[#F8FBFF] p-5 text-xs sm:text-sm leading-relaxed text-[#435775]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-4 text-xs text-[#435775]">
            <ShieldCheck className="size-4 shrink-0 text-[#0e7bf4] mt-0.5" />
            <p>
              <strong>Official Links Guarantee:</strong> We never charge commission fees for government exam applications. All official URLs redirect directly to government web servers (.gov.in / .nic.in).
            </p>
          </div>
        </div>

        {/* Right Column: Contact & Report Form */}
        <div className="space-y-6">
          {/* Report Incorrect Info Form */}
          <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="size-5" />
              <h3 className="text-base font-bold text-[#082046]">Report Incorrect Information</h3>
            </div>
            <p className="text-xs text-[#536780]">
              Noticed an outdated syllabus, wrong eligibility date, or broken official URL? Submit details below for fast review by our editorial team.
            </p>

            {feedbackSent ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 font-semibold">
                ✓ Thank you. Your report has been submitted to our moderation queue.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <textarea
                  rows={3}
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Describe the issue (mention the post/exam name and correct official link)..."
                  className="w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] p-3 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  required
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#082046] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#061835]"
                >
                  Submit Correction Report
                </button>
              </form>
            )}
          </div>

          {/* Direct Support Contact */}
          <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#082046] flex items-center gap-2">
              <Mail className="size-4 text-[#0e7bf4]" /> Contact Support
            </h3>
            <p className="text-xs text-[#536780]">
              Need direct assistance with your account, profile, or notifications?
            </p>
            <p className="text-xs font-semibold text-[#082046]">
              Email:{' '}
              <a href="mailto:support@applyfields.in" className="text-[#0e7bf4] hover:underline">
                support@applyfields.in
              </a>
            </p>
            <p className="text-[11px] text-[#536780]">
              Response time: typically within 24 business hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
