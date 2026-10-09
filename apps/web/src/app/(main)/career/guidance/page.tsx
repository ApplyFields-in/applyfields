'use client';

import { useState } from 'react';
import type { AskGuidanceResponse, GuidanceMessage, GuidanceSource } from '@applyfields/types';
import { Badge, buttonClass, Card, cn, PageHeader } from '@applyfields/ui';
import {
  ArrowRight,
  Bot,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  Loader2,
  Send,
  Sparkles,
  User,
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
      content: `Hello! I am your **ApplyFields AI Career Advisor**.\n\nI can help you navigate streams, explore degrees, compare colleges, or map out step-by-step career milestones—all grounded strictly in verified educational data.\n\nAsk me anything or tap one of the suggested prompts below to get started!`,
      sources: [],
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (questionText: string) => {
    const q = questionText.trim();
    if (!q || loading) return;

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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <PageHeader
          eyebrow="24/7 Educational Mentorship"
          title="AI Career Guidance"
          description="Ask personalized questions about eligibility, entrance exams, degree pathways, or college comparisons grounded in verified ApplyFields data."
          icon={<Sparkles />}
        />
        <div className="shrink-0 flex items-center gap-2">
          <Link
            href="/career/roadmaps"
            className={buttonClass({ variant: 'secondary', size: 'md', className: 'gap-2' })}
          >
            <GraduationCap className="size-4" /> Career Roadmaps
          </Link>
        </div>
      </div>

      {/* Information strip about Claude grounding */}
      <div className="rounded-2xl border border-teal/20 bg-teal/10 p-3.5 text-xs text-teal/90 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-teal shrink-0" />
          <span>
            <strong>Grounded Advisor:</strong> Answers are fact-checked against real college admissions, government entrance exams, and career roadmaps without inventing facts.
          </span>
        </div>
        <Badge tone="tea" className="text-[10px] shrink-0">
          v3 AI Engine
        </Badge>
      </div>

      {/* Chat Messages Container */}
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
                <Loader2 className="size-3.5 animate-spin" /> Consulting verified pathways and admissions data...
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
    </div>
  );
}
