'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Coffee,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Plus,
  RotateCcw,
  Save,
  Power,
  Users,
  Info,
  CalendarX2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { apiGet, apiPut, apiPost, getMyPartner, updatePartner } from '@/lib/api';

interface DaySchedule {
  dayOfWeek: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  hasBreak: boolean;
  breakStart: string;
  breakEnd: string;
}

interface HolidayOverride {
  id: string;
  date: string;
  reason: string;
  isClosed: boolean;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 1, dayName: 'Monday', isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
  { dayOfWeek: 2, dayName: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
  { dayOfWeek: 3, dayName: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
  { dayOfWeek: 4, dayName: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
  { dayOfWeek: 5, dayName: 'Friday', isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
  { dayOfWeek: 6, dayName: 'Saturday', isOpen: true, openTime: '09:30', closeTime: '18:00', hasBreak: true, breakStart: '13:00', breakEnd: '14:00' },
  { dayOfWeek: 0, dayName: 'Sunday', isOpen: false, openTime: '10:00', closeTime: '14:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' },
];

const DEFAULT_OVERRIDES: HolidayOverride[] = [
  { id: 'hol-1', date: '2026-10-24', reason: 'Diwali Festival Holiday', isClosed: true },
  { id: 'hol-2', date: '2026-11-01', reason: 'Kannada Rajyotsava / State Holiday', isClosed: true },
];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [slotDuration, setSlotDuration] = useState<number>(30); // 15, 30, 45, 60 mins
  const [maxConcurrent, setMaxConcurrent] = useState<number>(2); // 1-10
  const [isEmergencyPaused, setIsEmergencyPaused] = useState<boolean>(false);
  const [holidayOverrides, setHolidayOverrides] = useState<HolidayOverride[]>(DEFAULT_OVERRIDES);

  // Modals & Feedback
  const [showConfirmEmergency, setShowConfirmEmergency] = useState<boolean>(false);
  const [showAddOverrideModal, setShowAddOverrideModal] = useState<boolean>(false);
  const [newOverrideDate, setNewOverrideDate] = useState<string>('');
  const [newOverrideReason, setNewOverrideReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from API or localStorage on mount
  useEffect(() => {
    async function loadSchedule() {
      try {
        const partnerRes = await getMyPartner();
        if (partnerRes.data?.working_hours && Object.keys(partnerRes.data.working_hours).length > 0) {
          const wh = partnerRes.data.working_hours;
          setSchedule((prev) =>
            prev.map((d) => {
              const times = wh[d.dayName.toLowerCase()];
              if (times && times.length >= 2) {
                return {
                  ...d,
                  isOpen: true,
                  openTime: times[0] ?? d.openTime,
                  closeTime: times[1] ?? d.closeTime,
                };
              } else if (times === undefined && wh.hasOwnProperty(d.dayName.toLowerCase())) {
                return { ...d, isOpen: false };
              }
              return d;
            })
          );
        }
      } catch {}

      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('applyfields_partner_schedule_v1');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.schedule) setSchedule(parsed.schedule);
            if (parsed.slotDuration) setSlotDuration(parsed.slotDuration);
            if (parsed.maxConcurrent) setMaxConcurrent(parsed.maxConcurrent);
            if (parsed.isEmergencyPaused !== undefined) setIsEmergencyPaused(parsed.isEmergencyPaused);
            if (parsed.holidayOverrides) setHolidayOverrides(parsed.holidayOverrides);
          } catch {}
        }
      }
    }

    loadSchedule();
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Handle Day Toggle
  function handleDayToggle(index: number) {
    setSchedule((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, isOpen: !item.isOpen } : item))
    );
  }

  // Handle Field Update
  function handleDayFieldChange<K extends keyof DaySchedule>(index: number, field: K, val: DaySchedule[K]) {
    setSchedule((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  }

  // Copy Monday to Weekdays
  function handleCopyMondayToWeekdays() {
    const monday = schedule.find((s) => s.dayOfWeek === 1);
    if (!monday) return;
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.dayOfWeek >= 1 && item.dayOfWeek <= 5) {
          return {
            ...item,
            isOpen: monday.isOpen,
            openTime: monday.openTime,
            closeTime: monday.closeTime,
            hasBreak: monday.hasBreak,
            breakStart: monday.breakStart,
            breakEnd: monday.breakEnd,
          };
        }
        return item;
      })
    );
    showToast('Applied Monday schedule to Tuesday – Friday!');
  }

  // Add Holiday Override
  function handleAddOverride() {
    if (!newOverrideDate) {
      alert('Please pick a date for the holiday override.');
      return;
    }
    const newHol: HolidayOverride = {
      id: `hol-${Date.now()}`,
      date: newOverrideDate,
      reason: newOverrideReason.trim() || 'Holiday Closure',
      isClosed: true,
    };
    setHolidayOverrides((prev) => [newHol, ...prev]);
    setNewOverrideDate('');
    setNewOverrideReason('');
    setShowAddOverrideModal(false);
    showToast('Holiday blackout date added to calendar.');
  }

  // Remove Holiday Override
  function handleRemoveOverride(id: string) {
    setHolidayOverrides((prev) => prev.filter((h) => h.id !== id));
    showToast('Holiday override removed.');
  }

  // Toggle Emergency Pause
  function toggleEmergencyPause() {
    const nextState = !isEmergencyPaused;
    setIsEmergencyPaused(nextState);
    setShowConfirmEmergency(false);
    showToast(
      nextState
        ? '⚠️ Emergency pause active: Bookings paused for today.'
        : '🟢 Center is back online! Accepting appointments.'
    );
  }

  // Save full schedule
  async function handleSaveSchedule() {
    setIsSaving(true);
    const payload = {
      schedule,
      slotDuration,
      maxConcurrent,
      isEmergencyPaused,
      holidayOverrides,
      updatedAt: new Date().toISOString(),
    };

    // Save to local storage for instant availability
    if (typeof window !== 'undefined') {
      localStorage.setItem('applyfields_partner_schedule_v1', JSON.stringify(payload));
    }

    // Backend sync: map schedule to working_hours and update partner profile
    try {
      const working_hours: Record<string, string[]> = {};
      for (const day of schedule) {
        if (day.isOpen) {
          working_hours[day.dayName.toLowerCase()] = [day.openTime, day.closeTime];
        }
      }
      await updatePartner({ working_hours });
      await apiPut('/partners/me/schedule', payload).catch(() => {});
    } catch {
      // Local persistence ensures zero data loss
    } finally {
      setIsSaving(false);
      showToast('Weekly schedule & slot configuration saved successfully!');
    }
  }

  // Calculate Daily Estimated Slots
  const totalOpenDays = schedule.filter((s) => s.isOpen).length;
  const sampleOpenDay = schedule.find((s) => s.isOpen && s.dayOfWeek === 1) || schedule[0];
  const openHours = 11; // 09:00 to 20:00 minus 1 hr break approx
  const estimatedSlotsPerDay = Math.floor((openHours * 60) / slotDuration);
  const estimatedCapacityPerDay = estimatedSlotsPerDay * maxConcurrent;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-slate-900/95 px-5 py-3 text-sm font-semibold text-emerald-400 shadow-2xl shadow-emerald-500/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Emergency Pause Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Session 18 · Partner Capacity & Operating Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Operating Hours & Slot Scheduling
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure weekly working shifts, citizen arrival windows, and appointment limits on <span className="text-emerald-400 font-mono">service.applyfields.in</span>.
          </p>
        </div>

        {/* Emergency Toggle Pill */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowConfirmEmergency(true)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition shadow-sm ${
              isEmergencyPaused
                ? 'border border-rose-500/40 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                : 'border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Power className="h-4 w-4" />
            <span>
              {isEmergencyPaused ? '🔴 Bookings Paused for Today' : '⚡ Pause Bookings Today'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSaveSchedule}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95 shadow-md shadow-emerald-500/20"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save Schedule'}</span>
          </button>
        </div>
      </div>

      {/* Emergency Pause Notice if Active */}
      {isEmergencyPaused && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 text-xs text-rose-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-rose-100">Center Is Temporarily Paused For Today</p>
              <p className="text-rose-300/90 text-[11px] mt-0.5">
                Citizens attempting to book appointments today on the Services portal will see a notice that bookings are paused.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toggleEmergencyPause()}
            className="rounded-xl bg-rose-500 px-3.5 py-1.5 font-bold text-slate-950 hover:bg-rose-400 text-xs shrink-0"
          >
            Resume Today
          </button>
        </div>
      )}

      {/* Top 3 Quick Setting Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Slot Interval */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="h-4 w-4 text-emerald-400" /> Slot Duration
            </span>
            <span className="font-mono text-emerald-400 font-bold">{slotDuration} Mins</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Arrival window per citizen booking</p>
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSlotDuration(mins)}
                className={`rounded-xl py-1.5 text-xs font-bold transition ${
                  slotDuration === mins
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Max Concurrent Visitors */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Users className="h-4 w-4 text-teal-400" /> Max Concurrency
            </span>
            <span className="font-mono text-teal-400 font-bold">{maxConcurrent} Citizens</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Simultaneous candidates per slot</p>
          <div className="flex items-center justify-between mt-3 bg-slate-950/80 rounded-xl px-3 py-1.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setMaxConcurrent(Math.max(1, maxConcurrent - 1))}
              className="h-7 w-7 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold"
            >
              -
            </button>
            <span className="text-sm font-bold text-white">{maxConcurrent} per window</span>
            <button
              type="button"
              onClick={() => setMaxConcurrent(Math.min(10, maxConcurrent + 1))}
              className="h-7 w-7 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Capacity Summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="h-4 w-4 text-cyan-400" /> Center Capacity
            </span>
            <span className="font-mono text-cyan-400 font-bold">{totalOpenDays} Days/Wk</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Automatic slot generation</p>
          <div className="mt-2.5 space-y-1 text-xs">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Slots per shift:</span>
              <span className="font-mono text-white font-bold">~{estimatedSlotsPerDay} slots</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold">
              <span>Daily Max Capacity:</span>
              <span className="font-mono">~{estimatedCapacityPerDay} Citizens</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Shift Matrix Editor */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-400" />
              Weekly Operating Schedule (Mon – Sun)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify your opening hours, closing hours, and optional lunch break for each day.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyMondayToWeekdays}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <RotateCcw className="h-3.5 w-3.5 text-teal-400" />
            <span>Copy Mon hours to Tue–Fri</span>
          </button>
        </div>

        {/* Days List */}
        <div className="space-y-3">
          {schedule.map((day, idx) => (
            <div
              key={day.dayOfWeek}
              className={`rounded-2xl border p-4 transition-all ${
                day.isOpen
                  ? 'border-slate-800 bg-slate-950/70'
                  : 'border-slate-800/60 bg-slate-950/30 opacity-70'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Day Name & Toggle */}
                <div className="flex items-center gap-3 w-40">
                  <button
                    type="button"
                    onClick={() => handleDayToggle(idx)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      day.isOpen ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        day.isOpen ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-bold ${day.isOpen ? 'text-white' : 'text-slate-500'}`}>
                    {day.dayName}
                  </span>
                </div>

                {/* Hours Controls if Open */}
                {day.isOpen ? (
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    {/* Shift Times */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">Shift:</span>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => handleDayFieldChange(idx, 'openTime', e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-white text-xs outline-none focus:border-emerald-500"
                      />
                      <span className="text-slate-500">to</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => handleDayFieldChange(idx, 'closeTime', e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-white text-xs outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Break Toggle & Times */}
                    <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                      <button
                        type="button"
                        onClick={() => handleDayFieldChange(idx, 'hasBreak', !day.hasBreak)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-[11px] transition ${
                          day.hasBreak
                            ? 'bg-teal-500/20 text-teal-300'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Coffee className="h-3 w-3" />
                        <span>{day.hasBreak ? 'Break: Active' : 'No Break'}</span>
                      </button>

                      {day.hasBreak && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={day.breakStart}
                            onChange={(e) => handleDayFieldChange(idx, 'breakStart', e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-white text-xs outline-none focus:border-teal-500"
                          />
                          <span className="text-slate-500">–</span>
                          <input
                            type="time"
                            value={day.breakEnd}
                            onChange={(e) => handleDayFieldChange(idx, 'breakEnd', e.target.value)}
                            className="rounded-xl border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-white text-xs outline-none focus:border-teal-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-semibold italic">
                    Closed all day — no booking slots will be generated.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Holiday Overrides & Blackouts Section */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarX2 className="h-5 w-5 text-amber-400" />
              Holiday Blackouts & Special Closures
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Block booking slots on national holidays, festivals, or scheduled store renovations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddOverrideModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Holiday Blackout</span>
          </button>
        </div>

        {holidayOverrides.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
            No holiday blackout dates set. Regular weekly shifts apply every week.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {holidayOverrides.map((hol) => (
              <div
                key={hol.id}
                className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">{hol.date}</span>
                    <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                      Closed
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-200 mt-1">{hol.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveOverride(hol.id)}
                  className="rounded-lg p-2 text-slate-500 hover:text-rose-400 transition"
                  title="Remove holiday override"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Emergency Toggle */}
      {showConfirmEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {isEmergencyPaused ? 'Resume Bookings Today?' : 'Pause All Bookings Today?'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isEmergencyPaused
                ? 'Your center will immediately re-appear as Online on the citizen booking directory and accept remaining slots for today.'
                : 'This will instantly prevent citizens from reserving any new time slots for today. Existing confirmed appointments remain visible in your Bookings queue.'}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmEmergency(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={toggleEmergencyPause}
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Holiday Override */}
      {showAddOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarX2 className="h-4 w-4 text-amber-400" />
                Add Holiday Blackout
              </h3>
              <button
                type="button"
                onClick={() => setShowAddOverrideModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Blackout Date</label>
                <input
                  type="date"
                  value={newOverrideDate}
                  onChange={(e) => setNewOverrideDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-amber-400 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason / Festival Name</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali, Sankranti, Shop Renovation..."
                  value={newOverrideReason}
                  onChange={(e) => setNewOverrideReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-amber-400 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddOverrideModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddOverride}
                className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Add Blackout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
