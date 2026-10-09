'use client';

import { useEffect, useState } from 'react';
import type { CareerSummary, UserCareerProfile } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, PageHeader } from '@applyfields/ui';
import {
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  GraduationCap,
  Layers,
  Lightbulb,
  Loader2,
  Save,
  Sparkles,
  Target,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';

const EDUCATION_STAGES = [
  '10th Grade / Secondary School',
  '12th Grade / Higher Secondary (Science)',
  '12th Grade / Higher Secondary (Commerce)',
  '12th Grade / Higher Secondary (Arts)',
  'Undergraduate (B.Tech / B.E. / BCA)',
  'Undergraduate (B.Sc / Medical / Allied)',
  'Undergraduate (B.Com / BBA / Finance)',
  'Undergraduate (BA / Humanities / Law)',
  'Postgraduate / Master’s Degree',
  'Early Working Professional',
];

const POPULAR_INTERESTS = [
  'Software Development',
  'Artificial Intelligence & ML',
  'Civil Services & Governance',
  'Defense & Armed Forces',
  'Medicine & Healthcare',
  'Banking & Investment',
  'Commercial Aviation & Piloting',
  'Data Science & Analytics',
  'Product Design & UI/UX',
  'Public Administration',
  'Cybersecurity',
  'Renewable Energy',
];

const SKILLS_LIST = [
  'Problem Solving',
  'Coding & Algorithms',
  'Analytical Thinking',
  'Leadership & Command',
  'Public Policy',
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Patient Care',
  'Physical Fitness & Discipline',
  'Communication & Debate',
  'Financial Modeling',
  'System Architecture',
];

const DIRECTIONS = [
  { id: 'govt', label: 'Government & Public Service', desc: 'Stability, nation-building, administrative prestige' },
  { id: 'tech', label: 'High-Growth Tech & Startups', desc: 'Global scale, innovation, high earning velocity' },
  { id: 'defense', label: 'National Defense & Armed Forces', desc: 'Patriotism, discipline, operational leadership' },
  { id: 'finance', label: 'Banking & Financial Markets', desc: 'Wealth creation, economics, strategic advisory' },
  { id: 'healthcare', label: 'Clinical Medicine & Healthcare', desc: 'Saving lives, specialized clinical excellence' },
];

export default function CareerProfilePage() {
  const [stage, setStage] = useState(EDUCATION_STAGES[4]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Software Development',
    'Artificial Intelligence & ML',
  ]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Problem Solving',
    'Coding & Algorithms',
  ]);
  const [preferredDirection, setPreferredDirection] = useState('tech');
  const [goal, setGoal] = useState('Become a Principal Engineer or Technology Leader');
  const [recommendations, setRecommendations] = useState<CareerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [prof, recs] = await Promise.all([
          apiGet<UserCareerProfile>('/career/profile/me'),
          apiGet<CareerSummary[]>('/career/recommendations'),
        ]);

        if (prof) {
          if (prof.education_stage) setStage(prof.education_stage);
          if (prof.interests && prof.interests.length > 0) setSelectedInterests(prof.interests);
          if (prof.skills && prof.skills.length > 0) setSelectedSkills(prof.skills);
          if (prof.preferred_direction) setPreferredDirection(prof.preferred_direction);
          if (prof.goals) setGoal(prof.goals);
        }

        if (recs && recs.length > 0) {
          setRecommendations(recs);
        }
      } catch (err) {
        console.error('Error loading career profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const toggleSkill = (item: string) => {
    setSelectedSkills((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await apiPost('/career/profile/me', {
        education_stage: stage,
        current_qualification: stage,
        subjects: [],
        interests: selectedInterests,
        skills: selectedSkills,
        career_interests: selectedInterests,
        goals: goal,
        preferred_direction: preferredDirection,
      });

      // Refresh recommendations
      const recs = await apiGet<CareerSummary[]>('/career/recommendations');
      if (recs) setRecommendations(recs);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save career profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          eyebrow="Personalized Guidance"
          title="Student Career Profile"
          description="Tell us about your education, interests, and aspirations to unlock tailored career roadmaps, suggested learning resources, and opportunity alerts."
          icon={<UserCheck />}
        />
        <div className="shrink-0">
          <Link
            href="/career"
            className={buttonClass({ variant: 'secondary', size: 'md', className: 'gap-2' })}
          >
            <Compass className="size-4" /> Explore All Careers
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left 2 Cols: Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Education Stage */}
          <Card className="p-6">
            <div className="flex items-center gap-2 text-teal">
              <GraduationCap className="size-5" />
              <h2 className="text-lg font-bold">1. Current Education Stage</h2>
            </div>
            <p className="mt-1 text-xs text-teal/70">
              Select where you currently stand in your academic journey.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {EDUCATION_STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border p-3 text-left text-xs font-semibold transition-all',
                    stage === s
                      ? 'border-teal bg-teal/10 text-teal shadow-clay'
                      : 'border-line/60 bg-cream/30 text-teal/80 hover:border-teal/30 hover:bg-cream',
                  )}
                >
                  <span>{s}</span>
                  {stage === s && <Check className="size-4 text-teal shrink-0" />}
                </button>
              ))}
            </div>
          </Card>

          {/* Interests */}
          <Card className="p-6">
            <div className="flex items-center gap-2 text-teal">
              <Lightbulb className="size-5" />
              <h2 className="text-lg font-bold">2. Fields of Interest</h2>
            </div>
            <p className="mt-1 text-xs text-teal/70">
              Pick areas you are genuinely enthusiastic to explore or work in.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {POPULAR_INTERESTS.map((item) => {
                const active = selectedInterests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={cn(
                      'clay-press rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                      active
                        ? 'bg-teal text-cream shadow-clay'
                        : 'bg-cream text-teal/80 hover:bg-tea border border-line/40',
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Skills */}
          <Card className="p-6">
            <div className="flex items-center gap-2 text-teal">
              <Layers className="size-5" />
              <h2 className="text-lg font-bold">3. Core Skills & Strengths</h2>
            </div>
            <p className="mt-1 text-xs text-teal/70">
              What are your key problem-solving or domain aptitudes?
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {SKILLS_LIST.map((item) => {
                const active = selectedSkills.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleSkill(item)}
                    className={cn(
                      'clay-press rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                      active
                        ? 'bg-teal text-cream shadow-clay'
                        : 'bg-cream text-teal/80 hover:bg-tea border border-line/40',
                    )}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Preferred Direction */}
          <Card className="p-6">
            <div className="flex items-center gap-2 text-teal">
              <Target className="size-5" />
              <h2 className="text-lg font-bold">4. Preferred Career Trajectory</h2>
            </div>
            <p className="mt-1 text-xs text-teal/70">
              Choose the work culture and environment that aligns with your lifestyle goals.
            </p>

            <div className="mt-4 space-y-2.5">
              {DIRECTIONS.map((dir) => (
                <button
                  key={dir.id}
                  type="button"
                  onClick={() => setPreferredDirection(dir.id)}
                  className={cn(
                    'flex w-full items-start justify-between rounded-xl border p-3.5 text-left transition-all',
                    preferredDirection === dir.id
                      ? 'border-teal bg-teal/10 shadow-clay'
                      : 'border-line/60 bg-cream/30 hover:border-teal/30 hover:bg-cream',
                  )}
                >
                  <div>
                    <h3 className="text-xs font-bold text-teal">{dir.label}</h3>
                    <p className="mt-0.5 text-xs text-teal/70">{dir.desc}</p>
                  </div>
                  {preferredDirection === dir.id && (
                    <Check className="size-4 text-teal shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>

            {/* Aspirations / Goal text */}
            <div className="mt-5">
              <label htmlFor="goal" className="block text-xs font-bold text-teal">
                Specific Aspiration or Target Role
              </label>
              <input
                id="goal"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Become an IAS Officer or Staff Engineer at a global tech firm"
                className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
              />
            </div>
          </Card>

          {/* Save Action */}
          <div className="flex items-center justify-between rounded-2xl bg-teal/10 p-4 border border-teal/20">
            <div>
              <p className="text-xs font-bold text-teal">Ready to update your guidance recommendations?</p>
              <p className="text-xs text-teal/70">
                Saved preferences immediately shape your career suggestions and opportunity feed.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {savedSuccess && (
                <span className="text-xs font-bold text-teal flex items-center gap-1">
                  <Check className="size-3.5" /> Saved!
                </span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={buttonClass({ variant: 'primary', size: 'md', className: 'gap-2 shadow-clay' })}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-4" /> Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Live Matched Careers */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-24">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal">
                <Sparkles className="size-5 text-teal" />
                <h3 className="text-base font-bold">Recommended For You</h3>
              </div>
              <Badge tone="teal" className="text-[10px]">
                {recommendations.length} Matches
              </Badge>
            </div>

            <p className="mt-2 text-xs text-teal/70">
              Careers matched dynamically with your interests and strengths:
            </p>

            {loading ? (
              <div className="mt-8 flex justify-center py-6">
                <Loader2 className="size-6 animate-spin text-teal/60" />
              </div>
            ) : recommendations.length === 0 ? (
              <p className="mt-6 text-center text-xs text-teal/60 py-6">
                No matching careers found yet. Try selecting more interests.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {recommendations.slice(0, 5).map((rec) => (
                  <Link
                    key={rec.id}
                    href={`/career/${rec.slug}`}
                    className="group block rounded-xl border border-line/60 bg-canvas p-3.5 transition-all hover:border-teal/40 hover:bg-cream/60 hover:shadow-clay"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-teal group-hover:underline">
                        {rec.title}
                      </h4>
                      <Badge tone="tea" className="text-[10px]">
                        {rec.category_name}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-teal/75">
                      {rec.summary}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-teal/70">
                      <span className="flex items-center gap-1 font-medium">
                        <BookOpen className="size-3 text-teal/60" />
                        {rec.resources_count} Learning resources
                      </span>
                      <span className="flex items-center gap-0.5 text-teal font-semibold group-hover:translate-x-0.5 transition-transform">
                        Explore <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 border-t border-line/60 pt-4">
              <Link
                href="/career"
                className="flex items-center justify-center gap-1.5 text-xs font-bold text-teal hover:underline"
              >
                Browse all career paths <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
