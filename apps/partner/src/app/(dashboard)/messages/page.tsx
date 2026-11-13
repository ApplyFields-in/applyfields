'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Search,
  Phone,
  Send,
  Paperclip,
  CheckCheck,
  Clock,
  User,
  ShieldCheck,
  FileText,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  getBookingMessages,
  getPartnerConversations,
  markBookingMessagesRead,
  sendBookingMessage,
} from '@/lib/api';



export interface ChatMessage {
  id: string;
  senderType: 'citizen' | 'partner' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  attachments?: Array<{
    name: string;
    size: string;
    kind: 'pdf' | 'image';
  }>;
}

export interface ConversationThread {
  bookingId: string;
  token: string;
  citizenName: string;
  citizenPhone: string;
  serviceTitle: string;
  slotDate: string;
  slotTime: string;
  unreadCount: number;
  lastMessage: string;
  lastTimestamp: string;
  messages: ChatMessage[];
}


const QUICK_PRESETS = [
  'Please bring your original physical Aadhaar Card for biometric verification.',
  'Your photo resolution is too low for the official portal. Please upload a clear photo.',
  'Yes, you can arrive 10–15 minutes early; your slot is reserved with zero wait.',
  'Your application has been filed! Uploading your official acknowledgment slip now.',
  'Please bring 2 recent passport-size photographs with white background.',
];

export default function PartnerMessagesPage() {
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [activeToken, setActiveToken] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find((t) => t.token === activeToken) || threads[0];

  // Fetch live partner conversations
  useEffect(() => {
    let isMounted = true;
    async function loadThreads() {
      try {
        const res = await getPartnerConversations();
        if (res.data && res.data.threads && res.data.threads.length > 0 && isMounted) {
          const liveThreads: ConversationThread[] = res.data.threads.map((t) => ({
            bookingId: t.booking_id,
            token: t.token,
            citizenName: t.citizen_name,
            citizenPhone: t.citizen_phone,
            serviceTitle: t.service_title,
            slotDate: t.slot_date || '',
            slotTime: t.slot_time || '',
            unreadCount: t.unread_count,
            lastMessage: t.last_message,
            lastTimestamp: t.last_timestamp ? new Date(t.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            messages: [],
          }));

          setThreads((prev) => {
            // Preserve any loaded messages for existing threads
            return liveThreads.map((lt) => {
              const existing = prev.find((p) => p.bookingId === lt.bookingId);
              return existing && existing.messages.length > 0
                ? { ...lt, messages: existing.messages }
                : lt;
            });
          });

          setActiveToken((cur) => cur || liveThreads[0].token);
        }
      } catch (err) {
        console.warn('Could not load live threads, fallback to demo mode:', err);
      }
    }

    loadThreads();
    const interval = setInterval(loadThreads, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch messages for active booking
  useEffect(() => {
    if (!activeThread?.bookingId) return;
    let isMounted = true;

    async function fetchThreadMessages() {
      try {
        const res = await getBookingMessages(activeThread.bookingId);
        if (res.data && res.data.length > 0 && isMounted) {
          const mappedMsgs: ChatMessage[] = res.data.map((m) => ({
            id: m.id,
            senderType: m.sender_type,
            senderName: m.sender_name,
            text: m.message,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isRead: m.is_read,
            attachments: m.attachments?.map((a) => ({
              name: a.name,
              size: a.file_size || '150 KB',
              kind: (a.kind as any) || (a.name.endsWith('.pdf') ? 'pdf' : 'image'),
            })),
          }));

          setThreads((prev) =>
            prev.map((t) =>
              t.bookingId === activeThread.bookingId
                ? { ...t, messages: mappedMsgs, unreadCount: 0 }
                : t,
            ),
          );

          // Mark read on server
          markBookingMessagesRead(activeThread.bookingId, 'partner').catch(() => {});
        }
      } catch (err) {
        console.warn('Failed to fetch messages for thread:', err);
      }
    }

    fetchThreadMessages();
    const interval = setInterval(fetchThreadMessages, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeToken, activeThread?.bookingId]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  // Mark active thread as read locally
  useEffect(() => {
    if (activeThread && activeThread.unreadCount > 0) {
      setThreads((prev) => {
        const updated = prev.map((t) =>
          t.token === activeThread.token
            ? {
                ...t,
                unreadCount: 0,
                messages: t.messages.map((m) => ({ ...m, isRead: true })),
              }
            : t,
        );
        if (activeThread.bookingId) {
          markBookingMessagesRead(activeThread.bookingId, 'partner').catch(() => {});
        }
        return updated;
      });
    }
  }, [activeToken]);


  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text || !activeThread) return;

    const optimisticMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      senderType: 'partner',
      senderName: 'Partner Desk',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    };

    setThreads((prev) => {
      const updated = prev.map((t) =>
        t.token === activeThread.token
          ? {
              ...t,
              lastMessage: text,
              lastTimestamp: 'Just now',
              messages: [...t.messages, optimisticMsg],
            }
          : t,
      );
      return updated;
    });

    if (!textToSend) {
      setInputText('');
    }

    // Dispatch to server if booking ID exists
    // The server sets the sender (your centre's name) from your login.
    const res = await sendBookingMessage(activeThread.bookingId, {
      message: text,
      sender_type: 'partner',
      sender_name: 'Partner Desk',
    }).catch(() => null);
    if (!res?.data) {
      // Don't leave an unsent message looking sent.
      setThreads((prev) =>
        prev.map((t) =>
          t.bookingId === activeThread.bookingId
            ? { ...t, messages: t.messages.map((m) => (m.id === optimisticMsg.id ? { ...m, text: `${m.text}  (not sent, tap send to retry)` } : m)) }
            : t,
        ),
      );
      if (textToSend === undefined) setInputText(text);
    }
  }

  const filteredThreads = threads.filter(
    (t) =>
      t.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              Live Real-Time
            </span>
            <span className="text-xs text-slate-400">Session 21 Operational Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Citizen ↔ Partner Communication Desk
          </h1>
          <p className="text-xs text-slate-400">
            Real-time messaging, clarification requests, and document exchange with booked citizens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> Chime On
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-slate-500" /> Chime Muted
              </>
            )}
          </button>
          <Link
            href="/bookings"
            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300"
          >
            Open Execution Desk <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Main 2-Pane Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-md">
        {/* Left Col: Threads List (4 cols) */}
        <div className="lg:col-span-4 border-r border-slate-800/80 flex flex-col bg-slate-950/40">
          {/* Search box */}
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search citizen or token #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {filteredThreads.length === 0 && (
              <p className="p-4 text-xs text-slate-400">
                No conversations yet. When a citizen books your centre, their chat appears here.
              </p>
            )}
            {filteredThreads.map((thread) => {
              const isActive = thread.token === activeThread?.token;
              return (
                <button
                  key={thread.token}
                  type="button"
                  onClick={() => setActiveToken(thread.token)}
                  className={`w-full text-left p-4 transition-all flex items-start justify-between gap-3 ${
                    isActive
                      ? 'bg-slate-800/70 border-l-4 border-cyan-400'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate">
                        {thread.citizenName}
                      </span>
                      <span className="font-mono text-[10px] text-cyan-400 font-semibold shrink-0">
                        #{thread.token}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 truncate">
                      {thread.serviceTitle}
                    </div>

                    <div className="text-[11px] text-slate-500 truncate italic">
                      &ldquo;{thread.lastMessage}&rdquo;
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-500">{thread.lastTimestamp}</span>
                    {thread.unreadCount > 0 && (
                      <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Active Conversation Thread (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-slate-950/20">
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-white">{activeThread.citizenName}</h2>
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      #{activeThread.token}
                    </span>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      Confirmed Slot
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>{activeThread.serviceTitle}</span>
                    <span>•</span>
                    <span className="text-slate-300 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3 text-cyan-400" /> {activeThread.slotTime} ({activeThread.slotDate})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${activeThread.citizenPhone}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-400" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${activeThread.citizenPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[440px]">
                {activeThread.messages.map((msg) => {
                  if (msg.senderType === 'system') {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <span className="rounded-full bg-slate-800/80 border border-slate-700/60 px-3.5 py-1 text-[11px] text-slate-400">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isPartner = msg.senderType === 'partner';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isPartner ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 px-1">
                        <span className="font-semibold text-slate-400">{msg.senderName}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`rounded-2xl px-4 py-3 text-xs max-w-md space-y-2 shadow-sm ${
                          isPartner
                            ? 'bg-cyan-500 text-slate-950 font-medium rounded-tr-sm'
                            : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700/60'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>

                        {/* Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {msg.attachments.map((att, idx) => (
                              <div
                                key={idx}
                                className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] ${
                                  isPartner ? 'bg-cyan-600/30 text-slate-900' : 'bg-slate-900 text-slate-300 border border-slate-700'
                                }`}
                              >
                                <span className="font-medium truncate max-w-[180px]">{att.name}</span>
                                <span className="text-[10px] opacity-75">{att.size}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {isPartner && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 px-1">
                          <CheckCheck className="h-3 w-3 text-cyan-400" /> Delivered
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick-Reply Presets Bar */}
              <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 overflow-x-auto whitespace-nowrap space-x-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 inline-flex items-center gap-1">
                  Quick Replies:
                </span>
                {QUICK_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(preset)}
                    className="inline-block rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-400 hover:text-white transition"
                  >
                    {preset.slice(0, 36)}...
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message or instruction to citizen (Enter to send)..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  className="inline-flex items-center justify-center rounded-xl bg-cyan-400 h-10 w-10 text-slate-950 hover:bg-cyan-300 transition shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Select a conversation to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
