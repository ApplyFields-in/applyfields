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
            <h3 className="text-sm font-black text-[#082046]">Reserved 30-Min Time Windows</h3>
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

        {/* Morning Slots */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#526987]">
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
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#526987]">
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
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#526987]">
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
