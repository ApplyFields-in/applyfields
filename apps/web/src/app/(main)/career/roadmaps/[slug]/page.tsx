'use client';

import { useEffect, useState, use } from 'react';
import type { ProgressStatus, RoadmapDetail, RoadmapStepItem } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, PageHeader } from '@applyfields/ui';
import {
  ArrowLeft,
  Bookmark,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  GraduationCap,
  Layers,
  Milestone,
  Sparkles,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';

const KIND_BADGES: Record<string, { label: string; tone: 'teal' | 'celadon' | 'tea' }> = {
  education: { label: 'Degree / Academic', tone: 'teal' },
  course: { label: 'Course Enrollment', tone: 'teal' },
  exam: { label: 'Entrance / Competitive Exam', tone: 'tea' },
  skill: { label: 'Technical / Core Skill', tone: 'celadon' },
  certification: { label: 'Certification', tone: 'tea' },
  project: { label: 'Production Project', tone: 'celadon' },
  internship: { label: 'Industry Internship', tone: 'teal' },
  job: { label: 'Career Launch', tone: 'teal' },
  milestone: { label: 'Major Milestone', tone: 'tea' },
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

  // Save full roadmap
  const handleSaveRoadmap = async () => {
    setSavingRoadmap(true);
    try {
      await apiPost(`/career/roadmaps/${slug}/save`);
      setIsSaved(true);
    } catch (err) {
      console.error('Failed to save roadmap:', err);
    } finally {
      setSavingRoadmap(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="rounded-2xl border border-line bg-canvas p-12 text-center text-teal">
        <h2 className="text-xl font-bold">Roadmap not found</h2>
        <Link href="/career/roadmaps" className="mt-4 inline-block text-xs font-semibold underline">
          Back to all roadmaps
        </Link>
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
    <div className="space-y-8 pb-16">
      {/* Back button */}
      <div>
        <Link
          href="/career/roadmaps"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal/70 hover:text-teal"
        >
          <ArrowLeft className="size-3.5" /> Back to roadmaps
        </Link>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-line/60 bg-cream/40 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="teal" className="text-xs">
            {roadmap.for_stage || 'All Stages'}
          </Badge>
          {roadmap.career_title && (
            <Link href={`/career/${roadmap.career_slug}`}>
              <Badge tone="tea" className="text-xs hover:underline">
                Career: {roadmap.career_title}
              </Badge>
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-teal sm:text-3xl">
              {roadmap.title}
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-teal/80 leading-relaxed">
              {roadmap.description}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveRoadmap}
              disabled={isSaved || savingRoadmap}
              className={buttonClass({
                variant: isSaved ? 'secondary' : 'primary',
                size: 'md',
                className: 'gap-2 shadow-clay',
              })}
            >
              <Bookmark className={cn('size-4', isSaved && 'fill-teal text-teal')} />
              {isSaved ? 'Roadmap Saved' : savingRoadmap ? 'Saving...' : 'Save Roadmap'}
            </button>
          </div>
        </div>

        {/* Progress Tracker Card */}
        <div className="mt-6 rounded-2xl bg-canvas p-4 sm:p-5 border border-line/60">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-teal">
              <Zap className="size-4 text-celadon" />
              <span>Your Milestone Progress</span>
            </div>
            <span className="text-sm font-extrabold text-teal tabular-nums">
              {completedStepsCount} of {totalSteps} Steps ({progressPercent}%)
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-tea/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-celadon via-teal to-teal transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] text-teal/70">
            Check off steps below as you complete them to track your journey toward your career offer!
          </p>
        </div>
      </div>

      {/* Roadmap Stages & Steps Timeline */}
      <div className="space-y-8">
        {Object.entries(stagesMap).map(([stageName, stageSteps], stageIdx) => (
          <div key={stageName} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-teal text-xs font-extrabold text-cream shadow-sm">
                {stageIdx + 1}
              </div>
              <h2 className="text-lg font-bold text-teal tracking-tight">{stageName}</h2>
            </div>

            <div className="space-y-3.5 pl-3 sm:pl-10 border-l-2 border-line/80 ml-3.5 sm:ml-3.5">
              {stageSteps.map((step) => {
                const isDone = step.user_status === 'done';
                const meta = KIND_BADGES[step.kind] || { label: step.kind, tone: 'teal' };

                return (
                  <Card
                    key={step.id}
                    className={cn(
                      'group relative p-4 sm:p-5 transition-all',
                      isDone
                        ? 'border-celadon/60 bg-tea/20'
                        : 'hover:border-teal/40 hover:shadow-clay',
                    )}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Interactive Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleStep(step.id)}
                        title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                        className={cn(
                          'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all',
                          isDone
                            ? 'border-teal bg-teal text-cream shadow-sm'
                            : 'border-teal/40 bg-canvas hover:border-teal hover:bg-cream',
                        )}
                      >
                        {isDone && <Check className="size-4 stroke-[3]" />}
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              'text-sm font-bold text-teal transition-all',
                              isDone && 'line-through text-teal/60',
                            )}
                          >
                            {step.title}
                          </span>

                          <Badge tone={meta.tone as any} className="text-[10px]">
                            {meta.label}
                          </Badge>

                          {step.is_milestone && (
                            <Badge tone="tea" className="gap-1 text-[10px] font-bold">
                              <Milestone className="size-3" /> Core Milestone
                            </Badge>
                          )}
                        </div>

                        {step.description && (
                          <p
                            className={cn(
                              'text-xs text-teal/80 leading-relaxed',
                              isDone && 'text-teal/50',
                            )}
                          >
                            {step.description}
                          </p>
                        )}

                        {/* Associated Course or Resources */}
                        <div className="mt-3 flex flex-wrap items-center gap-3 pt-2 text-xs">
                          {step.course_slug && (
                            <Link
                              href={`/career/courses/${step.course_slug}`}
                              className="inline-flex items-center gap-1 font-semibold text-teal hover:underline"
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
                                  className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-teal border border-line/60 hover:border-teal/40"
                                >
                                  <span>{res.title}</span>
                                  {res.url && <ExternalLink className="size-2.5 opacity-60" />}
                                </a>
                              ))}
                            </div>
                          )}

                          {step.estimated_duration_text && (
                            <span className="flex items-center gap-1 text-[11px] text-teal/60">
                              <Clock className="size-3" /> {step.estimated_duration_text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
