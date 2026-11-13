'use client';

import React, { useEffect, useState } from 'react';
import type { AvailableSlotsResponse } from '@applyfields/types';
import { apiGet } from '@/lib/api';
import { Calendar, Clock, ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';

export interface TimeSlot {
  id: string;
  time: string;
  startTime: string;
  endTime: string;
  period: 'morning' | 'afternoon' | 'evening';
  remainingCapacity: number;
  totalCapacity: number;
  isAvailable: boolean;
}

interface SlotPickerProps {
  selectedDate: string;
  selectedSlotId: string | null;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: TimeSlot) => void;
  partnerName?: string;
  /** The centre's id: slots come from its real schedule (GET /partners/:id/available-slots). */
  partnerId?: string;
}

// Generate next 7 dates
function generateUpcomingDays() {
  const days: { dateStr: string; dayName: string; dayNumber: number; monthName: string }[] = [];
  const base = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push({
      dateStr: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' }),
    });
  }
  return days;
}


export function SlotPicker({
  selectedDate,
  selectedSlotId,
  onSelectDate,
  onSelectSlot,
  partnerName = 'Partner Center',
  partnerId,
}: SlotPickerProps) {
  const days = generateUpcomingDays();
  const key = partnerId && selectedDate ? `${partnerId}|${selectedDate}` : null;
  const [loaded, setLoaded] = useState<{ key: string; data: AvailableSlotsResponse | null } | null>(null);

  useEffect(() => {
    if (!partnerId || !selectedDate) return;
    let active = true;
    const k = `${partnerId}|${selectedDate}`;
    apiGet<AvailableSlotsResponse>(`/partners/${encodeURIComponent(partnerId)}/available-slots?date=${selectedDate}`).then((res) => {
      if (active) setLoaded({ key: k, data: res.data ?? null });
    });
    return () => {
      active = false;
    };
  }, [partnerId, selectedDate]);

  const loading = Boolean(key) && loaded?.key !== key;
  const data = loaded?.key === key ? loaded.data : null;
  const slots = data?.slots ?? [];
  const PERIODS = [
    { id: 'morning', label: 'Morning' },
    { id: 'afternoon', label: 'Afternoon' },
    { id: 'evening', label: 'Evening' },
  ] as const;

  return (
    <div className="space-y-6 cut-corner-card rounded-[28px] border border-white bg-white p-6 shadow-clay-card">
      {/* Date Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#0e7bf4]" />
            <h3 className="text-sm font-black text-[#082046]">Select Appointment Date</h3>
          </div>
          <span className="text-[11px] text-[#526987] font-semibold">Operating: Mon – Sat (09:00 – 19:30)</span>
        </div>

        {/* 7-Day Horizontal Scroller */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {days.map((day) => {
            const isSelected = selectedDate === day.dateStr;
            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => onSelectDate(day.dateStr)}
                className={`cut-corner-tab flex flex-col items-center justify-center p-2.5 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-[#0e7bf4] text-white shadow-clay-btn-azure font-bold'
                    : 'bg-[#edf2f8] text-[#526987] hover:text-[#082046] shadow-[inset_1px_1px_3px_#d5deea,inset_-1px_-1px_3px_#ffffff]'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white' : 'text-[#526987]'}`}>
                  {day.dayName}
                </span>
                <span className={`text-base font-black my-0.5 ${isSelected ? 'text-white' : 'text-[#082046]'}`}>
                  {day.dayNumber}
                </span>
                <span className={`text-[10px] font-semibold ${isSelected ? 'text-white/80' : 'text-[#7896bc]'}`}>
                  {day.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots Section */}
      <div className="space-y-5 border-t border-[#d5deea] pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#0e7bf4]" />
            <h3 className="text-sm font-black text-[#082046]">Open time slots</h3>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px] text-[#526987] font-semibold">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Available
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Fast Filling
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-300" /> Booked Out
            </span>
          </div>
        </div>

        {!partnerId ? (
          <p className="rounded-xl bg-[#edf2f8] p-3 text-xs font-medium text-[#526987]">
            Choose a centre first to see its open times.
          </p>
        ) : loading ? (
          <p className="text-xs font-medium text-[#526987]">Loading {partnerName}&apos;s open times…</p>
        ) : !data ? (
          <p className="rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800">
            Couldn&apos;t load open times right now. Please try again in a minute.
          </p>
        ) : data.isClosed || slots.length === 0 ? (
          <p className="rounded-xl bg-[#edf2f8] p-3 text-xs font-medium text-[#526987]">
            {data.closedReason || `${partnerName} has no open times on this day.`} Please pick another day.
          </p>
        ) : (
          PERIODS.filter((p) => slots.some((sl) => sl.period === p.id)).map((p) => (
            <div key={p.id} className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#526987]">{p.label}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {slots
                  .filter((slot) => slot.period === p.id)
                  .map((slot) => (
                    <SlotCard
                      key={slot.id}
                      slot={slot}
                      isSelected={selectedSlotId === slot.id}
                      onSelect={() => onSelectSlot(slot)}
                    />
                  ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  isSelected,
  onSelect,
}: {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: () => void;
}) {
  if (!slot.isAvailable) {
    return (
      <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-[#edf2f8] opacity-50 cursor-not-allowed text-xs">
        <span className="font-mono text-slate-400 font-semibold">{slot.time.split('–')[0].trim()}</span>
        <span className="text-[10px] text-slate-400 font-bold uppercase">Booked</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`cut-corner-btn flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all active:scale-95 ${
        isSelected
          ? 'border-[#0e7bf4] bg-[#e0edfb] text-[#0e7bf4] shadow-sm font-black ring-2 ring-[#0e7bf4]/20'
          : 'border-[#d5deea] bg-white text-[#082046] hover:border-[#0e7bf4] shadow-sm font-semibold'
      }`}
    >
      <div className="flex items-center gap-1.5 font-mono">
        <Clock className="h-3 w-3 text-[#0e7bf4]" />
        <span>{slot.time.split('–')[0].trim()}</span>
      </div>

      <div className="flex items-center gap-1 text-[10px]">
        {slot.remainingCapacity === 1 ? (
          <span className="font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-md">
            1 slot left
          </span>
        ) : (
          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
            {slot.remainingCapacity} slots
          </span>
        )}
        {isSelected && <Check className="h-3.5 w-3.5 text-[#0e7bf4]" />}
      </div>
    </button>
  );
}
