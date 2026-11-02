'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  Bot,
  Copy,
  Crown,
  ExternalLink,
  FileText,
  Lock,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Store,
  X,
  Zap,
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { showAppToast } from '@/components/toast-notification-provider';
import { usePipApply } from '@/context/pip-apply-context';
import type {
  ChatbotAction,
  ChatbotQueryInput,
  ChatbotQueryResponse,
  SaveResult,
} from '@applyfields/types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  mode?: 'deterministic' | 'rag' | 'llm' | 'fallback' | 'limit_reached';
  actions?: ChatbotAction[];
  citations?: string[];
  related_queries?: string[];
  timestamp: string;
}

interface QuotaState {
  daily_limit: number;
  queries_used: number;
  queries_remaining: number;
  is_premium: boolean;
  limit_reached: boolean;
}

const STORAGE_KEY = 'applyfields_ai_chat_history_v2';
const QUOTA_STORAGE_KEY = 'applyfields_ai_quota_v2';

// Format simple markdown (bold, headers, bullets, links) safely
function renderMarkdown(content: string) {
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    // Headers
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className="mt-3 mb-1.5 text-sm font-black text-[#082046] border-b border-blue-100 pb-1">
          {line.replace('## ', '')}
        </h3>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="mt-2.5 mb-1 text-sm font-black text-[#082046]">
          {line.replace('### ', '')}
        </h4>
      );
    }
    if (line.startsWith('#### ')) {
      return (
        <h5 key={idx} className="mt-2 mb-0.5 text-xs font-bold text-[#0e7bf4]">
          {line.replace('#### ', '')}
        </h5>
      );
    }

    // Blockquote
    if (line.startsWith('> ')) {
      return (
        <div
          key={idx}
          className="my-2 rounded-xl bg-blue-50/80 border-l-4 border-[#0e7bf4] p-2.5 text-xs text-[#082046] italic"
        >
          {line.replace('> ', '')}
        </div>
      );
    }

    // Bullets
    if (line.startsWith('• ') || line.startsWith('- ')) {
      const bulletText = line.replace(/^[•-]\s*/, '');
      const formatted = bulletText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <li
          key={idx}
          className="ml-4 list-disc text-xs text-[#334a69] leading-relaxed my-0.5"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    }

    // Numbered lists
    if (/^\d+\.\s/.test(line)) {
      const numText = line.replace(/^\d+\.\s*/, '');
      const formatted = numText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <div
          key={idx}
          className="ml-2 text-xs text-[#334a69] leading-relaxed my-1 flex items-start gap-1.5"
        >
          <span className="font-bold text-[#0e7bf4]">{line.match(/^\d+/)?.[0]}.</span>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
      );
    }

    // Empty lines
    if (!line.trim()) {
      return <div key={idx} className="h-1.5" />;
    }

    // Normal text with bold
    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return (
      <p
        key={idx}
        className="text-xs text-[#334a69] leading-relaxed my-0.5"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  });
}

export function FloatingAiAssistant() {
  const pathname = usePathname();
  const { openPip } = usePipApply();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Daily Quota Tracking (3 free chats/day, resets at midnight IST)
  const [quota, setQuota] = useState<QuotaState>({
    daily_limit: 3,
    queries_used: 0,
    queries_remaining: 3,
    is_premium: false,
    limit_reached: false,
  });

  // 1. Route guard: Only show on /jobs/*, /exams/*, /scholarships/*, /admissions/*, /apply/*, and /career/*
  const isAllowedRoute = /^\/(jobs|exams|scholarships|admissions|apply|career)(\/|$)/.test(
    pathname || '',
  );

  // 2. Extract opportunity context from URL if available
  const oppSlugMatch = pathname?.match(
    /\/(jobs|exams|scholarships|admissions|apply\/(?:jobs|exams|scholarships|admissions))\/([^/?#]+)/,
  );
  const currentOpportunitySlug = oppSlugMatch ? oppSlugMatch[2] : undefined;
  const isCareerRoute = pathname?.startsWith('/career');

  // Load chat history & fetch live quota on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load messages from sessionStorage
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch {}

    // Load cached quota
    try {
      const savedQuota = sessionStorage.getItem(QUOTA_STORAGE_KEY);
      if (savedQuota) {
        setQuota(JSON.parse(savedQuota));
      }
    } catch {}

    // Fetch fresh quota from API
    apiGet<QuotaState>('/chatbot/quota')
      .then((data) => {
        if (data) {
          setQuota(data);
          sessionStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(data));
        }
      })
      .catch(() => {});
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  if (!isAllowedRoute) {
    return null;
  }

  // Quick Chips based on route context
  const quickChips = currentOpportunitySlug
    ? [
        {
          label: '📄 1-Page Official Digest',
          query: 'Show the 1-page official circular digest',
        },
        { label: '📅 When is the final deadline?', query: 'When is the final deadline to apply?' },
        {
          label: '💰 Fee for Gen / SC / ST / OBC?',
          query: 'What is the application fee for General / SC / ST / OBC?',
        },
        {
          label: '🎓 Am I eligible with a Degree?',
          query: 'Am I eligible with a B.Tech / Degree qualification?',
        },
        {
          label: '📝 Explain exam pattern & stages',
          query: 'Explain the exam pattern and selection stages',
        },
        { label: '📊 How many total vacancies?', query: 'How many total vacancies are announced?' },
        {
          label: '🏪 Book CSC Assisted Filing',
          query: 'How to book assisted filing at a partner MeeSeva/CSC kiosk?',
        },
      ]
    : isCareerRoute
      ? [
          {
            label: '🧭 Which jobs match my degree?',
            query: 'Which government jobs match my graduate degree?',
          },
          {
            label: '📈 Career path & salary growth',
            query: 'What is the career progression and starting salary in central services?',
          },
          {
            label: '📚 Top exams for graduates',
            query: 'What are the top competitive exams for graduates in India?',
          },
          { label: '⏳ Exams closing this week', query: 'Which exams are closing this week?' },
        ]
      : [
          { label: '⏳ What exams close this week?', query: 'Which exams are closing this week?' },
          {
            label: '📈 Top government jobs open now',
            query: 'What are the top government recruitments open now?',
          },
          { label: '⭐ Check my saved applications', query: 'Show my saved applications' },
          {
            label: '🏪 Find MeeSeva/CSC partner centers',
            query: 'How can I get help filing my application at a CSC kiosk?',
          },
        ];

  async function handleSend(queryText: string) {
    const q = queryText.trim();
    if (!q || isLoading || quota.limit_reached) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      const payload: ChatbotQueryInput = {
        query: q,
        opportunity_slug: currentOpportunitySlug,
        page_type: isCareerRoute ? 'career' : 'apply',
        history: messages.slice(-4).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
      };

      const res = await apiPost<ChatbotQueryResponse>('/chatbot/query', payload);

      let botMsg: Message;
      if (res.data) {
        // Update live quota
        if (typeof res.data.queries_remaining === 'number') {
          const updatedQuota: QuotaState = {
            daily_limit: res.data.daily_limit ?? 3,
            queries_used: res.data.queries_used ?? quota.queries_used + 1,
            queries_remaining: res.data.queries_remaining,
            is_premium: res.data.is_premium ?? false,
            limit_reached: res.data.limit_reached ?? false,
          };
          setQuota(updatedQuota);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(updatedQuota));
          }
        }

        botMsg = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: res.data.answer,
          mode: res.data.mode,
          actions: res.data.actions,
          citations: res.data.citations,
          related_queries: res.data.related_queries,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      } else {
        botMsg = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: 'I could not retrieve the record at this moment. You can browse active circulars under `/apply`.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }

      const updated = [...nextMessages, botMsg];
      setMessages(updated);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {
      const errorMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: 'Connection to the query engine was interrupted. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...nextMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleActionClick(action: ChatbotAction) {
    if (action.action === 'open_url' && action.url) {
      if (
        action.url.startsWith('http') &&
        (action.label.toLowerCase().includes('apply') || Boolean(currentOpportunitySlug))
      ) {
        openPip({
          title: currentOpportunitySlug
            ? currentOpportunitySlug.replace(/-/g, ' ').toUpperCase()
            : 'Official Application Portal',
          applyUrl: action.url,
          slug: currentOpportunitySlug,
        });
        return;
      }
      window.open(action.url, '_blank', 'noopener,noreferrer');
    } else if (action.action === 'save' && action.item_slug) {
      try {
        const itemType = action.item_type || 'opportunity';
        const res = await apiPut<SaveResult>(
          `/saved/${itemType}/${encodeURIComponent(action.item_slug)}`,
          {},
        );
        if (res.data) {
          showAppToast({
            message: 'Saved to your opportunities!',
            actionLabel: 'View Saved →',
            actionHref: '/saved',
            type: 'success',
          });
        }
      } catch {
        showAppToast({ message: 'Could not save. Please sign in.', type: 'remove' });
      }
    } else if (action.url) {
      window.location.href = action.url;
    }
  }

  function handleClearChat() {
    setMessages([]);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* Unique Floating Circular Launcher Button (Bottom-Right)        */}
      {/* Matches ApplyFields Logo Mark & Brand Colors                   */}
      {/* ------------------------------------------------------------- */}
      {!isOpen && (
        <aside
          aria-label="Fieldy - ApplyFields AI Assistant"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {/* Friendly Floating Greeting Tooltip */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2.5 rounded-full border border-blue-200/80 bg-white/95 px-4 py-2.5 shadow-xl shadow-blue-900/10 backdrop-blur-md text-xs font-bold text-[#082046] hover:border-[#0e7bf4] hover:shadow-blue-500/15 transition-all group cursor-pointer"
          >
            <Sparkles className="size-3.5 text-[#0e7bf4] animate-pulse" />
            <div className="flex flex-col text-left">
              <span className="text-[11px] leading-tight font-black text-[#082046]">
                Ask Fieldy AI
              </span>
              <span className="text-[9.5px] font-medium text-slate-500">
                {quota.is_premium
                  ? '👑 Unlimited Plus'
                  : `${quota.queries_remaining} free chat${quota.queries_remaining === 1 ? '' : 's'} left today`}
              </span>
            </div>
            <ArrowRight className="size-3 text-[#0e7bf4] transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Floating Orb Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Fieldy AI Advisor"
            className="group relative flex size-15 items-center justify-center rounded-full bg-gradient-to-tr from-[#082046] via-[#0e7bf4] to-[#10b981] p-0.5 text-white shadow-2xl shadow-blue-600/35 transition-all hover:scale-108 active:scale-95 cursor-pointer ring-4 ring-blue-500/15 hover:ring-blue-500/30"
          >
            {/* Inner Brand Card with Logo Mark */}
            <div className="flex size-full items-center justify-center rounded-full bg-[#082046] transition-transform group-hover:scale-95">
              <div className="relative flex size-9 items-center justify-center">
                <Image
                  src="/logo-mark.png"
                  alt="ApplyFields Emblem"
                  width={34}
                  height={34}
                  unoptimized
                  className="size-8 object-contain drop-shadow transition-transform group-hover:rotate-6"
                />
              </div>
            </div>

            {/* Glowing Active Ring Indicator */}
            <span className="absolute -top-1 -right-1 flex size-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
            </span>

            {/* Quota Badge on Orb */}
            <span
              className={`absolute -bottom-1 -left-1 flex items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-black border border-white shadow-sm ${
                quota.is_premium
                  ? 'bg-amber-400 text-slate-950'
                  : quota.limit_reached
                    ? 'bg-red-500 text-white'
                    : 'bg-[#0e7bf4] text-white'
              }`}
            >
              {quota.is_premium ? '👑' : `${quota.queries_remaining}`}
            </span>
          </button>
        </aside>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Expanded Floating Chat Assistant Card                         */}
      {/* Friendly, Unique, Matches Logo & Tagline                      */}
      {/* ------------------------------------------------------------- */}
      {isOpen && (
        <section
          aria-label="Fieldy · ApplyFields AI Advisor"
          className="fixed bottom-5 right-5 z-50 flex w-[calc(100vw-2.5rem)] sm:w-[420px] max-w-[420px] flex-col overflow-hidden rounded-3xl border border-[#0e7bf4]/25 bg-white shadow-2xl shadow-blue-950/25 backdrop-blur-2xl animate-in zoom-in-95 fade-in duration-200"
          style={{ height: 'min(620px, calc(100vh - 4.5rem))' }}
        >
          {/* Header Bar */}
          <header className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#082046] via-[#0b2d62] to-[#0e7bf4] px-5 py-3.5 text-white">
            <div className="flex items-center gap-3">
              {/* Logo Avatar Badge */}
              <div className="relative flex size-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                <Image
                  src="/logo-mark.png"
                  alt="ApplyFields Mark"
                  width={24}
                  height={24}
                  unoptimized
                  className="size-6 object-contain"
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-2 border-[#082046]" />
              </div>
              <div>
                <h3 className="text-sm font-black flex items-center gap-1.5 leading-tight">
                  Fieldy
                  <span className="text-[10px] font-medium text-blue-200">· AI Advisor</span>
                </h3>
                <p className="text-[10px] text-blue-100/80 italic font-medium">
                  Your first move starts here
                </p>
              </div>
            </div>

            {/* Quota Badge & Controls */}
            <div className="flex items-center gap-2">
              {/* Daily Quota Pill */}
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black border backdrop-blur-md ${
                  quota.is_premium
                    ? 'bg-amber-400/20 text-amber-200 border-amber-300/40'
                    : quota.limit_reached
                      ? 'bg-red-500/20 text-rose-200 border-rose-400/40'
                      : 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40'
                }`}
                title="Daily queries reset at midnight 12:00 AM IST"
              >
                {quota.is_premium ? (
                  <>
                    <Crown className="size-3 text-amber-300" />
                    <span>Plus</span>
                  </>
                ) : (
                  <>
                    <span
                      className={`size-1.5 rounded-full ${
                        quota.limit_reached
                          ? 'bg-rose-400'
                          : quota.queries_remaining === 1
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                      }`}
                    />
                    <span>{quota.queries_remaining}/3 left</span>
                  </>
                )}
              </div>

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear conversation"
                  aria-label="Clear chat"
                  className="rounded-full p-1.5 text-blue-100/80 hover:bg-white/10 hover:text-white transition"
                >
                  <RefreshCw className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize Fieldy"
                aria-label="Close assistant"
                className="rounded-full p-1.5 text-blue-100/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          {/* Subheader Route Context Pill */}
          <div className="bg-[#f0f6ff] border-b border-blue-100/60 px-4 py-1.5 flex items-center justify-between text-[10.5px]">
            <span className="text-[#334a69] font-medium flex items-center gap-1.5 truncate">
              <Zap className="size-3 text-[#0e7bf4]" />
              <strong className="text-[#082046]">Active Context:</strong>{' '}
              {currentOpportunitySlug ? (
                <span className="capitalize">{currentOpportunitySlug.replace(/-/g, ' ')}</span>
              ) : isCareerRoute ? (
                'Career Roadmaps & Guidance'
              ) : (
                'National Job & Exam Intelligence'
              )}
            </span>
            <span className="text-[9.5px] font-bold text-[#0e7bf4] shrink-0">
              &lt;80ms Fast-Path
            </span>
          </div>

          {/* Chat Message Scrollable Container */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-[#f8fafc] to-white text-xs"
          >
            {/* Friendly Welcome Card */}
            <div className="rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 p-3.5 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-black text-[#082046]">
                <Image
                  src="/logo-mark.png"
                  alt="ApplyFields"
                  width={18}
                  height={18}
                  unoptimized
                  className="size-4 object-contain"
                />
                <span>Fieldy AI · Fast-Path + Generative Advisor</span>
              </div>
              <p className="text-[11px] text-[#526987] leading-relaxed">
                {currentOpportunitySlug ? (
                  <span>
                    I have verified the official circular for{' '}
                    <strong className="text-[#082046] font-semibold">
                      {currentOpportunitySlug.replace(/-/g, ' ')}
                    </strong>
                    . Ask about closing dates, fee exemptions, eligibility criteria, or exam stages!
                  </span>
                ) : (
                  <span>
                    Ask any question about government jobs, closing countdowns, fee waivers, or
                    career roadmaps. Free accounts receive <strong>3 AI chats daily</strong>.
                  </span>
                )}
              </p>
            </div>

            {/* Quick Chips (shown when no messages yet) */}
            {messages.length === 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#526987]">
                  Suggested Instant Prompts
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={quota.limit_reached}
                      onClick={() => handleSend(chip.query)}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#082046] hover:border-[#0e7bf4] hover:bg-blue-50/50 hover:text-[#0e7bf4] transition active:scale-95 shadow-2xs text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rendered Messages */}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-[#082046] to-[#0e7bf4] text-white rounded-br-xs font-medium'
                      : 'bg-white border border-[#e2e8f0] text-[#082046] rounded-bl-xs'
                  }`}
                >
                  {/* Mode Badge for assistant messages */}
                  {m.sender === 'assistant' && (
                    <div className="mb-2 flex items-center gap-1.5 pb-1.5 border-b border-slate-100">
                      {m.mode === 'deterministic' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
                          <Zap className="size-2.5 text-emerald-600" />
                          &lt;80ms Fast-Path · 0 LLM Tokens
                        </span>
                      ) : m.mode === 'llm' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-1.5 py-0.5 text-[9.5px] font-bold text-purple-700">
                          <Sparkles className="size-2.5 text-purple-600" />
                          Claude AI Intelligence
                        </span>
                      ) : m.mode === 'limit_reached' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-700">
                          <Crown className="size-2.5 text-amber-600" />
                          Daily Limit Reached
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[9.5px] font-bold text-blue-700">
                          <Bot className="size-2.5 text-blue-600" />
                          ApplyFields Career Engine
                        </span>
                      )}

                      {/* Copy Answer Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined') {
                            navigator.clipboard.writeText(m.text);
                            showAppToast({
                              message: 'Copied answer to clipboard!',
                              type: 'success',
                            });
                          }
                        }}
                        title="Copy answer"
                        className="ml-auto text-slate-400 hover:text-[#082046] p-0.5 rounded transition cursor-pointer"
                      >
                        <Copy className="size-3" />
                      </button>
                    </div>
                  )}

                  {m.sender === 'user' ? (
                    <p className="text-xs leading-relaxed">{m.text}</p>
                  ) : (
                    <div>{renderMarkdown(m.text)}</div>
                  )}

                  {/* Action Buttons */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {m.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleActionClick(act)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[11px] font-bold text-[#0e7bf4] hover:bg-blue-100 hover:text-[#082046] transition active:scale-95"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2 text-[9px] text-slate-400 flex items-center gap-1">
                      <span>Verified:</span>
                      {m.citations.map((c, cIdx) => (
                        <span key={cIdx} className="font-semibold text-slate-500">
                          [{c}]
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-[#94a3b8] px-1">{m.timestamp}</span>

                {/* Follow-up related queries */}
                {m.related_queries && m.related_queries.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1 max-w-[88%]">
                    {m.related_queries.map((rq, rqIdx) => (
                      <button
                        key={rqIdx}
                        type="button"
                        disabled={quota.limit_reached}
                        onClick={() => handleSend(rq)}
                        className="rounded-lg border border-slate-200 bg-white/90 px-2 py-1 text-[10px] text-[#526987] hover:border-[#0e7bf4] hover:text-[#0e7bf4] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ↳ {rq}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Premium Upgrade Gate Card (Shown when quota is exhausted) */}
            {quota.limit_reached && (
              <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50/50 p-4 space-y-3 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black shadow-xs">
                    <Crown className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#082046]">
                      Daily Free Quota Exhausted (3/3)
                    </h4>
                    <p className="text-[10px] text-slate-600">
                      Resets tonight at 12:00 AM IST (midnight)
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white/90 border border-amber-200 p-2.5 text-[11px] text-[#334a69] space-y-1">
                  <div className="flex items-center justify-between font-bold text-[#082046]">
                    <span>ApplyFields Plus</span>
                    <span className="text-emerald-600 font-black">₹50 / month</span>
                  </div>
                  <ul className="text-[10px] space-y-0.5 text-slate-600 pt-1">
                    <li>✓ Unlimited AI queries for all 5,000+ recruitments</li>
                    <li>✓ In-depth syllabus, negative marking &amp; stage breakdowns</li>
                    <li>✓ Instant Admit Card &amp; Answer Key SMS/Push alerts</li>
                    <li>✓ Priority MeeSeva &amp; CSC assisted filing support</li>
                  </ul>
                </div>

                <Link
                  href="/account"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-black text-white hover:from-amber-600 hover:to-orange-600 shadow-md shadow-orange-500/20 transition active:scale-95"
                >
                  <Crown className="size-3.5" />
                  <span>Upgrade to ApplyFields Plus (₹50/mo)</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 p-3 max-w-[80%] shadow-2xs">
                <div className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#0e7bf4] animate-bounce" />
                  <span className="size-1.5 rounded-full bg-[#0e7bf4] animate-bounce [animation-delay:0.2s]" />
                  <span className="size-1.5 rounded-full bg-[#0e7bf4] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[11px] text-[#526987] font-medium">
                  Fieldy is querying the engine (&lt;80ms)...
                </span>
              </div>
            )}
          </div>

          {/* Bottom Query Input Box */}
          <footer className="border-t border-slate-200 bg-white p-3 space-y-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputQuery);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                disabled={quota.limit_reached || isLoading}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  quota.limit_reached
                    ? 'Daily limit reached (3/3 chats) · Upgrade to continue'
                    : currentOpportunitySlug
                      ? 'Ask about deadlines, fees, eligibility...'
                      : 'Ask about any exam, job, or career advice...'
                }
                className="flex-1 rounded-xl border border-slate-200 bg-[#f8fafc] px-3.5 py-2.5 text-xs text-[#082046] placeholder:text-slate-400 focus:border-[#0e7bf4] focus:bg-white focus:outline-none transition disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              />

              {quota.limit_reached ? (
                <Link
                  href="/account"
                  title="Upgrade to ApplyFields Plus"
                  className="flex size-9 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition active:scale-95 shrink-0 shadow-xs"
                >
                  <Lock className="size-4" />
                </Link>
              ) : (
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  aria-label="Send message"
                  className="flex size-9 items-center justify-center rounded-xl bg-[#0e7bf4] text-white hover:bg-[#0c6cd7] disabled:opacity-40 transition active:scale-95 shrink-0 cursor-pointer"
                >
                  <Send className="size-4" />
                </button>
              )}
            </form>

            {/* Quota Reset Status Micro-Bar */}
            <div className="flex items-center justify-between px-1 text-[9.5px] text-slate-400">
              <span>
                {quota.is_premium ? (
                  <strong className="text-amber-600 font-bold">ApplyFields Plus Unlimited</strong>
                ) : quota.limit_reached ? (
                  <span className="text-rose-500 font-semibold">Free limit reached (0/3 remaining)</span>
                ) : (
                  <span>
                    <strong>{quota.queries_remaining}</strong> of 3 free chats left today
                  </span>
                )}
              </span>
              <span>Fast-path: 0 tokens</span>
            </div>
          </footer>
        </section>
      )}
    </>
  );
}
