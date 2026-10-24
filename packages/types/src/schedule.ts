import { z } from 'zod';

// ============================================================================
// PARTNER SCHEDULE & SLOT RESERVATION ENGINE (Session 18)
// ============================================================================

export const dayScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sun, 1 = Mon ... 6 = Sat
  dayName: z.string().optional(),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm (e.g. 09:00)'),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm (e.g. 20:00)'),
  hasBreak: z.boolean().default(false),
  breakStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm')
    .nullish(),
  breakEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm')
    .nullish(),
});

export type DaySchedule = z.infer<typeof dayScheduleSchema>;

export const holidayOverrideSchema = z.object({
  id: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  reason: z.string().trim().max(250).nullish(),
  isClosed: z.boolean().default(true),
});

export type HolidayOverride = z.infer<typeof holidayOverrideSchema>;

export const updatePartnerScheduleSchema = z.object({
  schedule: z.array(dayScheduleSchema),
  slotDuration: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]).default(30),
  maxConcurrent: z.number().int().min(1).max(10).default(2),
  isEmergencyPaused: z.boolean().optional(),
  holidayOverrides: z.array(holidayOverrideSchema).optional(),
});

export type UpdatePartnerScheduleInput = z.infer<typeof updatePartnerScheduleSchema>;

export const createSlotOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  reason: z.string().trim().max(250).optional(),
  isClosed: z.boolean().default(true),
});

export type CreateSlotOverrideInput = z.infer<typeof createSlotOverrideSchema>;

export const timeSlotPeriodSchema = z.enum(['morning', 'afternoon', 'evening']);
export type TimeSlotPeriod = z.infer<typeof timeSlotPeriodSchema>;

export const timeSlotSchema = z.object({
  id: z.string(),
  time: z.string(), // e.g. "09:00 AM – 09:30 AM"
  startTime: z.string(), // "09:00"
  endTime: z.string(), // "09:30"
  period: timeSlotPeriodSchema,
  remainingCapacity: z.number().int().min(0),
  totalCapacity: z.number().int().min(1),
  isAvailable: z.boolean(),
});

export type TimeSlot = z.infer<typeof timeSlotSchema>;

export const availableSlotsResponseSchema = z.object({
  partnerId: z.string(),
  date: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  isClosed: z.boolean(),
  closedReason: z.string().nullable().optional(),
  totalSlots: z.number(),
  availableSlotsCount: z.number(),
  slots: z.array(timeSlotSchema),
});

export type AvailableSlotsResponse = z.infer<typeof availableSlotsResponseSchema>;

export interface PartnerScheduleMatrix {
  partnerId: string;
  schedule: DaySchedule[];
  slotDuration: number;
  maxConcurrent: number;
  isEmergencyPaused: boolean;
  holidayOverrides: HolidayOverride[];
  updatedAt?: string;
}
