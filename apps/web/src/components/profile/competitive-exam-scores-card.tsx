'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  ExternalLink,
  GraduationCap,
  Hash,
  Info,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { showAppToast } from '@/components/toast-notification-provider';

export type ExamType =
  | 'GATE'
  | 'JEE_MAIN'
  | 'JEE_ADVANCED'
  | 'NEET_UG'
  | 'NEET_PG'
  | 'CAT'
  | 'UGC_NET'
  | 'CSIR_NET'
  | 'OTHER';

export interface CompetitiveExamScore {
  id: string;
  examType: ExamType;
  examName: string;
  year: number;
  rollNumber?: string;
  registrationNumber?: string;
  disciplineOrPaper?: string;
  score?: string; // e.g. "782 / 1000" or marks
  marks?: string;
  percentile?: string; // e.g. "99.45"
  allIndiaRank?: string; // e.g. "412"
  categoryRank?: string; // e.g. "OBC-NCL 64"
  awardOrStatus?: string; // e.g. "Qualified for JRF & Assistant Professor"
  verified?: boolean;
}

const EXAM_PRESETS: { type: ExamType; name: string; category: string }[] = [
  { type: 'GATE', name: 'GATE (Graduate Aptitude Test in Engineering)', category: 'Engineering / PSU' },
  { type: 'JEE_MAIN', name: 'JEE Main (NTA)', category: 'Engineering (NIT/IIIT/GFTI)' },
  { type: 'JEE_ADVANCED', name: 'JEE Advanced (IITs)', category: 'Engineering (IITs)' },
  { type: 'NEET_UG', name: 'NEET-UG (National Eligibility cum Entrance Test)', category: 'Medical (MBBS/BDS)' },
  { type: 'NEET_PG', name: 'NEET-PG (Medical Post-Graduate)', category: 'Medical (MD/MS)' },
  { type: 'CAT', name: 'CAT (Common Admission Test - IIMs)', category: 'Management (MBA)' },
  { type: 'UGC_NET', name: 'UGC-NET (National Eligibility Test)', category: 'Lectureship / JRF' },
  { type: 'CSIR_NET', name: 'CSIR-UGC NET (Science Streams)', category: 'Lectureship / JRF' },
  { type: 'OTHER', name: 'Other State / National Entrance (CET / CUET / CLAT)', category: 'General' },
];

const DEFAULT_SCORES: CompetitiveExamScore[] = [
  {
    id: 'exam-sample-1',
    examType: 'GATE',
    examName: 'GATE 2025 (Computer Science & IT)',
    year: 2025,
    rollNumber: 'CS25S37108420',
    disciplineOrPaper: 'Computer Science and Information Technology (CS)',
    score: '768 / 1000',
    marks: '66.33 / 100',
    percentile: '99.18',
    allIndiaRank: '428',
    awardOrStatus: 'Qualified for PSU Recruitment & M.Tech Admissions',
    verified: true,
  },
  {
    id: 'exam-sample-2',
    examType: 'JEE_MAIN',
    examName: 'JEE Main 2022',
    year: 2022,
    rollNumber: '220310084912',
    disciplineOrPaper: 'Paper 1 (B.E. / B.Tech)',
    percentile: '98.92',
    allIndiaRank: '11,450',
    categoryRank: 'GEN-EWS AIR 1,210',
    awardOrStatus: 'Eligible for Central Seat Allocation Board (CSAB / JoSAA)',
    verified: true,
  },
];

interface CompetitiveExamScoresCardProps {
  onScoresChange?: (scores: CompetitiveExamScore[]) => void;
}

export function CompetitiveExamScoresCard({ onScoresChange }: CompetitiveExamScoresCardProps) {
  const [scores, setScores] = useState<CompetitiveExamScore[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('applyfields_competitive_exam_scores');
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_SCORES;
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedRollId, setCopiedRollId] = useState<string | null>(null);

  // Form State
  const [examType, setExamType] = useState<ExamType>('GATE');
  const [examName, setExamName] = useState('');
  const [year, setYear] = useState<number>(2025);
  const [rollNumber, setRollNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [disciplineOrPaper, setDisciplineOrPaper] = useState('');
  const [score, setScore] = useState('');
  const [marks, setMarks] = useState('');
  const [percentile, setPercentile] = useState('');
  const [allIndiaRank, setAllIndiaRank] = useState('');
  const [categoryRank, setCategoryRank] = useState('');
  const [awardOrStatus, setAwardOrStatus] = useState('');

  // Sync to localStorage and parent callback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('applyfields_competitive_exam_scores', JSON.stringify(scores));
      } catch (err) {
        console.error('Failed to save exam scores to localStorage', err);
      }
    }
    if (onScoresChange) {
      onScoresChange(scores);
    }
  }, [scores, onScoresChange]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setExamType('GATE');
    setExamName('GATE 2025');
    setYear(2025);
    setRollNumber('');
    setRegistrationNumber('');
    setDisciplineOrPaper('Computer Science and Information Technology (CS)');
    setScore('');
    setMarks('');
    setPercentile('');
    setAllIndiaRank('');
    setCategoryRank('');
    setAwardOrStatus('Qualified');
    setShowModal(true);
  };

  const handleOpenEditModal = (item: CompetitiveExamScore) => {
    setEditingId(item.id);
    setExamType(item.examType);
    setExamName(item.examName);
    setYear(item.year);
    setRollNumber(item.rollNumber || '');
    setRegistrationNumber(item.registrationNumber || '');
    setDisciplineOrPaper(item.disciplineOrPaper || '');
    setScore(item.score || '');
    setMarks(item.marks || '');
    setPercentile(item.percentile || '');
    setAllIndiaRank(item.allIndiaRank || '');
    setCategoryRank(item.categoryRank || '');
    setAwardOrStatus(item.awardOrStatus || '');
    setShowModal(true);
  };

  const handleExamTypeSelect = (selectedType: ExamType) => {
    setExamType(selectedType);
    const preset = EXAM_PRESETS.find((p) => p.type === selectedType);
    if (preset) {
      setExamName(`${preset.type === 'OTHER' ? 'State Entrance Exam' : preset.type.replace('_', ' ')} ${year}`);
    }
    // Set sensible discipline default
    if (selectedType === 'GATE') {
      setDisciplineOrPaper('Computer Science & IT (CS)');
    } else if (selectedType === 'NEET_UG' || selectedType === 'NEET_PG') {
      setDisciplineOrPaper('Medical / Dental');
    } else if (selectedType === 'JEE_MAIN' || selectedType === 'JEE_ADVANCED') {
      setDisciplineOrPaper('Paper 1: B.E. / B.Tech');
    } else if (selectedType === 'CAT') {
      setDisciplineOrPaper('Management Aptitude (VARC, DILR, QA)');
    } else if (selectedType === 'UGC_NET') {
      setDisciplineOrPaper('Commerce / Computer Science');
    }
  };

  const handleSaveExamScore = (e: React.FormEvent) => {
    e.preventDefault();

    const record: CompetitiveExamScore = {
      id: editingId || `exam-${Date.now()}`,
      examType,
      examName: examName.trim() || `${examType} ${year}`,
      year: Number(year) || new Date().getFullYear(),
      rollNumber: rollNumber.trim() || undefined,
      registrationNumber: registrationNumber.trim() || undefined,
      disciplineOrPaper: disciplineOrPaper.trim() || undefined,
      score: score.trim() || undefined,
      marks: marks.trim() || undefined,
      percentile: percentile.trim() || undefined,
      allIndiaRank: allIndiaRank.trim() || undefined,
      categoryRank: categoryRank.trim() || undefined,
      awardOrStatus: awardOrStatus.trim() || 'Qualified',
      verified: true,
    };

    if (editingId) {
      setScores((prev) => prev.map((s) => (s.id === editingId ? record : s)));
      showAppToast('Competitive exam score updated successfully.');
    } else {
      setScores((prev) => [record, ...prev]);
      showAppToast('Competitive exam score added to your credentials.');
    }

    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove record for ${name}?`)) {
      setScores((prev) => prev.filter((s) => s.id !== id));
      showAppToast('Exam record removed.');
    }
  };

  const handleCopyRollNumber = (id: string, roll: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roll);
      setCopiedRollId(id);
      showAppToast(`Roll number copied: ${roll}`);
      setTimeout(() => setCopiedRollId(null), 2500);
    }
  };

  return (
    <div
      id="exam-scores"
      className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Award className="size-5 text-[#0e7bf4]" />
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Competitive exam scores & ranks
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official records for GATE, JEE, NEET, CAT, and UGC-NET scores used for government PSU recruitment and college cutoffs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="size-3.5 stroke-[2.5]" />
          <span>Add Exam Score</span>
        </button>
      </div>

      {/* Scores Grid / Empty state */}
      {scores.length === 0 ? (
        <div className="py-10 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No competitive scores recorded</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Adding your GATE Score, JEE/NEET Rank, or CAT percentile unlocks automatic eligibility matching for premier colleges and PSU vacancies.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Record Your First Score
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {scores.map((item) => {
            const hasRank = Boolean(item.allIndiaRank);
            const hasPercentile = Boolean(item.percentile);

            return (
              <div
                key={item.id}
                className="relative rounded-2xl border border-slate-200/90 bg-[#ffffff] p-4 sm:p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Exam Badge & Year & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md border border-[#dec9a5] bg-[#F4E8D1] text-[11px] font-bold text-[#76562d]">
                        {item.examType.replace('_', ' ')}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-600">
                        {item.year}
                      </span>
                      {item.verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="size-2.5 stroke-[3]" /> Verified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Edit Score"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.examName)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Paper */}
                  <div className="mt-3">
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {item.examName}
                    </h4>
                    {item.disciplineOrPaper && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {item.disciplineOrPaper}
                      </p>
                    )}
                  </div>

                  {/* Score & Rank Highlights Bar */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                    <div>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                        {hasRank ? 'All India Rank' : 'Score / Marks'}
                      </span>
                      <span className="text-sm font-extrabold text-[#082046]">
                        {hasRank ? `AIR ${item.allIndiaRank}` : item.score || item.marks || 'Qualified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                        {hasPercentile ? 'Percentile' : 'Status'}
                      </span>
                      <span className="text-sm font-bold text-[#0e7bf4]">
                        {hasPercentile ? `${item.percentile} %ile` : item.awardOrStatus || 'Eligible'}
                      </span>
                    </div>
                  </div>

                  {/* Additional Metrics Row */}
                  {(item.score || item.marks || item.categoryRank) && (
                    <div className="mt-3 text-[11px] text-slate-600 space-y-1">
                      {item.score && hasRank && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Score:</span>
                          <span className="font-semibold text-slate-800">{item.score}</span>
                        </div>
                      )}
                      {item.marks && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Marks:</span>
                          <span className="font-semibold text-slate-800">{item.marks}</span>
                        </div>
                      )}
                      {item.categoryRank && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Category Rank:</span>
                          <span className="font-semibold text-slate-800">{item.categoryRank}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Roll Number footer */}
                {item.rollNumber && (
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Roll No: <span className="font-mono text-slate-700">{item.rollNumber}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyRollNumber(item.id, item.rollNumber!)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                    >
                      {copiedRollId === item.id ? (
                        <>
                          <Check className="size-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Official Footnote */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
        <ShieldCheck className="size-3.5 text-slate-400 shrink-0" />
        <span>
          Recorded roll numbers are stored on your device profile and formatted for counseling verification and PSU job notifications.
        </span>
      </div>

      {/* Add / Edit Exam Score Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="size-5 text-[#0e7bf4]" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingId ? 'Edit Exam Score' : 'Add Competitive Exam Score'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExamScore} className="mt-4 space-y-4">
              {/* Exam Selection Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Examination Type
                </label>
                <select
                  value={examType}
                  onChange={(e) => handleExamTypeSelect(e.target.value as ExamType)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                >
                  {EXAM_PRESETS.map((p) => (
                    <option key={p.type} value={p.type}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Display Title & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exam Title
                  </label>
                  <input
                    type="text"
                    required
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. GATE 2025"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max="2030"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
              </div>

              {/* Discipline / Paper */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discipline / Paper / Subject
                </label>
                <input
                  type="text"
                  value={disciplineOrPaper}
                  onChange={(e) => setDisciplineOrPaper(e.target.value)}
                  placeholder="e.g. Computer Science and IT (CS), Medical, Commerce"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                />
              </div>

              {/* Roll Number & Registration Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll Number / Hall Ticket No
                  </label>
                  <input
                    type="text"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. CS25S37108420"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Application / Registration No
                  </label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. 240310084912"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
              </div>

              {/* Ranks & Percentile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    All India Rank (AIR)
                  </label>
                  <input
                    type="text"
                    value={allIndiaRank}
                    onChange={(e) => setAllIndiaRank(e.target.value)}
                    placeholder="e.g. 428 or AIR 1280"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NTA / Overall Percentile
                  </label>
                  <input
                    type="text"
                    value={percentile}
                    onChange={(e) => setPercentile(e.target.value)}
                    placeholder="e.g. 99.18"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
              </div>

              {/* Score / Marks & Category Rank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Score / Marks Obtained
                  </label>
                  <input
                    type="text"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g. 768/1000 or 675/720"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Rank (Optional)
                  </label>
                  <input
                    type="text"
                    value={categoryRank}
                    onChange={(e) => setCategoryRank(e.target.value)}
                    placeholder="e.g. OBC-NCL AIR 64"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                  />
                </div>
              </div>

              {/* Award / Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status / Award Qualification
                </label>
                <input
                  type="text"
                  value={awardOrStatus}
                  onChange={(e) => setAwardOrStatus(e.target.value)}
                  placeholder="e.g. Qualified for PSU Recruitment / JRF & Assistant Professor"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0e7bf4]"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0e7bf4] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {editingId ? 'Save Changes' : 'Record Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

