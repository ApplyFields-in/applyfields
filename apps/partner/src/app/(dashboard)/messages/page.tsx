'use client';

import Link from 'next/link';
import { MessageSquare, Sparkles } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Citizen ↔ Partner Communication Desk</h1>
          <p className="text-xs text-slate-400 mt-1">
            Two-way real-time messaging, clarification requests, and document exchange with booked citizens.
          </p>
        </div>
        <span className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400">
          Module: Session 21
        </span>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
          <MessageSquare className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Two-Way Live Chat Launches in Session 21</h2>
        <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
          Chat directly with booked citizens before they arrive at your center (e.g. &ldquo;Please bring original Aadhaar and 2 passport photos&rdquo;) or send instant status updates.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
