'use client';

import React, { useState } from 'react';
import type { CreateInstitutionEnquiryInput, InstitutionEnquiry } from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  CheckCircle2,
  GraduationCap,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Send,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

interface CourseOption {
  id: string;
  name: string;
  level: string;
}

interface EnquiryDialogProps {
  collegeSlug: string;
  collegeName: string;
  courses: CourseOption[];
}

export function EnquiryDialog({
  collegeSlug,
  collegeName,
  courses,
}: EnquiryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [courseId, setCourseId] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEnquiry, setSubmittedEnquiry] = useState<InstitutionEnquiry | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone.match(/^(\+91)?[6-9]\d{9}$/)) {
      setError('Please provide a valid 10-digit Indian mobile number.');
      return;
    }

    if (message.trim().length < 5) {
      setError('Please enter a specific enquiry message (at least 5 characters).');
      return;
    }

    setSubmitting(true);

    const payload: CreateInstitutionEnquiryInput = {
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim() || undefined,
      course_id: courseId || undefined,
      message: message.trim(),
    };

    const res = await apiPost<InstitutionEnquiry, CreateInstitutionEnquiryInput>(
      `/career/colleges/${collegeSlug}/enquiries`,
      payload,
    );

    setSubmitting(false);

    if (res.data) {
      setSubmittedEnquiry(res.data);
    } else {
      setError(res.error || 'Failed to submit admission enquiry. Please check fields.');
    }
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setEmail('');
    setCourseId('');
    setMessage('');
    setError(null);
    setSubmittedEnquiry(null);
    setIsOpen(false);
  };

  return (
    <>
      {/* College Desk Card Trigger */}
      <Card className="p-6 border-line/80 bg-gradient-to-br from-canvas via-cream/30 to-canvas shadow-card">
        <div className="flex items-center gap-2.5 text-teal">
          <div className="grid size-9 place-items-center rounded-xl bg-teal/10 text-teal">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-teal">Admission Inquiry Desk</h3>
            <p className="text-[11px] font-medium text-teal/70">Direct Verification &amp; Counseling</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-teal/80 leading-relaxed">
          Connect directly with the verified admission office of <strong>{collegeName}</strong>. Ask about cutoff ranks, seat quotas, hostel availability, and tuition fees.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setSubmittedEnquiry(null);
              setError(null);
              setIsOpen(true);
            }}
            className={buttonClass({
              variant: 'primary',
              size: 'sm',
              className: 'w-full justify-center gap-2 shadow-clay',
            })}
          >
            <MessageSquare className="size-3.5" /> Submit Admission Inquiry
          </button>
          <span className="text-[10px] text-center text-teal/60 font-medium">
            🔒 Official inquiries are recorded and tracked in real-time
          </span>
        </div>
      </Card>

      {/* Interactive Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl border border-line bg-canvas p-6 sm:p-7 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleReset}
              className="absolute right-5 top-5 grid size-8 place-items-center rounded-full text-teal/70 hover:bg-cream hover:text-teal"
              aria-label="Close dialog"
            >
              <X className="size-4" />
            </button>

            {submittedEnquiry ? (
              /* Success View */
              <div className="space-y-5 text-center py-4">
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-teal">Inquiry Sent Successfully!</h3>
                  <p className="mt-1 text-xs text-teal/70">
                    Your admission inquiry has been forwarded directly to <strong>{collegeName}</strong>.
                  </p>
                </div>

                <div className="rounded-2xl border border-line/60 bg-cream/40 p-4 text-left text-xs space-y-2">
                  <div className="flex justify-between items-center text-teal/70">
                    <span>Reference ID:</span>
                    <span className="font-mono font-bold text-teal">{submittedEnquiry.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between items-center text-teal/70">
                    <span>Initial Status:</span>
                    <Badge tone="tea" className="text-[10px] font-bold uppercase">
                      {submittedEnquiry.status}
                    </Badge>
                  </div>
                  {submittedEnquiry.course_name && (
                    <div className="flex justify-between items-center text-teal/70">
                      <span>Target Course:</span>
                      <span className="font-semibold text-teal truncate max-w-[200px]">
                        {submittedEnquiry.course_name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Link
                    href="/applications"
                    className={buttonClass({
                      variant: 'primary',
                      size: 'sm',
                      className: 'w-full justify-center gap-1.5',
                    })}
                  >
                    View in Applications Tracker →
                  </Link>
                  <button
                    type="button"
                    onClick={handleReset}
                    className={buttonClass({
                      variant: 'ghost',
                      size: 'sm',
                      className: 'w-full justify-center',
                    })}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Inquiry Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Badge tone="celadon" className="text-[10px] font-bold uppercase">
                    Admissions Desk
                  </Badge>
                  <h3 className="mt-1 text-base sm:text-lg font-bold text-teal">
                    Inquire at {collegeName}
                  </h3>
                  <p className="text-xs text-teal/70">
                    Fill out your query below. The college admissions team will review your inquiry.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    {error}
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-teal mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-teal/50" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-xs text-teal focus:border-teal focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-teal mb-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-teal/50" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="10-digit number"
                          className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-xs text-teal focus:border-teal focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-teal mb-1">
                        Email Address (Optional)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-teal/50" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="w-full rounded-xl border border-line bg-canvas pl-9 pr-3 py-2 text-xs text-teal focus:border-teal focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {courses.length > 0 && (
                    <div>
                      <label className="block font-semibold text-teal mb-1">
                        Interested Program / Course (Optional)
                      </label>
                      <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-teal focus:border-teal focus:outline-none"
                      >
                        <option value="">General College Admission Inquiry</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.level.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-teal mb-1">
                      Your Message or Questions <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g. What is the expected cutoff rank for CSE? What are the hostel fees and admission dates?"
                      className="w-full rounded-xl border border-line bg-canvas p-3 text-xs text-teal focus:border-teal focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className={buttonClass({ variant: 'ghost', size: 'sm' })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={buttonClass({
                      variant: 'primary',
                      size: 'sm',
                      className: 'gap-1.5 shadow-clay',
                    })}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5" /> Submit to Desk
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
