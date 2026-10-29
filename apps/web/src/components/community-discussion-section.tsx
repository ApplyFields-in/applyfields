'use client';

import React, { useState, useEffect } from 'react';
import type {
  CommunityComment,
  CommunityThread,
  CommunityThreadCategory,
  CommunityThreadListResponse,
  CreateCommentInput,
  CreateThreadInput,
  ReportContentInput,
  ToggleUpvoteResponse,
} from '@applyfields/types';
import { Badge, buttonClass, Card, cn } from '@applyfields/ui';
import {
  AlertTriangle,
  ArrowUp,
  CheckCircle2,
  Flag,
  HelpCircle,
  Loader2,
  Lock,
  MessageCircle,
  MessageSquare,
  Pin,
  Plus,
  Send,
  User,
  X,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { formatDate } from '@/lib/format';
import { useLanguage } from '@/lib/i18n/language-context';

interface CommunityDiscussionSectionProps {
  opportunityId?: string;
  opportunityTitle?: string;
}

const CATEGORY_TABS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Discussions' },
  { id: 'admit_card', label: 'Admit Card & Centers' },
  { id: 'exam_prep', label: 'Exam Preparation' },
  { id: 'syllabus', label: 'Syllabus & Pattern' },
  { id: 'result', label: 'Results & Cutoffs' },
  { id: 'general', label: 'General Q&A' },
];

export function CommunityDiscussionSection({
  opportunityId,
  opportunityTitle,
}: CommunityDiscussionSectionProps) {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryTabs = [
    { id: 'all', label: t('community_tab_all', 'All Discussions') },
    { id: 'admit_card', label: t('community_tab_admit_card', 'Admit Card & Centers') },
    { id: 'exam_prep', label: t('community_tab_exam_prep', 'Exam Preparation') },
    { id: 'syllabus', label: t('community_tab_syllabus', 'Syllabus & Pattern') },
    { id: 'result', label: t('community_tab_result', 'Results & Cutoffs') },
    { id: 'general', label: t('community_tab_general', 'General Q&A') },
  ];

  // New Thread Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CommunityThreadCategory>('general');
  const [newContent, setNewContent] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [submittingThread, setSubmittingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  // Expanded Comments State
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [threadId: string]: string }>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  // Report Modal
  const [reportingItem, setReportingItem] = useState<{ type: 'thread' | 'comment'; id: string } | null>(null);
  const [reportReason, setReportReason] = useState<ReportContentInput['reason']>('incorrect_info');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const loadThreads = () => {
    setLoading(true);
    const query = new URLSearchParams();
    if (opportunityId) query.set('opportunityId', opportunityId);
    if (activeCategory !== 'all') query.set('category', activeCategory);

    apiGet<CommunityThreadListResponse>(`/community/threads?${query.toString()}`)
      .then((res) => {
        if (res?.items) {
          setThreads(res.items);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadThreads();
  }, [opportunityId, activeCategory]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setThreadError(null);

    if (newTitle.trim().length < 5) {
      setThreadError('Title must be at least 5 characters long.');
      return;
    }
    if (newContent.trim().length < 10) {
      setThreadError('Please write at least 10 characters for your discussion or question.');
      return;
    }

    setSubmittingThread(true);
    const payload: CreateThreadInput = {
      opportunity_id: opportunityId || undefined,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      author_name: newAuthor.trim() || undefined,
    };

    const res = await apiPost<CommunityThread, CreateThreadInput>('/community/threads', payload);
    setSubmittingThread(false);

    if (res.data) {
      setThreads((prev) => [res.data!, ...prev]);
      setIsNewModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewAuthor('');
    } else {
      setThreadError(res.error || 'Failed to submit discussion thread.');
    }
  };

  const handleToggleUpvote = async (threadId: string) => {
    const res = await apiPost<ToggleUpvoteResponse, { thread_id: string }>('/community/upvote', {
      thread_id: threadId,
    });

    if (res.data) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, upvotes_count: res.data!.upvotes_count, user_has_upvoted: res.data!.upvoted }
            : t,
        ),
      );
    }
  };

  const handleAddComment = async (threadId: string) => {
    const text = replyText[threadId]?.trim();
    if (!text || text.length < 2) return;

    setSubmittingReply(threadId);
    const res = await apiPost<CommunityComment, CreateCommentInput>(
      `/community/threads/${threadId}/comments`,
      { content: text },
    );
    setSubmittingReply(null);

    if (res.data) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                replies_count: t.replies_count + 1,
                comments: [...(t.comments || []), res.data!],
              }
            : t,
        ),
      );
      setReplyText((prev) => ({ ...prev, [threadId]: '' }));
    }
  };

  const handleOpenThreadDetails = async (threadId: string) => {
    if (expandedThreadId === threadId) {
      setExpandedThreadId(null);
      return;
    }
    setExpandedThreadId(threadId);

    // Fetch full thread with comments
    const res = await apiGet<CommunityThread>(`/community/threads/${threadId}`);
    if (res) {
      setThreads((prev) => prev.map((t) => (t.id === threadId ? res : t)));
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingItem) return;

    setSubmittingReport(true);
    const payload: ReportContentInput = {
      item_type: 'opportunity',
      item_id: reportingItem.id,
      reason: reportReason,
      details: reportDetails.trim() || undefined,
    };

    const res = await apiPost<{ report_id: string; message: string }, ReportContentInput>(
      '/community/report',
      payload,
    );
    setSubmittingReport(false);

    if (res.data) {
      setReportSuccess(true);
      setTimeout(() => {
        setReportingItem(null);
        setReportSuccess(false);
        setReportDetails('');
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line/60 pb-4">
        <div>
          <div className="flex items-center gap-2 text-teal">
            <MessageSquare className="size-5" />
            <h2 className="text-lg font-bold text-teal">{t('community_title', 'Candidate Community & Q&A')}</h2>
          </div>
          <p className="mt-1 text-xs text-teal/70">
            {opportunityTitle
              ? `Discussion, hall tickets, cutoff estimates, and center updates for ${opportunityTitle}`
              : t('community_desc', 'Official and candidate peer discussions on exam preparation, syllabus, admit cards, and results.')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setThreadError(null);
            setIsNewModalOpen(true);
          }}
          className={buttonClass({
            variant: 'primary',
            size: 'sm',
            className: 'gap-1.5 shadow-clay shrink-0',
          })}
        >
          <Plus className="size-3.5" /> {t('community_btn_new_thread', 'Ask Question / Start Topic')}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {categoryTabs.map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-teal text-white shadow-sm'
                  : 'bg-canvas text-teal/70 border border-line/60 hover:bg-cream hover:text-teal'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Threads List or Empty State */}
      {loading ? (
        <div className="rounded-2xl border border-line/60 bg-cream/20 p-8 text-center text-xs text-teal/70">
          Loading discussion threads...
        </div>
      ) : threads.length === 0 ? (
        <Card className="p-10 text-center space-y-3 bg-cream/20 border-line/60">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-teal/10 text-teal">
            <MessageCircle className="size-6" />
          </div>
          <h3 className="text-base font-bold text-teal">No discussion threads in this category yet</h3>
          <p className="text-xs text-teal/70 max-w-sm mx-auto">
            Be the first candidate to start a discussion or ask about admit cards, syllabus, or exam centers!
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className={buttonClass({ variant: 'secondary', size: 'sm', className: 'gap-1.5' })}
            >
              <Plus className="size-3.5" /> Post First Question
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map((tItem) => {
            const isExpanded = expandedThreadId === tItem.id;
            return (
              <Card
                key={tItem.id}
                className="p-5 border-line/70 hover:border-teal/40 transition-all space-y-3 bg-white"
              >
                {/* Top Row: Category Badge, Author & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tone="tea" className="text-[10px] uppercase font-bold">
                      {tItem.category.replace('_', ' ')}
                    </Badge>
                    {tItem.is_pinned && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                        <Pin className="size-2.5" /> Pinned
                      </span>
                    )}
                    {tItem.is_locked && (
                      <span className="flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
                        <Lock className="size-2.5" /> Locked
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-teal/70">
                    <span className="flex items-center gap-1">
                      <User className="size-3 text-teal/50" /> {tItem.author_name}
                    </span>
                    <span>·</span>
                    <span>{formatDate(tItem.created_at)}</span>
                    <button
                      type="button"
                      onClick={() => setReportingItem({ type: 'thread', id: tItem.id })}
                      className="text-teal/40 hover:text-rose-600 transition-colors"
                      title="Report incorrect information or abuse"
                    >
                      <Flag className="size-3" />
                    </button>
                  </div>
                </div>

                {/* Title & Content */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-teal leading-snug">
                    {tItem.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-teal/80 leading-relaxed whitespace-pre-line">
                    {tItem.content}
                  </p>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-line/40">
                  <div className="flex items-center gap-3">
                    {/* Upvote button */}
                    <button
                      type="button"
                      onClick={() => handleToggleUpvote(tItem.id)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                        tItem.user_has_upvoted
                          ? 'bg-[#0e7bf4] text-white shadow-sm'
                          : 'bg-canvas text-teal/70 border border-line/60 hover:bg-cream hover:text-teal'
                      }`}
                    >
                      <ArrowUp className="size-3" />
                      <span>{tItem.upvotes_count}</span>
                    </button>

                    {/* Replies button */}
                    <button
                      type="button"
                      onClick={() => handleOpenThreadDetails(tItem.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal/70 hover:text-teal transition-colors"
                    >
                      <MessageCircle className="size-3.5" />
                      <span>{tItem.replies_count} Replies</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenThreadDetails(tItem.id)}
                    className="text-xs font-bold text-[#0e7bf4] hover:underline"
                  >
                    {isExpanded ? 'Hide Discussion' : 'View Discussion →'}
                  </button>
                </div>

                {/* Expandable Replies Section */}
                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-line/60 space-y-3 animate-in fade-in duration-200">
                    <h4 className="text-xs font-bold text-teal uppercase tracking-wider">
                      Replies &amp; Peer Answers ({tItem.comments?.length ?? 0})
                    </h4>

                    {tItem.comments && tItem.comments.length > 0 ? (
                      <div className="space-y-2">
                        {tItem.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="rounded-xl border border-line/60 bg-canvas/40 p-3 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px] text-teal/60">
                              <span className="font-bold text-teal flex items-center gap-1">
                                {comment.author_name}
                                {comment.is_official_answer && (
                                  <Badge tone="celadon" className="text-[9px] font-bold py-0">
                                    Official Answer
                                  </Badge>
                                )}
                              </span>
                              <span>{formatDate(comment.created_at)}</span>
                            </div>
                            <p className="text-teal/80 leading-relaxed">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-teal/60 italic">No replies yet. Be the first to reply!</p>
                    )}

                    {/* Add reply input */}
                    {!tItem.is_locked && (
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={replyText[tItem.id] || ''}
                          onChange={(e) =>
                            setReplyText((prev) => ({ ...prev, [tItem.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(tItem.id);
                          }}
                          placeholder="Write a helpful reply or update..."
                          className="flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-teal focus:border-teal focus:outline-none"
                        />
                        <button
                          type="button"
                          disabled={submittingReply === tItem.id}
                          onClick={() => handleAddComment(tItem.id)}
                          className={buttonClass({
                            variant: 'primary',
                            size: 'sm',
                            className: 'gap-1 shrink-0',
                          })}
                        >
                          {submittingReply === tItem.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Send className="size-3" />
                          )}
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* New Thread Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-line bg-canvas p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-teal/70 hover:bg-cream hover:text-teal"
            >
              <X className="size-4" />
            </button>

            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <Badge tone="tea" className="text-[10px] font-bold uppercase">
                  Community Q&amp;A
                </Badge>
                <h3 className="mt-1 text-base font-bold text-teal">Start a Discussion Topic</h3>
                <p className="text-xs text-teal/70">
                  Ask a question or share verified updates with fellow candidates.
                </p>
              </div>

              {threadError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                  {threadError}
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-teal mb-1">Topic Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CommunityThreadCategory)}
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-teal focus:border-teal focus:outline-none"
                  >
                    <option value="general">General Q&amp;A</option>
                    <option value="admit_card">Admit Card &amp; Exam Center</option>
                    <option value="exam_prep">Preparation &amp; Resources</option>
                    <option value="syllabus">Syllabus &amp; Pattern</option>
                    <option value="result">Results &amp; Cutoff Scores</option>
                    <option value="counselling">Counseling &amp; Admission</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-teal mb-1">
                    Question / Discussion Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Has anyone received examination center details for Warangal zone?"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-teal focus:border-teal focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-teal mb-1">
                    Details / Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Explain your query clearly so other candidates or mentors can provide accurate answers..."
                    className="w-full rounded-xl border border-line bg-canvas p-3 text-xs text-teal focus:border-teal focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-teal mb-1">Display Name (Optional)</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. Rahul S. (Defaults to your account name)"
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-teal focus:border-teal focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className={buttonClass({ variant: 'ghost', size: 'sm' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingThread}
                  className={buttonClass({
                    variant: 'primary',
                    size: 'sm',
                    className: 'gap-1.5 shadow-clay',
                  })}
                >
                  {submittingThread ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" /> Posting...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" /> Post Topic
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-line bg-canvas p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setReportingItem(null)}
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-teal/70 hover:bg-cream hover:text-teal"
            >
              <X className="size-4" />
            </button>

            {reportSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
                <h3 className="text-base font-bold text-teal">Report Submitted</h3>
                <p className="text-xs text-teal/70">
                  Thank you for keeping ApplyFields safe. Our staff review desk has received your report.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 text-rose-600 font-bold mb-1">
                    <AlertTriangle className="size-4" /> Report Content
                  </div>
                  <h3 className="text-sm font-bold text-teal">Help maintain community accuracy</h3>
                  <p className="text-teal/70">
                    Flag incorrect deadlines, spam, fake links, or abusive messages.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-teal mb-1">Reason for Report</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as any)}
                    className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-teal focus:border-teal focus:outline-none"
                  >
                    <option value="incorrect_info">Incorrect Information / Wrong Date</option>
                    <option value="fake_or_scam">Fake Link / Scam</option>
                    <option value="broken_link">Broken Official Link</option>
                    <option value="other">Spam or Inappropriate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-teal mb-1">Additional Details</label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide context or link to official gazette if applicable..."
                    className="w-full rounded-xl border border-line bg-canvas p-3 text-xs text-teal focus:border-teal focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingItem(null)}
                    className={buttonClass({ variant: 'ghost', size: 'sm' })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors"
                  >
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
