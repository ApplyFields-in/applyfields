'use client';

import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Edit3,
  ExternalLink,
  GraduationCap,
  Layers,
  Plus,
  Save,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';

interface ProgramItem {
  id: string;
  name: string;
  degree: string;
  duration: string;
  intakeSeats: number;
  availableSeats: number;
  annualFee: string;
  cutoffText: string;
  entranceExam: string;
  isOpen: boolean;
}

const INITIAL_PROGRAMS: ProgramItem[] = [
  {
    id: 'prog-01',
    name: 'Computer Science & Engineering (CSE)',
    degree: 'B.Tech',
    duration: '4 Years',
    intakeSeats: 180,
    availableSeats: 24,
    annualFee: '₹1,40,000 / year',
    cutoffText: 'TS EAMCET: Rank 1,200 – 4,500 | JEE Main: 95+ %ile',
    entranceExam: 'TS EAMCET / JEE Main',
    isOpen: true,
  },
  {
    id: 'prog-02',
    name: 'Artificial Intelligence & Data Science',
    degree: 'B.Tech',
    duration: '4 Years',
    intakeSeats: 120,
    availableSeats: 18,
    annualFee: '₹1,40,000 / year',
    cutoffText: 'TS EAMCET: Rank 3,500 – 6,800',
    entranceExam: 'TS EAMCET / JEE Main',
    isOpen: true,
  },
  {
    id: 'prog-03',
    name: 'Electronics & Communication Engineering',
    degree: 'B.Tech',
    duration: '4 Years',
    intakeSeats: 180,
    availableSeats: 42,
    annualFee: '₹1,40,000 / year',
    cutoffText: 'TS EAMCET: Rank 5,000 – 9,500',
    entranceExam: 'TS EAMCET',
    isOpen: true,
  },
  {
    id: 'prog-04',
    name: 'Master of Business Administration (MBA)',
    degree: 'Post-Graduate',
    duration: '2 Years',
    intakeSeats: 60,
    availableSeats: 12,
    annualFee: '₹90,000 / year',
    cutoffText: 'TS ICET: Rank 1 – 1,200 | CAT: 75+ %ile',
    entranceExam: 'TS ICET / CAT',
    isOpen: true,
  },
];

export default function InstitutionProgramsPage() {
  const [programs, setPrograms] = useState<ProgramItem[]>(INITIAL_PROGRAMS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Edit fields
  const [editFee, setEditFee] = useState('');
  const [editCutoff, setEditCutoff] = useState('');
  const [editAvailable, setEditAvailable] = useState<number>(0);

  function startEdit(prog: ProgramItem) {
    setEditingId(prog.id);
    setEditFee(prog.annualFee);
    setEditCutoff(prog.cutoffText);
    setEditAvailable(prog.availableSeats);
  }

  function saveEdit(id: string) {
    setPrograms((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              annualFee: editFee,
              cutoffText: editCutoff,
              availableSeats: editAvailable,
            }
          : item
      )
    );
    setEditingId(null);
    setToast('Program fee & cutoffs updated successfully!');
    setTimeout(() => setToast(null), 3000);
  }

  function toggleProgramStatus(id: string) {
    setPrograms((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isOpen: !item.isOpen } : item))
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Programs, Seat Matrix &amp; Cutoffs Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain accurate fee structures, seat intake, and cutoff requirements displayed to prospective students in Career Mode.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const newProg: ProgramItem = {
              id: `prog-${Date.now()}`,
              name: 'New Degree Program',
              degree: 'B.Tech',
              duration: '4 Years',
              intakeSeats: 60,
              availableSeats: 60,
              annualFee: '₹1,20,000 / year',
              cutoffText: 'TS EAMCET / Merit Based',
              entranceExam: 'TS EAMCET',
              isOpen: true,
            };
            setPrograms([newProg, ...programs]);
            startEdit(newProg);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Program</span>
        </button>
      </div>

      {toast && (
        <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300">
          {toast}
        </div>
      )}

      {/* Program Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((prog) => {
          const isEditing = editingId === prog.id;
          return (
            <div
              key={prog.id}
              className={`rounded-2xl border p-5 transition ${
                prog.isOpen
                  ? 'border-slate-800 bg-slate-900/90'
                  : 'border-slate-800/60 bg-slate-950/40 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                      {prog.degree} · {prog.duration}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prog.isOpen
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {prog.isOpen ? 'Admissions Open' : 'Closed'}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-white">{prog.name}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleProgramStatus(prog.id)}
                    className="text-[11px] font-semibold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                  >
                    {prog.isOpen ? 'Close' : 'Reopen'}
                  </button>
                  <button
                    type="button"
                    onClick={() => (isEditing ? saveEdit(prog.id) : startEdit(prog))}
                    className="p-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition"
                  >
                    {isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Program Details */}
              <div className="mt-4 space-y-3 text-xs">
                {isEditing ? (
                  <div className="space-y-3 rounded-xl bg-slate-950 p-3 border border-blue-500/30">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Annual Tuition Fee
                      </label>
                      <input
                        type="text"
                        value={editFee}
                        onChange={(e) => setEditFee(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Remaining Available Seats
                      </label>
                      <input
                        type="number"
                        value={editAvailable}
                        onChange={(e) => setEditAvailable(parseInt(e.target.value, 10) || 0)}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Cutoff &amp; Eligibility Criteria
                      </label>
                      <input
                        type="text"
                        value={editCutoff}
                        onChange={(e) => setEditCutoff(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => saveEdit(prog.id)}
                      className="w-full rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-500"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Official Annual Fee
                        </span>
                        <span className="font-bold text-white mt-0.5 block">{prog.annualFee}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Seat Matrix
                        </span>
                        <span className="font-bold text-emerald-400 mt-0.5 block">
                          {prog.availableSeats} of {prog.intakeSeats} Seats Available
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">
                        Entrance Exams &amp; Cutoff Range
                      </div>
                      <div className="font-medium text-slate-200">{prog.cutoffText}</div>
                      <div className="text-[11px] text-blue-400 font-bold">
                        Linked Exam: {prog.entranceExam}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
