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
  CheckCircle2,
  Send,
  MessageSquare,
} from 'lucide-react';
import { apiPost } from '@/lib/api';

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
  {
    category: 'Pipeline Tracker',
    question: 'Does the Application Tracker sync with the exam board automatically?',
    answer:
      'The Application Tracker is a self-tracked pipeline for personal planning. Because government portals do not offer citizen APIs, stages (Planning, Applied, Exam Date, Roll Number) are entered by you to keep your deadlines and credentials safe in one place.',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  // Report form state
  const [reportNote, setReportNote] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  // Support contact form state
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactFeedback, setContactFeedback] = useState<{ text: string; ticketId?: string; error?: boolean } | null>(null);

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNote.trim()) return;

    setReportSubmitting(true);
    setReportFeedback(null);

    try {
      const res = await apiPost<{ ok: boolean; report_id: string }>('/reports', {
        item_type: 'opportunity',
        item_id: 'general_feedback',
        reason: 'other',
        details: reportNote.trim(),
        reporter_email: reportEmail.trim() || undefined,
      });

      if (res.status === 429) {
        setReportFeedback({
          text: 'Rate limit reached: you can submit up to 5 reports per 15 minutes.',
          error: true,
        });
        return;
      }

      if (res.error || !res.data?.ok) {
        throw new Error(res.error || 'Failed to submit report');
      }

      setReportFeedback({ text: '✓ Report received! Thank you for helping keep ApplyFields accurate.' });
      setReportNote('');
      setReportEmail('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setReportFeedback({ text: msg, error: true });
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMessage.trim() || !contactEmail.trim()) return;

    setContactSubmitting(true);
    setContactFeedback(null);

    try {
      const res = await apiPost<{ ok: boolean; ticket_id: string; message: string }>('/support/contact', {
        name: contactName.trim() || undefined,
        email: contactEmail.trim(),
        subject: contactSubject.trim(),
        message: contactMessage.trim(),
      });

      if (res.error || !res.data?.ok) {
        throw new Error(res.error || 'Failed to submit support ticket.');
      }

      setContactFeedback({
        text: 'Support ticket created successfully! Our team will respond via email within 24 business hours.',
        ticketId: res.data.ticket_id,
      });
      setContactSubject('');
      setContactMessage('');
      setContactEmail('');
      setContactName('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit support ticket';
      setContactFeedback({ text: msg, error: true });
    } finally {
      setContactSubmitting(false);
    }
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
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#536780]" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by topic: eligibility, official links, documents, Aadhaar..."
          className="w-full rounded-2xl border border-[#c4d2e3] bg-white py-3 pl-11 pr-4 text-xs font-medium text-[#082046] shadow-sm outline-none placeholder:text-[#536780] focus:border-[#0e7bf4]"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: FAQs Accordion (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-[#082046] flex items-center gap-2">
            <HelpCircle className="size-5 text-[#0e7bf4]" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-[#c4d2e3] bg-white transition shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-[#082046]"
                  >
                    <span className="pr-4">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="size-4 text-[#0e7bf4] shrink-0" />
                    ) : (
                      <ChevronDown className="size-4 text-[#536780] shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#c4d2e3]/40 p-4 pt-3 text-xs leading-relaxed text-[#435775]">
                      <span className="mb-2 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#0e7bf4]">
                        {faq.category}
                      </span>
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="rounded-2xl border border-[#c4d2e3] bg-white p-8 text-center text-xs text-[#536780]">
                No matching answers found. Try a different query or contact our team below.
              </div>
            )}
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-4 text-xs text-[#435775]">
            <ShieldCheck className="size-4 shrink-0 text-[#0e7bf4] mt-0.5" />
            <p>
              <strong>Official Links Guarantee:</strong> We never charge commission fees for government exam applications. All official URLs redirect directly to government web servers (.gov.in / .nic.in).
            </p>
          </div>
        </div>

        {/* Right Column: Contact & Report Forms */}
        <div className="space-y-6">
          {/* Report Incorrect Info Form */}
          <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="size-5" />
              <h3 className="text-base font-bold text-[#082046]">Report Incorrect Info</h3>
            </div>
            <p className="text-xs text-[#536780]">
              Noticed an outdated syllabus, wrong eligibility date, or broken official URL? Submit details for review.
            </p>

            {reportFeedback ? (
              <div
                className={`rounded-xl border p-4 text-xs font-semibold ${
                  reportFeedback.error
                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                {reportFeedback.text}
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
                <input
                  type="email"
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  placeholder="Your email (optional)"
                  className="w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                />
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="w-full rounded-xl bg-[#082046] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#061835] disabled:opacity-50"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Correction Report'}
                </button>
              </form>
            )}
          </div>

          {/* Direct Support Contact Form */}
          <div className="rounded-2xl border border-[#c4d2e3] bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#082046] flex items-center gap-2">
              <Mail className="size-4.5 text-[#0e7bf4]" /> Contact Support
            </h3>
            <p className="text-xs text-[#536780]">
              Need direct assistance with your account, document vault, or application notifications?
            </p>

            {contactFeedback ? (
              <div
                className={`rounded-xl border p-4 text-xs ${
                  contactFeedback.error
                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>{contactFeedback.text}</span>
                </div>
                {contactFeedback.ticketId && (
                  <p className="mt-2 text-[11px] font-mono text-emerald-700">
                    Ticket Reference: #{contactFeedback.ticketId.slice(0, 8)}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your Name (optional)"
                  className="w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Your Email *"
                  required
                  className="w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                />
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="Subject *"
                  required
                  className="w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                />
                <textarea
                  rows={3}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe your issue or question..."
                  required
                  className="w-full rounded-xl border border-[#c4d2e3] bg-[#F8FBFF] p-3 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                />
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full rounded-xl bg-[#0e7bf4] py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0c6cd7] disabled:opacity-50"
                >
                  {contactSubmitting ? 'Sending...' : 'Send Support Request'}
                </button>
              </form>
            )}

            <div className="pt-2 border-t border-[#c4d2e3]/40 text-[11px] text-[#536780]">
              Email:{' '}
              <a href="mailto:support@applyfields.in" className="text-[#0e7bf4] font-semibold hover:underline">
                support@applyfields.in
              </a>
              <br />
              Response time: typically within 24 business hours.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
