'use client';

import React, { useState } from 'react';
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

const SAMPLE_SLOTS: TimeSlot[] = [
  // Morning (9:00 - 12:00)
  { id: 'slot-m1', time: '09:00 AM – 09:30 AM', startTime: '09:00', endTime: '09:30', period: 'morning', remainingCapacity: 2, totalCapacity: 3, isAvailable: true },
  { id: 'slot-m2', time: '09:30 AM – 10:00 AM', startTime: '09:30', endTime: '10:00', period: 'morning', remainingCapacity: 1, totalCapacity: 3, isAvailable: true },
  { id: 'slot-m3', time: '10:00 AM – 10:30 AM', startTime: '10:00', endTime: '10:30', period: 'morning', remainingCapacity: 3, totalCapacity: 3, isAvailable: true },
  { id: 'slot-m4', time: '10:30 AM – 11:00 AM', startTime: '10:30', endTime: '11:00', period: 'morning', remainingCapacity: 0, totalCapacity: 3, isAvailable: false },
  { id: 'slot-m5', time: '11:00 AM – 11:30 AM', startTime: '11:00', endTime: '11:30', period: 'morning', remainingCapacity: 2, totalCapacity: 3, isAvailable: true },
  { id: 'slot-m6', time: '11:30 AM – 12:00 PM', startTime: '11:30', endTime: '12:00', period: 'morning', remainingCapacity: 1, totalCapacity: 3, isAvailable: true },

  // Afternoon (12:00 - 16:00)
  { id: 'slot-a1', time: '01:30 PM – 02:00 PM', startTime: '13:30', endTime: '14:00', period: 'afternoon', remainingCapacity: 2, totalCapacity: 3, isAvailable: true },
  { id: 'slot-a2', time: '02:00 PM – 02:30 PM', startTime: '14:00', endTime: '14:30', period: 'afternoon', remainingCapacity: 3, totalCapacity: 3, isAvailable: true },
  { id: 'slot-a3', time: '02:30 PM – 03:00 PM', startTime: '14:30', endTime: '15:00', period: 'afternoon', remainingCapacity: 1, totalCapacity: 3, isAvailable: true },
  { id: 'slot-a4', time: '03:00 PM – 03:30 PM', startTime: '15:00', endTime: '15:30', period: 'afternoon', remainingCapacity: 0, totalCapacity: 3, isAvailable: false },
  { id: 'slot-a5', time: '03:30 PM – 04:00 PM', startTime: '15:30', endTime: '16:00', period: 'afternoon', remainingCapacity: 2, totalCapacity: 3, isAvailable: true },

  // Evening (16:00 - 20:00)
  { id: 'slot-e1', time: '04:30 PM – 05:00 PM', startTime: '16:30', endTime: '17:00', period: 'evening', remainingCapacity: 1, totalCapacity: 3, isAvailable: true },
  { id: 'slot-e2', time: '05:00 PM – 05:30 PM', startTime: '17:00', endTime: '17:30', period: 'evening', remainingCapacity: 3, totalCapacity: 3, isAvailable: true },
  { id: 'slot-e3', time: '05:30 PM – 06:00 PM', startTime: '17:30', endTime: '18:00', period: 'evening', remainingCapacity: 2, totalCapacity: 3, isAvailable: true },
  { id: 'slot-e4', time: '06:00 PM – 06:30 PM', startTime: '18:00', endTime: '18:30', period: 'evening', remainingCapacity: 0, totalCapacity: 3, isAvailable: false },
  { id: 'slot-e5', time: '06:30 PM – 07:00 PM', startTime: '18:30', endTime: '19:00', period: 'evening', remainingCapacity: 2, totalCapacity: 3, isAvailable: true },
];

export function SlotPicker({
  selectedDate,
  selectedSlotId,
  onSelectDate,
  onSelectSlot,
  partnerName = 'Partner Center',
}: SlotPickerProps) {
  const days = generateUpcomingDays();

  const morningSlots = SAMPLE_SLOTS.filter((s) => s.period === 'morning');
  const afternoonSlots = SAMPLE_SLOTS.filter((s) => s.period === 'afternoon');
  const eveningSlots = SAMPLE_SLOTS.filter((s) => s.period === 'evening');

  return (
    <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      {/* Date Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Select Appointment Date</h3>
          </div>
          <span className="text-[11px] text-slate-400">Operating: Mon – Sat (09:00 – 19:30)</span>
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
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-md ring-1 ring-cyan-400/30'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{day.dayName}</span>
                <span className="text-base font-extrabold text-white my-0.5">{day.dayNumber}</span>
                <span className="text-[10px] text-slate-500">{day.monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots Section */}
      <div className="space-y-5 border-t border-slate-800/80 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Reserved 30-Min Time Windows</h3>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Available
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Fast Filling
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-600" /> Booked Out
            </span>
          </div>
        </div>

        {/* Morning Slots */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Morning (09:00 AM – 12:00 PM)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {morningSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isSelected={selectedSlotId === slot.id}
                onSelect={() => onSelectSlot(slot)}
              />
            ))}
          </div>
        </div>

        {/* Afternoon Slots */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Afternoon (12:00 PM – 04:00 PM)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {afternoonSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isSelected={selectedSlotId === slot.id}
                onSelect={() => onSelectSlot(slot)}
              />
            ))}
          </div>
        </div>

        {/* Evening Slots */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Evening (04:00 PM – 07:30 PM)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {eveningSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isSelected={selectedSlotId === slot.id}
                onSelect={() => onSelectSlot(slot)}
              />
            ))}
          </div>
        </div>
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
  const isFastFilling = slot.remainingCapacity === 1;

  if (!slot.isAvailable) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800/60 bg-slate-950/20 text-slate-600 cursor-not-allowed">
        <span className="text-xs font-medium line-through">{slot.time}</span>
        <span className="text-[10px] text-slate-600 font-semibold">Booked</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
        isSelected
          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-400/40 shadow-sm'
          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
      }`}
    >
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-white">{slot.time}</span>
        <span
          className={`text-[10px] font-medium ${
            isFastFilling ? 'text-amber-400' : 'text-emerald-400'
          }`}
        >
          {isFastFilling ? '1 slot remaining!' : `${slot.remainingCapacity} slots open`}
        </span>
      </div>

      {isSelected && (
        <span className="h-5 w-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0">
          <Check className="h-3 w-3 stroke-[3]" />
        </span>
      )}
    </button>
  );
}
