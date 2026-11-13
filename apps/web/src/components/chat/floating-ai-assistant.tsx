'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Bot,
  CalendarClock,
  Copy,
  Crown,
  Lock,
  Newspaper,
  RefreshCw,
  Send,
  Sparkles,
  Store,
  ThumbsDown,
  ThumbsUp,
  X,
  Zap,
} from 'lucide-react';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { showAppToast } from '@/components/toast-notification-provider';
import { usePipApply } from '@/context/pip-apply-context';
import { FieldyMascot, prefetchFieldy, type FieldyMood } from './fieldy-mascot';
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

function makeMessageMeta(prefix: 'usr' | 'bot') {
  return {
    id: `${prefix}-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/** No typing, sending or tapping for this long → Fieldy dozes off. */
const BORED_AFTER_MS = 25_000;
/** Typing paused this long → Fieldy stops "working". */
const TYPING_PAUSE_MS = 2_500;

/** Pages, not questions: instant and they don't use the 3 free chats. */
const SHORTCUTS = [
  {
    label: 'Deadlines',
    hint: 'Closing in 7 days',
    href: '/apply?deadline=7d',
    icon: CalendarClock,
  },
  { label: 'Suits me', hint: 'What I am eligible for', href: '/eligibility', icon: BadgeCheck },
  {
    label: 'Latest updates',
    hint: 'Recently added results & notices',
    href: '/updates',
    icon: Newspaper,
  },
  { label: 'Saved', hint: 'My saved opportunities', href: '/saved', icon: Bookmark },
  { label: 'Help centres', hint: 'MeeSeva / CSC near me', href: '/services', icon: Store },
] as const;

const MOOD_CAPTION: Record<FieldyMood, string> = {
  idle: 'Your first move starts here',
  greeting: 'Hi! Ask me anything',
  working: 'Reading along…',
  thinking: 'Thinking…',
  success: 'Here you go!',
  'bored-idle': 'Still here when you need me',
};

/** **bold** and [title](/site/path) -> HTML. Only links to our own pages (a path starting with "/"). */
function inlineMarkdown(s: string): string {
  return s
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /\[([^\]]+)\]\((\/[\w\-/?=&#.]*)\)/g,
      '<a href="$2" class="font-semibold text-[#0e7bf4] underline hover:text-[#082046]">$1</a>',
    );
}

// Format simple markdown (bold, headers, bullets, links) safely
function renderMarkdown(content: string) {
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    // Headers
    if (line.startsWith('## ')) {
      return (
        <h3
          key={idx}
          className="mt-3 mb-1.5 text-sm font-black text-[#082046] border-b border-blue-100 pb-1"
        >
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
      const formatted = inlineMarkdown(bulletText);
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
      const formatted = inlineMarkdown(numText);
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
    const formatted = inlineMarkdown(line);
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
  const router = useRouter();
  const { openPip } = usePipApply();
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'helpful' | 'unhelpful'>>({});
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fieldy's mood follows the conversation: wave on open, "working" while you type,
  // thinking (looping) until the answer lands, a cheer when it does, dozing when left alone.
  const [mood, setMood] = useState<FieldyMood>('greeting');
  const [orbMood, setOrbMood] = useState<FieldyMood>('greeting');
  const [replay, setReplay] = useState(0);
  const [orbHover, setOrbHover] = useState(false);
  const boredTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function react(next: FieldyMood) {
    setMood(next);
    clearTimeout(boredTimer.current);
    if (next !== 'thinking')
      boredTimer.current = setTimeout(() => setMood('bored-idle'), BORED_AFTER_MS);
  }

  function openChat() {
    prefetchFieldy('greeting', 'thinking', 'success');
    setIsOpen(true);
    react('greeting');
    setReplay((n) => n + 1);
  }

  function closeChat() {
    setIsOpen(false);
    clearTimeout(boredTimer.current);
    clearTimeout(typingTimer.current);
  }

  function waveHello() {
    if (isLoading) return;
    react('greeting');
    setReplay((n) => n + 1);
  }

  function onTyping(value: string) {
    setInputQuery(value);
    if (isLoading) return;
    react(value.trim() ? 'working' : 'idle');
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => react('idle'), TYPING_PAUSE_MS);
  }

  useEffect(
    () => () => {
      clearTimeout(boredTimer.current);
      clearTimeout(typingTimer.current);
    },
    [],
  );

  // Daily Quota Tracking (3 free chats/day, resets at midnight IST)
  const [quota, setQuota] = useState<QuotaState>({
    daily_limit: 3,
    queries_used: 0,
    queries_remaining: 3,
    is_premium: false,
    limit_reached: false,
  });

  // 1. Route guard: Show everywhere except dedicated auth screens
  const isHiddenRoute = /^\/(login|register|forgot-password|auth)(\/|$)/.test(pathname || '');

  // 2. Extract opportunity context from URL if available
  const oppSlugMatch = pathname?.match(
    /\/(jobs|exams|scholarships|admissions|apply\/(?:jobs|exams|scholarships|admissions))\/([^/?#]+)/,
  );
  const currentOpportunitySlug = oppSlugMatch ? oppSlugMatch[2] : undefined;
  const isCareerRoute = pathname?.startsWith('/career');

  // Sync auth status and wave Fieldy on launcher mount before switching to resting loop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncAuth = () => {
      const hasToken = Boolean(
        localStorage.getItem('accessToken') || localStorage.getItem('currentUser'),
      );
      setIsSignedIn(hasToken);
      if (hasToken) {
        apiGet<{ id?: string }>('/me')
          .then((res) => {
            if (res && typeof res === 'object' && 'error' in res && res.error) {
              setIsSignedIn(false);
            } else if (res) {
              setIsSignedIn(true);
            }
          })
          .catch(() => {});
      }
    };

    queueMicrotask(syncAuth);
    window.addEventListener('auth-changed', syncAuth);
    window.addEventListener('storage', syncAuth);

    const orbTimer = setTimeout(() => setOrbMood('bored-idle'), 3000);
    return () => {
      window.removeEventListener('auth-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
      clearTimeout(orbTimer);
    };
  }, []);

  // Load chat history & fetch live quota on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    queueMicrotask(() => {
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
    });

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

  if (isHiddenRoute) {
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
      ...makeMessageMeta('usr'),
      sender: 'user',
      text: q,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputQuery('');
    setIsLoading(true);
    clearTimeout(typingTimer.current);
    react('thinking'); // loops until the answer (or an error) arrives
    let answered = false;

    try {
      const hasAuthToken =
        isSignedIn ||
        (typeof window !== 'undefined' &&
          Boolean(localStorage.getItem('accessToken') || localStorage.getItem('currentUser')));

      if (!hasAuthToken) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        answered = true;
        const meta = makeMessageMeta('bot');
        const guestMsg: Message = {
          ...meta,
          sender: 'assistant',
          text: 'Please **sign in to continue** chatting with Fieldy.\n\nSign in to your ApplyFields account to get personalized answers and your 3 daily free chats.',
          actions: [{ label: 'Sign in to continue →', action: 'navigate', url: '/login' }],
        };
        const updated = [...nextMessages, guestMsg];
        setMessages(updated);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        return;
      }

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

        answered = res.data.mode !== 'limit_reached';
        botMsg = {
          ...makeMessageMeta('bot'),
          sender: 'assistant',
          text: res.data.answer,
          mode: res.data.mode,
          actions: res.data.actions,
          citations: res.data.citations,
          related_queries: res.data.related_queries,
        };
      } else {
        botMsg = {
          ...makeMessageMeta('bot'),
          sender: 'assistant',
          text: 'I could not retrieve the record at this moment. You can browse active circulars under `/apply`.',
        };
      }

      const updated = [...nextMessages, botMsg];
      setMessages(updated);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {
      const errorMsg: Message = {
        ...makeMessageMeta('bot'),
        sender: 'assistant',
        text: 'Connection to the query engine was interrupted. Please try again.',
      };
      setMessages([...nextMessages, errorMsg]);
    } finally {
      setIsLoading(false);
      react(answered ? 'success' : 'idle');
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
      if (action.url.startsWith('/')) {
        setIsOpen(false);
        router.push(action.url);
      } else {
        window.location.assign(action.url);
      }
    }
  }

  function handleClearChat() {
    setMessages([]);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  async function handleFeedback(
    messageId: string,
    answerText: string,
    rating: 'helpful' | 'unhelpful',
  ) {
    setFeedbackMap((prev) => ({ ...prev, [messageId]: rating }));
    showAppToast({
      message:
        rating === 'helpful'
          ? 'Thank you for your feedback!'
          : 'Feedback noted. We will improve this answer.',
      type: 'success',
    });
    try {
      const lastUserMsg = messages.filter((m) => m.sender === 'user').pop();
      await apiPost('/chatbot/feedback', {
        query: lastUserMsg?.text || 'Opportunity inquiry',
        answer: answerText,
        rating,
        opportunity_slug: currentOpportunitySlug,
      });
    } catch {}
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
            onClick={openChat}
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
            onClick={openChat}
            onMouseEnter={() => setOrbHover(true)}
            onMouseLeave={() => setOrbHover(false)}
            onFocus={() => setOrbHover(true)}
            onBlur={() => setOrbHover(false)}
            aria-label="Open Fieldy AI Advisor"
            className="group relative flex size-16 items-center justify-center rounded-full bg-gradient-to-tr from-[#082046] via-[#0e7bf4] to-[#10b981] p-0.5 text-white shadow-2xl shadow-blue-600/35 transition-all hover:scale-108 active:scale-95 cursor-pointer ring-4 ring-blue-500/15 hover:ring-blue-500/30"
          >
            {/* Fieldy waves when you point at him; still poster otherwise (no download until then) */}
            <FieldyMascot
              mood={orbHover ? 'greeting' : orbMood}
              className="size-full rounded-full"
            />

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
              {/* Live Fieldy: mirrors the conversation once it has started (the welcome card shows him before that) */}
              <button
                type="button"
                onClick={waveHello}
                title="Say hi to Fieldy"
                aria-label="Say hi to Fieldy"
                className="relative shrink-0 cursor-pointer rounded-2xl border border-white/30 shadow-inner transition active:scale-95"
              >
                <FieldyMascot
                  mood={isLoading ? 'thinking' : mood}
                  replay={replay}
                  className="size-12 rounded-2xl"
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-2 border-[#082046]" />
              </button>
              <div>
                <h3 className="text-sm font-black flex items-center gap-1.5 leading-tight">
                  Fieldy
                  <span className="text-[10px] font-medium text-blue-200">· AI Advisor</span>
                </h3>
                <p className="text-[10px] text-blue-100/80 italic font-medium" aria-live="polite">
                  {MOOD_CAPTION[mood]}
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
                onClick={closeChat}
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
            <div className="flex items-start gap-3 rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/30 p-3.5 shadow-2xs">
              {messages.length === 0 && (
                <button
                  type="button"
                  onClick={waveHello}
                  title="Tap to say hi"
                  aria-label="Say hi to Fieldy"
                  className="shrink-0 cursor-pointer rounded-2xl transition hover:scale-105 active:scale-95"
                >
                  <FieldyMascot mood={mood} replay={replay} className="size-24 rounded-2xl" />
                </button>
              )}
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-[#082046]">
                  <span>Fieldy AI · Fast-Path + Generative Advisor</span>
                </div>
                <p className="text-[11px] text-[#526987] leading-relaxed">
                  {currentOpportunitySlug ? (
                    <span>
                      I have verified the official circular for{' '}
                      <strong className="text-[#082046] font-semibold">
                        {currentOpportunitySlug.replace(/-/g, ' ')}
                      </strong>
                      . Ask about closing dates, fee exemptions, eligibility criteria, or exam
                      stages!
                    </span>
                  ) : (
                    <span>
                      Ask any question about government jobs, closing countdowns, fee waivers, or
                      career roadmaps. Free accounts receive <strong>3 AI chats daily</strong>.
                    </span>
                  )}
                </p>
              </div>
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

                      {/* Feedback & Copy Actions */}
                      <div className="ml-auto flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, m.text, 'helpful')}
                          title="Helpful answer"
                          className={`p-0.5 rounded transition ${
                            feedbackMap[m.id] === 'helpful'
                              ? 'text-emerald-600 bg-emerald-50'
                              : 'text-slate-400 hover:text-emerald-600'
                          }`}
                        >
                          <ThumbsUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(m.id, m.text, 'unhelpful')}
                          title="Not helpful"
                          className={`p-0.5 rounded transition ${
                            feedbackMap[m.id] === 'unhelpful'
                              ? 'text-red-500 bg-red-50'
                              : 'text-slate-400 hover:text-red-500'
                          }`}
                        >
                          <ThumbsDown className="size-3" />
                        </button>
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
                          className="text-slate-400 hover:text-[#082046] p-0.5 rounded transition cursor-pointer"
                        >
                          <Copy className="size-3" />
                        </button>
                      </div>
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
              <div
                role="status"
                className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 p-2 pr-4 max-w-[80%] shadow-2xs"
              >
                {/* Loops until the answer arrives (the header Fieldy rests meanwhile) */}
                <FieldyMascot mood="thinking" className="size-16 rounded-xl" />
                <span className="text-[11px] text-[#526987] font-medium">Fieldy is thinking…</span>
              </div>
            )}
          </div>

          {/* Bottom Query Input Box */}
          <footer className="border-t border-slate-200 bg-white p-3 space-y-1.5">
            {/* Shortcuts: straight to the page, free, and they work even after the daily chat limit */}
            <nav
              aria-label="Shortcuts"
              className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-0.5 scrollbar-none"
            >
              {SHORTCUTS.map(({ label, hint, href, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  title={hint}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-100 bg-[#f0f6ff] px-2.5 py-1 text-[11px] font-bold text-[#082046] transition hover:border-[#0e7bf4] hover:bg-blue-50 hover:text-[#0e7bf4] active:scale-95"
                >
                  <Icon className="size-3 text-[#0e7bf4]" aria-hidden="true" />
                  {label}
                </a>
              ))}
            </nav>
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
                onChange={(e) => onTyping(e.target.value)}
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
                  <span className="text-rose-500 font-semibold">
                    Free limit reached (0/3 remaining)
                  </span>
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
