'use client';

import { useState, useEffect } from 'react';
import type { AskGuidanceResponse, GuidanceMessage, GuidanceSource } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, PageHeader } from '@applyfields/ui';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  Loader2,
  Lock,
  Send,
  ShieldCheck,
  Sparkles,
  Unlock,
  User,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { apiPost } from '@/lib/api';

const STARTER_PROMPTS = [
  'I completed 12th PCB with 70%, what biotechnology options without NEET?',
  'How to become a Software Engineer starting from Class 11?',
  'Compare IIT Madras vs BITS Pilani for Computer Science',
  'What are the eligibility criteria and milestones for UPSC IAS?',
];

export default function CareerGuidancePage() {
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      sources?: GuidanceSource[];
    }>
  >([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your ApplyFields AI Career Advisor.\n\nI can help you navigate streams, explore degrees, compare colleges, or map out step-by-step career milestones - all grounded strictly in verified educational data.\n\nAsk me anything or tap one of the suggested prompts below to get started!`,
      sources: [],
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPlanOption, setSelectedPlanOption] = useState<'trial' | 'monthly' | 'annual'>('trial');
  const [planToast, setPlanToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('applyfields_career_plan');
      setHasPlan(stored === 'active');
    }
  }, []);

  const handleUnlockPlan = (planType: 'trial' | 'monthly' | 'annual') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('applyfields_career_plan', 'active');
      localStorage.setItem('applyfields_career_plan_tier', planType);
    }
    setHasPlan(true);
    setPlanToast(
      planType === 'trial'
        ? '7-Day Free Trial activated. AI Career Guidance is now unlocked.'
        : 'Career Pro Plan activated. All guidance tools are now unlocked.',
    );
    setTimeout(() => setPlanToast(null), 4000);
  };

  const handleLockPlan = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('applyfields_career_plan');
      localStorage.removeItem('applyfields_career_plan_tier');
    }
    setHasPlan(false);
    setPlanToast('Switched back to Free Tier. Guidance is now locked.');
    setTimeout(() => setPlanToast(null), 3000);
  };

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || loading || !hasPlan) return;

    setInput('');
    const userMsgId = `user-${Date.now()}`;
    const nextMessages = [
      ...messages,
      { id: userMsgId, role: 'user' as const, content: q },
    ];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await apiPost<AskGuidanceResponse>('/career/guidance/ask', {
        question: q,
      });

      if (res && res.data) {
        setMessages([
          ...nextMessages,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: res.data.answer,
            sources: res.data.sources,
          },
        ]);
      } else {
        setMessages([
          ...nextMessages,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content:
              'I encountered an issue processing that query. Please try asking in a slightly different way or browse our directory.',
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to ask AI guide:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {planToast && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl border border-teal/20 bg-cream p-4 shadow-clay text-xs font-semibold text-teal flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>{planToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          eyebrow="Educational Mentorship"
          title="AI Career Guidance"
          description="Personalized degree pathways, competitive exam milestones, and college admission eligibility evaluated by AI against verified ApplyFields data."
          icon={<Sparkles />}
        />
        <div className="shrink-0 flex items-center gap-2">
          {hasPlan && (
            <button
              type="button"
              onClick={handleLockPlan}
              className="text-xs text-teal/60 underline hover:text-teal px-2 py-1"
            >
              Simulate Free Tier
            </button>
          )}
          <Link
            href="/career/roadmaps"
            className={buttonClass({ variant: 'secondary', size: 'md', className: 'gap-2' })}
          >
            <GraduationCap className="size-4" /> Career Roadmaps
          </Link>
        </div>
      </div>

      {/* Status Bar */}
      <div className="rounded-2xl border border-teal/20 bg-teal/10 p-3.5 text-xs text-teal/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-teal shrink-0" />
          <span>
            <strong>Grounded Advisor Engine:</strong> Answers are evaluated against official government notifications, verified university criteria, and curriculum roadmaps.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasPlan ? (
            <Badge tone="tea" className="text-[10px] font-bold">
              [Pro Active] Unlocked
            </Badge>
          ) : (
            <Badge tone="outline" className="text-[10px] font-bold">
              [Free Tier] Locked
            </Badge>
          )}
          <span className="text-[10px] text-teal/60 font-mono">v3.2 RAG</span>
        </div>
      </div>

      {/* Plan Gate Modal / Locked View */}
      {hasPlan === false && (
        <Card className="border-2 border-dashed border-teal/30 bg-canvas p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-teal/10 text-teal border border-teal/20">
              <Lock className="size-6 text-teal" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-teal tracking-tight">
              Unlock ApplyFields AI Career Pro
            </h2>
            <p className="text-xs sm:text-sm text-teal/80 leading-relaxed">
              AI Career Guidance requires an active Career Pro plan. The advisor analyzes your 10th/12th academic scores, social category (GEN/OBC/SC/ST/EWS), and career goals to produce personalized trajectories without generic guesswork.
            </p>
          </div>

          {/* Feature Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="rounded-xl border border-line bg-cream/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-teal font-bold text-xs uppercase tracking-wider">
                <Sparkles className="size-4 text-celadon" />
                <span>LLM Intelligence</span>
              </div>
              <p className="text-xs text-teal/80 leading-normal">
                Continuous conversational advisor providing context-aware guidance for complex questions and career transitions.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-cream/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-teal font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="size-4 text-celadon" />
                <span>Profile Audit</span>
              </div>
              <p className="text-xs text-teal/80 leading-normal">
                Cross-references your competitive exam scores and marks against official government age relaxations and cutoffs.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-cream/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-teal font-bold text-xs uppercase tracking-wider">
                <GraduationCap className="size-4 text-celadon" />
                <span>Verified Data</span>
              </div>
              <p className="text-xs text-teal/80 leading-normal">
                Direct citations to 2,000+ colleges and 500+ government job schemes indexed on the ApplyFields network.
              </p>
            </div>
          </div>

          {/* Pricing Options */}
          <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setSelectedPlanOption('trial')}
              className={cn(
                'rounded-xl border p-3.5 text-left transition-all',
                selectedPlanOption === 'trial'
                  ? 'border-teal bg-teal/10 shadow-clay'
                  : 'border-line bg-canvas hover:border-teal/40',
              )}
            >
              <div className="text-[10px] font-bold uppercase text-teal/60">Starter</div>
              <div className="font-bold text-sm text-teal">7-Day Trial</div>
              <div className="text-[11px] text-teal/70 font-semibold mt-1">Free Activation</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlanOption('monthly')}
              className={cn(
                'rounded-xl border p-3.5 text-left transition-all',
                selectedPlanOption === 'monthly'
                  ? 'border-teal bg-teal/10 shadow-clay'
                  : 'border-line bg-canvas hover:border-teal/40',
              )}
            >
              <div className="text-[10px] font-bold uppercase text-teal/60">Monthly</div>
              <div className="font-bold text-sm text-teal">Rs. 199 / mo</div>
              <div className="text-[11px] text-teal/70 mt-1">Cancel anytime</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPlanOption('annual')}
              className={cn(
                'rounded-xl border p-3.5 text-left transition-all',
                selectedPlanOption === 'annual'
                  ? 'border-teal bg-teal/10 shadow-clay'
                  : 'border-line bg-canvas hover:border-teal/40',
              )}
            >
              <div className="text-[10px] font-bold uppercase text-celadon">Best Value</div>
              <div className="font-bold text-sm text-teal">Rs. 999 / yr</div>
              <div className="text-[11px] text-teal/70 mt-1">Save 60%</div>
            </button>
          </div>

          {/* Unlock Button */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => handleUnlockPlan(selectedPlanOption)}
              className={buttonClass({
                variant: 'primary',
                size: 'lg',
                className: 'gap-2 shadow-clay px-8 font-bold',
              })}
            >
              <Unlock className="size-4" />
              <span>
                {selectedPlanOption === 'trial'
                  ? 'Start 7-Day Free Trial (Instant Unlock)'
                  : selectedPlanOption === 'monthly'
                    ? 'Activate Monthly Plan (Rs. 199)'
                    : 'Activate Annual Pass (Rs. 999)'}
              </span>
            </button>
            <p className="text-[11px] text-teal/60 mt-2">
              No credit card required for free trial. Instant access to all AI mentorship modules.
            </p>
          </div>
        </Card>
      )}

      {/* Unlocked Chat Workspace */}
      {hasPlan && (
        <Card className="min-h-[500px] flex flex-col justify-between p-4 sm:p-6 space-y-4">
          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 sm:gap-4',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-teal text-cream shadow-sm mt-1">
                    <Bot className="size-4" />
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-2xl p-4 text-xs sm:text-sm leading-relaxed max-w-[85%] sm:max-w-[75%]',
                    msg.role === 'user'
                      ? 'bg-teal text-cream font-medium shadow-sm'
                      : 'bg-canvas border border-line text-teal',
                  )}
                >
                  {/* Message Body rendering */}
                  <div className="space-y-2 whitespace-pre-wrap">
                    {msg.content.split('\n\n').map((para, pIdx) => (
                      <p key={pIdx}>
                        {para.split(/(\[[^\]]+\]\([^)]+\))/g).map((chunk, cIdx) => {
                          const linkMatch = chunk.match(/\[([^\]]+)\]\(([^)]+)\)/);
                          if (linkMatch) {
                            return (
                              <Link
                                key={cIdx}
                                href={linkMatch[2]}
                                className="font-bold underline text-celadon hover:opacity-80"
                              >
                                {linkMatch[1]}
                              </Link>
                            );
                          }
                          return chunk;
                        })}
                      </p>
                    ))}
                  </div>

                  {/* Sources list if present */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 border-t border-line/60 pt-3 text-xs space-y-1.5">
                      <span className="font-bold text-[11px] text-teal/70 uppercase tracking-wider block">
                        Grounded Sources & Pathways:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <Link
                            key={sIdx}
                            href={src.url}
                            className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-teal border border-line/60 hover:border-teal/40"
                          >
                            <span>{src.title}</span>
                            <ExternalLink className="size-2.5 opacity-60" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cream text-teal border border-line shadow-sm mt-1">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-xs text-teal/70 animate-pulse">
                <div className="flex size-8 items-center justify-center rounded-full bg-teal text-cream">
                  <Bot className="size-4" />
                </div>
                <span className="flex items-center gap-1.5 font-semibold">
                  <Loader2 className="size-3.5 animate-spin" /> Evaluating verified pathways and cutoffs...
                </span>
              </div>
            )}
          </div>

          {/* Input & Starter Prompts */}
          <div className="pt-4 border-t border-line space-y-3">
            {/* Starter Prompt Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-teal/70 flex items-center gap-1">
                <Lightbulb className="size-3" /> Try asking:
              </span>
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="rounded-full bg-cream/70 px-3 py-1 text-[11px] font-semibold text-teal hover:bg-tea border border-line/40 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Prompt Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about career options, eligibility, college cutoffs, or roadmaps..."
                className="h-11 w-full rounded-2xl border border-line bg-canvas px-4 text-xs font-medium text-teal placeholder:text-teal/40 focus:border-teal focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={buttonClass({
                  variant: 'primary',
                  size: 'md',
                  className: 'shrink-0 gap-1.5 shadow-clay',
                })}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <span>Ask</span>
                    <Send className="size-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </Card>
      )}
    </div>
  );
}
