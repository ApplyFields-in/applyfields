'use client';

import { useEffect, useState, use } from 'react';
import type { ProgressStatus, RoadmapDetail, RoadmapStepItem } from '@applyfields/types';
import { cn } from '@applyfields/ui';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  GraduationCap,
  Layers,
  Milestone,
  Route,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PrintExportButton } from '@/components/print-export-button';

const KIND_BADGES: Record<string, { label: string }> = {
  education: { label: 'Degree / Academic' },
  course: { label: 'Course Enrollment' },
  exam: { label: 'Entrance / Competitive Exam' },
  skill: { label: 'Technical / Core Skill' },
  certification: { label: 'Certification' },
  project: { label: 'Production Project' },
  internship: { label: 'Industry Internship' },
  job: { label: 'Career Launch' },
  milestone: { label: 'Major Milestone' },
};

export default function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [completedStepsCount, setCompletedStepsCount] = useState(0);
  const [steps, setSteps] = useState<RoadmapStepItem[]>([]);

  useEffect(() => {
    async function loadRoadmap() {
      setLoading(true);
      try {
        const data = await apiGet<RoadmapDetail>(`/career/roadmaps/${slug}`);
        if (data) {
          setRoadmap(data);
          setSteps(data.steps || []);
          setIsSaved(data.user_progress?.is_saved || false);
          setCompletedStepsCount(data.user_progress?.completed_steps || 0);
        }
      } catch (err) {
        console.error('Failed to load roadmap:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRoadmap();
  }, [slug]);

  const totalSteps = steps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

  // Toggle single step checkbox
  const handleToggleStep = async (stepId: string) => {
    const currentStep = steps.find((s) => s.id === stepId);
    if (!currentStep) return;

    const nextStatus: ProgressStatus = currentStep.user_status === 'done' ? 'todo' : 'done';

    // Optimistic UI update
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, user_status: nextStatus } : s)),
    );
    setCompletedStepsCount((prev) => (nextStatus === 'done' ? prev + 1 : Math.max(0, prev - 1)));
    setIsSaved(true);

    try {
      await apiPost(`/career/roadmaps/${slug}/steps/${stepId}/toggle`, {
        status: nextStatus,
      });
    } catch (err) {
      console.error('Failed to toggle step:', err);
      // Revert if error
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, user_status: currentStep.user_status } : s)),
      );
      setCompletedStepsCount((prev) => (currentStep.user_status === 'done' ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  // Save / Bookmark the whole roadmap
  const handleSaveRoadmap = async () => {
    if (isSaved || savingRoadmap) return;
    setSavingRoadmap(true);
    setIsSaved(true);
    try {
      await apiPost(`/career/roadmaps/${slug}/save`, {});
    } catch (err) {
      console.error('Failed to save roadmap:', err);
      setIsSaved(false);
    } finally {
      setSavingRoadmap(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#F2F1ED] min-h-screen py-12">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-8 text-center text-sm text-[#536780] shadow-sm">
            Loading trajectory and milestones...
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="bg-[#F2F1ED] min-h-screen py-12">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-md border border-[#dec9a5] bg-[#ffffff] p-12 text-center text-[#082046] shadow-sm">
            <h2 className="text-xl font-bold">Roadmap not found</h2>
            <Link
              href="/career/roadmaps"
              className="mt-4 inline-flex min-h-9 items-center rounded-md border border-[#dec9a5] bg-[#F4E8D1] px-3.5 text-xs font-bold text-[#082046] hover:bg-[#ebdcc0] transition-colors"
            >
              Back to all roadmaps
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Group steps by stage
  const stagesMap = steps.reduce<Record<string, RoadmapStepItem[]>>((acc, s) => {
    const key = s.stage || 'Core Pathway';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div>
      {/* Warm Yellowish Top Section matching Career Mode & Colleges */}
      <section className="border-y border-[#e5d0aa] bg-[#F4E8D1]">
        <div className="mx-auto max-w-[1360px] space-y-4 px-4 pt-6 pb-6 sm:pt-8 sm:pb-7 sm:px-6 lg:px-8">
          {/* Contextual Breadcrumbs Navigation & Export Action */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Breadcrumbs
              items={[
                { label: 'Career', href: '/career' },
                { label: 'Roadmaps', href: '/career/roadmaps' },
                ...(roadmap.career_title ? [{ label: roadmap.career_title, href: `/career/${roadmap.career_slug}` }] : []),
                { label: roadmap.title },
              ]}
            />

            <div className="flex items-center gap-2">
              <PrintExportButton
                label="Print Checklist / PDF"
                documentTitle={`${roadmap.title} - Career Trajectory Roadmap - ApplyFields`}
              />
              <Link
                href="/career/roadmaps"
                className="print:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-[#76562d] hover:text-[#082046] transition-colors"
              >
                <ArrowLeft className="size-3.5" /> Back
              </Link>
            </div>
          </div>

          {/* Top Metadata Badges - Rectangular rounded-md */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#F4E8D1] px-2.5 py-1 text-xs font-bold text-[#76562d]">
                <Compass className="size-3.5 text-[#76562d]" /> {roadmap.for_stage ? roadmap.for_stage.toUpperCase() : 'ALL STAGES'}
              </span>
              {roadmap.career_title && (
                <Link href={`/career/${roadmap.career_slug}`}>
                  <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2.5 py-1 text-xs font-medium text-[#243b5b] hover:bg-[#ffffff]">
                    Career: {roadmap.career_title}
                  </span>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveRoadmap}
                disabled={isSaved || savingRoadmap}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-3.5 text-xs font-bold text-[#082046] hover:bg-[#ffffff] transition-colors shadow-sm"
              >
                <Bookmark className={cn('size-3.5 text-[#76562d]', isSaved && 'fill-[#76562d]')} />
                {isSaved ? 'Roadmap Saved' : savingRoadmap ? 'Saving...' : 'Save Roadmap'}
              </button>
            </div>
          </div>

          {/* Title Area */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#082046] sm:text-3xl lg:text-4xl">
              {roadmap.title}
            </h1>
            <p className="mt-2 max-w-3xl text-xs sm:text-sm text-[#435775] leading-relaxed">
              {roadmap.description}
            </p>
          </div>

          {/* Progress Tracker Card - Rectangular rounded-md */}
          <div className="rounded-md bg-[#ffffff] p-4 sm:p-5 border border-[#dec9a5] shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#082046]">
                <Zap className="size-4 text-[#0e7bf4]" />
                <span>Your Milestone Progress</span>
              </div>
              <span className="text-sm font-bold text-[#082046] tabular-nums">
                {completedStepsCount} of {totalSteps} Steps ({progressPercent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-md bg-[#f8f5ef] border border-[#dec9a5]/60">
              <div
                className="h-full rounded-md bg-[#0e7bf4] transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="mt-2 text-[11px] text-[#536780]">
              Check off steps below as you complete them to track your journey toward your career offer!
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Body - Soft Neutral Parchment Background */}
      <div className="bg-[#F2F1ED] min-h-screen">
        <div className="mx-auto max-w-[1360px] space-y-8 px-4 py-6 pb-24 sm:px-6 lg:px-8">
          {/* Quick link to Curriculum Overlap Analyzer for exams & trajectories */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-[#dec9a5] bg-[#ffffff] p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#082046] text-[#ffffff] shrink-0">
                <Compass className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#082046]">
                  Curriculum Overlap & Syllabus Trajectory Engine
                </h3>
                <p className="text-[11px] text-[#536780]">
                  Analyze syllabus overlap across UPSC, State PSC, SSC CGL, and Banking to file multiple exams with zero duplicate effort.
                </p>
              </div>
            </div>
            <Link
              href="/trajectories"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#082046] px-3.5 py-1.5 text-xs font-bold text-[#ffffff] hover:bg-[#133363] transition shrink-0 shadow-xs"
            >
              <span>Explore Overlap Analyzer</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Roadmap Stages & Steps Timeline */}
          <div className="space-y-8">
            {Object.entries(stagesMap).map(([stageName, stageSteps], stageIdx) => (
              <div key={stageName} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-md border border-[#082046] bg-[#082046] text-xs font-bold text-[#ffffff] shadow-sm">
                    {stageIdx + 1}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#082046] tracking-tight">{stageName}</h2>
                </div>

                <div className="space-y-3.5 pl-3 sm:pl-9 border-l-2 border-[#dec9a5] ml-3.5">
                  {stageSteps.map((step) => {
                    const isDone = step.user_status === 'done';
                    const meta = KIND_BADGES[step.kind] || { label: step.kind };

                    return (
                      <div
                        key={step.id}
                        id={`step-${step.id}`}
                        className={cn(
                          'group relative scroll-mt-20 p-4 sm:p-5 rounded-md border transition-all shadow-sm',
                          isDone
                            ? 'border-[#dec9a5] bg-[#F4E8D1]/40'
                            : 'border-[#dec9a5] bg-[#ffffff] hover:border-[#082046]/50',
                        )}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          {/* Interactive Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleStep(step.id)}
                            title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                            className={cn(
                              'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-all',
                              isDone
                                ? 'border-[#082046] bg-[#082046] text-[#ffffff] shadow-sm'
                                : 'border-[#dec9a5] bg-[#f8f5ef] hover:border-[#082046] hover:bg-[#ffffff]',
                            )}
                          >
                            {isDone && <Check className="size-3.5 stroke-[3]" />}
                          </button>

                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  'text-sm font-bold text-[#082046] transition-all',
                                  isDone && 'line-through text-[#536780]',
                                )}
                              >
                                {step.title}
                              </span>

                              <span className="inline-flex items-center rounded border border-[#dec9a5] bg-[#f8f5ef] px-2 py-0.5 text-[10px] font-medium text-[#243b5b]">
                                {meta.label}
                              </span>

                              {step.is_milestone && (
                                <span className="inline-flex items-center gap-1 rounded border border-[#dec9a5] bg-[#F4E8D1] px-2 py-0.5 text-[10px] font-bold text-[#76562d]">
                                  <Milestone className="size-3" /> Core Milestone
                                </span>
                              )}
                            </div>

                            {step.description && (
                              <p
                                className={cn(
                                  'text-xs text-[#536780] leading-relaxed',
                                  isDone && 'text-[#536780]/70',
                                )}
                              >
                                {step.description}
                              </p>
                            )}

                            {/* Associated Course or Resources */}
                            <div className="mt-3 flex flex-wrap items-center gap-3 pt-2 border-t border-[#dec9a5]/40 text-xs">
                              {step.course_slug && (
                                <Link
                                  href={`/career/courses/${step.course_slug}`}
                                  className="inline-flex items-center gap-1 font-semibold text-[#0e7bf4] hover:underline"
                                >
                                  <GraduationCap className="size-3.5" /> View Recommended Degree
                                </Link>
                              )}

                              {step.resources && step.resources.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                  {step.resources.map((res, rIdx) => (
                                    <a
                                      key={rIdx}
                                      href={res.url || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-md border border-[#dec9a5] bg-[#f8f5ef] px-2.5 py-1 text-[11px] font-medium text-[#082046] hover:bg-[#ffffff]"
                                    >
                                      <span>{res.title}</span>
                                      {res.url && <ExternalLink className="size-2.5 opacity-60" />}
                                    </a>
                                  ))}
                                </div>
                              )}

                              {step.estimated_duration_text && (
                                <span className="flex items-center gap-1 text-[11px] text-[#536780]">
                                  <Clock className="size-3" /> {step.estimated_duration_text}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* "Next Step" Sticky CTA Bar */}
          {(() => {
            const nextStep = steps.find((s) => s.user_status !== 'done') || steps[0];
            if (!nextStep) return null;
            return (
              <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 w-auto sm:min-w-[460px] max-w-xl">
                <div className="flex items-center justify-between gap-3 rounded-md border border-[#dec9a5] bg-[#082046] px-4 py-3 text-[#ffffff] shadow-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#F4E8D1] text-[#082046] text-xs font-bold shadow-xs">
                      {nextStep.sort_order}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#dec9a5] block">
                        Next Step in Roadmap
                      </span>
                      <p className="text-xs font-bold text-[#ffffff] truncate">
                        {nextStep.title}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById(`step-${nextStep.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="shrink-0 rounded-md bg-[#F4E8D1] px-3.5 py-1.5 text-xs font-bold text-[#082046] hover:bg-[#ebdcc0] transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Jump to Step</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
