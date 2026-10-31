'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Calendar,
  ExternalLink,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  Building2,
  Bookmark,
  GraduationCap,
  HandHelping,
  Star,
  Trash2,
  Edit2,
  ChevronRight,
  Layers,
  MapPin,
  Check,
  X,
  Info,
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type {
  ApplicationTrackerItem,
  ApplicationTrackerStatus,
  BookingDetail,
  BookingListResponse,
  InstitutionEnquiry,
  InstitutionEnquiryListResponse,
} from '@applyfields/types';
import { Badge, Card, buttonClass } from '@applyfields/ui';
import { formatDate } from '@/lib/format';
import { MOCK_APPLICATIONS, MOCK_BOOKINGS, MOCK_ENQUIRIES } from '@/lib/mock-data';
import { useLanguage } from '@/lib/i18n/language-context';

const PIPELINE_STAGES: { id: ApplicationTrackerStatus; label: string; step: number; color: string }[] = [
  { id: 'saved', label: 'Saved', step: 1, color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { id: 'planning', label: 'Planning', step: 2, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'applied', label: 'Applied', step: 3, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'exam_interview', label: 'Exam / Interview', step: 4, color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'selected', label: 'Selected', step: 5, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'rejected', label: 'Rejected', step: 5, color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'completed', label: 'Completed', step: 6, color: 'bg-teal-100 text-teal-800 border-teal-300' },
];

const MAIN_TABS = [
  { id: 'tracker', label: 'Application Pipeline' },
  { id: 'assistance', label: 'Center Assistance' },
  { id: 'enquiries', label: 'College Inquiries' },
];

export default function ApplicationsPage() {
  const { t } = useLanguage();
  const [mainTab, setMainTab] = useState<'tracker' | 'assistance' | 'enquiries'>('tracker');
  const [pipelineFilter, setPipelineFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getStageLabel = (status: ApplicationTrackerStatus, fallback: string) => {
    switch (status) {
      case 'saved':
        return t('apps_stage_saved', fallback);
      case 'planning':
        return t('apps_stage_planning', fallback);
      case 'applied':
        return t('apps_stage_applied', fallback);
      case 'exam_interview':
        return t('apps_stage_exam', fallback);
      case 'selected':
        return t('apps_stage_selected', fallback);
      case 'rejected':
        return t('apps_stage_rejected', fallback);
      case 'completed':
        return t('apps_stage_completed', fallback);
      default:
        return fallback;
    }
  };

  // Tracker state
  const [applications, setApplications] = useState<ApplicationTrackerItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationTrackerItem | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formOrg, setFormOrg] = useState('');
  const [formStatus, setFormStatus] = useState<ApplicationTrackerStatus>('planning');
  const [formAppNumber, setFormAppNumber] = useState('');
  const [formRollNumber, setFormRollNumber] = useState('');
  const [formExamDate, setFormExamDate] = useState('');
  const [formExamCenter, setFormExamCenter] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Other tabs state
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [enquiries, setEnquiries] = useState<InstitutionEnquiry[]>([]);

  // Fetch applications
  async function loadApplications() {
    setLoadingApps(true);
    try {
      const res = await apiGet<ApplicationTrackerItem[]>('/applications');
      if (res && Array.isArray(res) && res.length > 0) {
        setApplications(res);
      } else {
        setApplications(MOCK_APPLICATIONS);
      }
    } catch {
      setApplications(MOCK_APPLICATIONS);
    } finally {
      setLoadingApps(false);
    }
  }

  useEffect(() => {
    loadApplications();

    // Load bookings & enquiries in background with mock fallbacks for testing
    apiGet<BookingListResponse>('/bookings/my')
      .then((res) => {
        if (res?.items && res.items.length > 0) {
          setBookings(res.items);
        } else {
          setBookings(MOCK_BOOKINGS);
        }
      })
      .catch(() => {
        setBookings(MOCK_BOOKINGS);
      });

    apiGet<InstitutionEnquiryListResponse>('/career/colleges/my-enquiries')
      .then((res) => {
        if (res?.items && res.items.length > 0) {
          setEnquiries(res.items);
        } else {
          setEnquiries(MOCK_ENQUIRIES);
        }
      })
      .catch(() => {
        setEnquiries(MOCK_ENQUIRIES);
      });
  }, []);

  function openAddModal() {
    setFormTitle('');
    setFormOrg('');
    setFormStatus('planning');
    setFormAppNumber('');
    setFormRollNumber('');
    setFormExamDate('');
    setFormExamCenter('');
    setFormNotes('');
    setIsAddModalOpen(true);
  }

  function openEditModal(app: ApplicationTrackerItem) {
    setEditingApp(app);
    setFormTitle(app.title);
    setFormOrg(app.organization);
    setFormStatus(app.status);
    setFormAppNumber(app.application_number || '');
    setFormRollNumber(app.roll_number || '');
    setFormExamDate(app.exam_date || '');
    setFormExamCenter(app.exam_center || '');
    setFormNotes(app.notes || '');
  }

  async function handleSaveApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setSubmitting(true);
    try {
      if (editingApp) {
        const res = await apiPut<ApplicationTrackerItem>(`/applications/${editingApp.id}`, {
          status: formStatus,
          application_number: formAppNumber.trim() || undefined,
          roll_number: formRollNumber.trim() || undefined,
          exam_date: formExamDate || undefined,
          exam_center: formExamCenter.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });

        if (res.error) throw new Error(res.error);
        setFeedbackMsg({ text: `Updated "${formTitle}" successfully.` });
        setEditingApp(null);
      } else {
        const res = await apiPost<ApplicationTrackerItem>('/applications', {
          title: formTitle.trim(),
          organization: formOrg.trim() || 'Recruitment Commission',
          status: formStatus,
          application_number: formAppNumber.trim() || undefined,
          roll_number: formRollNumber.trim() || undefined,
          exam_date: formExamDate || undefined,
          exam_center: formExamCenter.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });

        if (res.error) throw new Error(res.error);
        setFeedbackMsg({ text: `Added "${formTitle}" to your application pipeline.` });
        setIsAddModalOpen(false);
      }
      await loadApplications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setFeedbackMsg({ text: msg, error: true });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdvanceStage(app: ApplicationTrackerItem, nextStatus: ApplicationTrackerStatus) {
    try {
      const res = await apiPut<ApplicationTrackerItem>(`/applications/${app.id}`, {
        status: nextStatus,
      });
      if (res.error) throw new Error(res.error);
      setFeedbackMsg({ text: `Moved to "${nextStatus.replace('_', ' ').toUpperCase()}".` });
      await loadApplications();
    } catch (err: unknown) {
      setFeedbackMsg({ text: 'Failed to update pipeline stage.', error: true });
    }
  }

  async function handleDeleteApplication(id: string, title: string) {
    if (!confirm(`Are you sure you want to remove "${title}" from your tracker?`)) return;

    try {
      await apiDelete(`/applications/${id}`);
      setFeedbackMsg({ text: `Removed "${title}" from your tracker.` });
      await loadApplications();
    } catch {
      setFeedbackMsg({ text: 'Failed to remove application.', error: true });
    }
  }

  const filteredApps = applications.filter((app) => {
    if (pipelineFilter !== 'all' && app.status !== pipelineFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        app.title.toLowerCase().includes(q) ||
        app.organization.toLowerCase().includes(q) ||
        (app.application_number && app.application_number.toLowerCase().includes(q)) ||
        (app.roll_number && app.roll_number.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0e7bf4]">
          <ClipboardList className="size-4" />
          <span>{t('apps_pipeline_title', 'Application Management')}</span>
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#082046] sm:text-3xl">
          {t('nav_applications', 'My Applications')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#435775]">
          {t('apps_pipeline_desc', 'Manage your personal recruitment journey from planning to selection. Track application numbers, exam dates, and roll numbers in one place.')}
        </p>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#c4d2e3] pb-3">
        {MAIN_TABS.map((tab) => {
          const tabLabel =
            tab.id === 'tracker'
              ? t('apps_tab_tracker', tab.label)
              : tab.id === 'assistance'
                ? t('apps_tab_assistance', tab.label)
                : t('apps_tab_enquiries', tab.label);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMainTab(tab.id as any)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                mainTab === tab.id
                  ? 'bg-[#082046] text-white shadow-sm'
                  : 'text-[#435775] hover:bg-[#F0F4F8] hover:text-[#082046]'
              }`}
            >
              {tabLabel}
              {tab.id === 'tracker' && applications.length > 0 && (
                <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {applications.length}
                </span>
              )}
              {tab.id === 'assistance' && bookings.length > 0 && (
                <span className="ml-2 rounded-full bg-[#0e7bf4] px-1.5 py-0.5 text-[10px] text-white">
                  {bookings.length}
                </span>
              )}
              {tab.id === 'enquiries' && enquiries.length > 0 && (
                <span className="ml-2 rounded-full bg-[#0e7bf4] px-1.5 py-0.5 text-[10px] text-white">
                  {enquiries.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback Message */}
      {feedbackMsg && (
        <div
          className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold ${
            feedbackMsg.error
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.error ? (
              <AlertCircle className="size-4 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: APPLICATION TRACKER PIPELINE */}
      {mainTab === 'tracker' && (
        <div className="space-y-6">
          {/* Important Self-Tracked Notice Banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900">
            <Info className="size-4.5 shrink-0 text-blue-600 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="font-bold">{t('apps_banner_notice_title', 'User-Entered Self-Tracked Pipeline:')}</strong>
              <p className="text-blue-800 leading-relaxed">
                {t('apps_banner_notice_desc', 'Statuses and examination details displayed here are recorded by you for tracking and reminder purposes. Official notifications, admit cards, and selection lists are released solely by the respective recruitment commissions.')}
              </p>
            </div>
          </div>

          {/* Controls: Filter & Add Application */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setPipelineFilter('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  pipelineFilter === 'all'
                    ? 'bg-[#082046] text-white shadow-xs'
                    : 'bg-[#F0F4F8] text-[#435775] hover:bg-[#e4ebf3]'
                }`}
              >
                {t('apps_all_filter', 'All')} ({applications.length})
              </button>
              {PIPELINE_STAGES.map((st) => {
                const count = applications.filter((a) => a.status === st.id).length;
                const stageLabel = getStageLabel(st.id, st.label);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setPipelineFilter(st.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      pipelineFilter === st.id
                        ? 'bg-[#082046] text-white shadow-xs'
                        : 'bg-[#F0F4F8] text-[#435775] hover:bg-[#e4ebf3]'
                    }`}
                  >
                    {stageLabel} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0e7bf4] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0c6cd7] shrink-0"
            >
              <Plus className="size-4" />
              {t('apps_btn_add', 'Add Tracked Application')}
            </button>
          </div>

          {/* Applications List */}
          {loadingApps ? (
            <div className="py-12 text-center text-xs text-[#536780]">Loading your applications...</div>
          ) : filteredApps.length === 0 ? (
            <Card className="rounded-3xl border border-[#c4d2e3] bg-white p-12 text-center shadow-sm">
              <ClipboardList className="mx-auto size-12 text-[#c4d2e3]" />
              <h3 className="mt-3 text-base font-bold text-[#082046]">{t('apps_empty_title', 'No applications tracked in this stage')}</h3>
              <p className="mt-1 text-xs text-[#536780] max-w-md mx-auto">
                {t('apps_empty_desc', 'Keep your exam dates, roll numbers, and deadlines organized. Click "Add Tracked Application" or browse jobs to save opportunities directly to your pipeline.')}
              </p>
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#061835]"
              >
                <Plus className="size-4" /> {t('apps_btn_add', 'Add Application Now')}
              </button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApps.map((app) => {
                const currentStageConfig =
                  PIPELINE_STAGES.find((s) => s.id === app.status) || PIPELINE_STAGES[0];
                const activeStageName = getStageLabel(currentStageConfig.id, currentStageConfig.label);

                return (
                  <Card
                    key={app.id}
                    className="rounded-3xl border border-[#c4d2e3] bg-white p-5 shadow-sm transition hover:border-[#0e7bf4]/50"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${currentStageConfig.color}`}
                          >
                            {activeStageName}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#0e7bf4]">
                            {app.organization}
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-[#082046] leading-snug">
                          {app.title}
                        </h3>

                        {/* Pipeline Stages Mini Visualizer */}
                        <div className="pt-2">
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                            {PIPELINE_STAGES.map((s, idx) => {
                              const isCurrent = app.status === s.id;
                              const isPast =
                                PIPELINE_STAGES.findIndex((x) => x.id === app.status) > idx;
                              const sLabel = getStageLabel(s.id, s.label);

                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => handleAdvanceStage(app, s.id)}
                                  title={`Switch status to ${sLabel}`}
                                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                                    isCurrent
                                      ? 'bg-[#082046] text-white'
                                      : isPast
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-[#F0F4F8] text-[#536780] hover:bg-[#e4ebf3]'
                                  }`}
                                >
                                  {isPast && <Check className="size-2.5" />}
                                  {sLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                          {app.application_number && (
                            <div className="rounded-xl bg-[#F8FBFF] p-2.5 border border-[#c4d2e3]/60">
                              <span className="text-[10px] font-bold uppercase text-[#536780]">
                                {t('apps_label_app_number', 'App Number')}
                              </span>
                              <p className="font-mono font-bold text-[#082046]">
                                {app.application_number}
                              </p>
                            </div>
                          )}

                          {app.roll_number && (
                            <div className="rounded-xl bg-[#F8FBFF] p-2.5 border border-[#c4d2e3]/60">
                              <span className="text-[10px] font-bold uppercase text-[#536780]">
                                {t('apps_label_roll_number', 'Roll Number')}
                              </span>
                              <p className="font-mono font-bold text-[#082046]">{app.roll_number}</p>
                            </div>
                          )}

                          {app.exam_date && (
                            <div className="rounded-xl bg-[#F8FBFF] p-2.5 border border-[#c4d2e3]/60">
                              <span className="text-[10px] font-bold uppercase text-[#536780] flex items-center gap-1">
                                <Calendar className="size-3 text-[#0e7bf4]" /> {t('apps_label_exam_date', 'Exam Date')}
                              </span>
                              <p className="font-bold text-[#082046]">{app.exam_date}</p>
                            </div>
                          )}

                          {app.exam_center && (
                            <div className="rounded-xl bg-[#F8FBFF] p-2.5 border border-[#c4d2e3]/60">
                              <span className="text-[10px] font-bold uppercase text-[#536780] flex items-center gap-1">
                                <MapPin className="size-3 text-[#0e7bf4]" /> {t('apps_label_center', 'Center')}
                              </span>
                              <p className="font-bold text-[#082046] truncate">{app.exam_center}</p>
                            </div>
                          )}
                        </div>

                        {app.notes && (
                          <div className="mt-2 rounded-xl bg-[#FFFDF0] p-2.5 border border-amber-200 text-xs text-amber-900">
                            <span className="font-bold">{t('apps_label_notes', 'Notes')}: </span>
                            {app.notes}
                          </div>
                        )}
                      </div>

                      {/* Item Actions */}
                      <div className="flex sm:flex-col items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(app)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#c4d2e3] bg-white px-3 py-1.5 text-xs font-bold text-[#082046] shadow-xs hover:bg-[#F0F4F8]"
                        >
                          <Edit2 className="size-3.5 text-[#0e7bf4]" />
                          {t('apps_btn_edit', 'Edit Details')}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteApplication(app.id, app.title)}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 shadow-xs hover:bg-rose-50"
                        >
                          <Trash2 className="size-3.5" />
                          {t('apps_btn_delete', 'Delete')}
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CENTER ASSISTANCE BOOKINGS */}
      {mainTab === 'assistance' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-4 text-xs text-[#536780]">
            {t('apps_assistance_desc', 'In-person application form submission sessions booked with our network of digital centers.')}
          </div>

          {bookings.length === 0 ? (
            <Card className="rounded-3xl border border-[#c4d2e3] bg-white p-12 text-center">
              <HandHelping className="mx-auto size-12 text-[#c4d2e3]" />
              <h3 className="mt-3 text-base font-bold text-[#082046]">{t('apps_assistance_empty_title', 'No center assistance bookings yet')}</h3>
              <p className="mt-1 text-xs text-[#536780]">
                {t('apps_assistance_empty_desc', 'Need help uploading certificates or filling government forms? Visit our Assisted Apply centers.')}
              </p>
              <Link
                href="/services"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#061835]"
              >
                {t('apps_assistance_browse_btn', 'Browse Services & Assistance')}
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Card key={b.id} className="rounded-2xl border border-[#c4d2e3] bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#0e7bf4]">
                        Booking Ref: #{b.id.slice(0, 8)}
                      </span>
                      <h4 className="text-sm font-bold text-[#082046]">
                        {b.service_name || 'Government Service Assistance'}
                      </h4>
                      <p className="text-xs text-[#536780]">{b.partner_business_name}</p>
                    </div>
                    <Badge tone={b.status === 'completed' ? 'teal' : 'tea'}>
                      {b.status.toUpperCase()}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: COLLEGE ADMISSION INQUIRIES */}
      {mainTab === 'enquiries' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#c4d2e3] bg-[#F8FBFF] p-4 text-xs text-[#536780]">
            {t('apps_enquiries_desc', 'Official admission inquiries sent to accredited degree colleges and universities.')}
          </div>

          {enquiries.length === 0 ? (
            <Card className="rounded-3xl border border-[#c4d2e3] bg-white p-12 text-center">
              <GraduationCap className="mx-auto size-12 text-[#c4d2e3]" />
              <h3 className="mt-3 text-base font-bold text-[#082046]">{t('apps_enquiries_empty_title', 'No college inquiries yet')}</h3>
              <p className="mt-1 text-xs text-[#536780]">
                {t('apps_enquiries_empty_desc', 'Explore verified universities, engineering institutes, and degree colleges on ApplyFields.')}
              </p>
              <Link
                href="/career"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#082046] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#061835]"
              >
                {t('apps_enquiries_browse_btn', 'Explore Colleges & Degrees')}
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {enquiries.map((enq) => (
                <Card key={enq.id} className="rounded-2xl border border-[#c4d2e3] bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#082046]">{enq.institution_name}</h4>
                      <p className="text-xs text-[#536780]">{enq.course_name || 'General Admission'}</p>
                    </div>
                    <Badge tone="tea">{enq.status.toUpperCase()}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT APPLICATION MODAL */}
      {(isAddModalOpen || editingApp) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[#c4d2e3] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#c4d2e3]/60 pb-3">
              <h3 className="text-base font-bold text-[#082046]">
                {editingApp ? t('apps_modal_edit_title', 'Edit Application Details') : t('apps_modal_add_title', 'Track New Application')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingApp(null);
                }}
                className="rounded-lg p-1 text-[#536780] hover:bg-[#F0F4F8]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveApplication} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#082046]">
                  {t('apps_form_title', 'Exam / Job Recruitment Title')}
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. SSC CGL 2026 or UPSC Civil Services"
                  required
                  className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#082046]">{t('apps_form_org', 'Commission / Org')}</label>
                  <input
                    type="text"
                    value={formOrg}
                    onChange={(e) => setFormOrg(e.target.value)}
                    placeholder="e.g. SSC, UPSC, IBPS"
                    className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#082046]">{t('apps_form_stage', 'Pipeline Stage')}</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {getStageLabel(s.id, s.label)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#082046]">
                    {t('apps_form_app_num', 'Application / Registration Number')}
                  </label>
                  <input
                    type="text"
                    value={formAppNumber}
                    onChange={(e) => setFormAppNumber(e.target.value)}
                    placeholder="e.g. 2401098231"
                    className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs font-mono text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#082046]">{t('apps_form_roll_num', 'Roll Number')}</label>
                  <input
                    type="text"
                    value={formRollNumber}
                    onChange={(e) => setFormRollNumber(e.target.value)}
                    placeholder="e.g. 1002345"
                    className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs font-mono text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#082046]">{t('apps_form_exam_date', 'Exam Date')}</label>
                  <input
                    type="date"
                    value={formExamDate}
                    onChange={(e) => setFormExamDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#082046]">{t('apps_form_exam_center', 'Exam Center City')}</label>
                  <input
                    type="text"
                    value={formExamCenter}
                    onChange={(e) => setFormExamCenter(e.target.value)}
                    placeholder="e.g. Hyderabad / Delhi"
                    className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082046]">{t('apps_form_notes', 'Personal Notes')}</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Notes on syllabus revision, certificate renewals, shift time, etc."
                  className="mt-1 w-full rounded-xl border border-[#c4d2e3] bg-white p-2.5 text-xs text-[#082046] outline-none focus:border-[#0e7bf4]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#c4d2e3]/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingApp(null);
                  }}
                  className="rounded-xl border border-[#c4d2e3] px-4 py-2 text-xs font-semibold text-[#536780] hover:bg-[#F0F4F8]"
                >
                  {t('btn_cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#082046] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#061835] disabled:opacity-50"
                >
                  {submitting ? t('profile_btn_saving', 'Saving...') : editingApp ? t('apps_btn_update', 'Update Application') : t('apps_btn_save_pipeline', 'Save to Pipeline')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
