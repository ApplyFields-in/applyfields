import { createHmac, timingSafeEqual } from 'node:crypto';
import { jwtAccessSecret } from '../../common/jwt-secret.js';

/**
 * Rapido-style start code for a citizen's booking: 4 digits the citizen sees in their app and reads
 * out (or sends in the booking chat) when they reach the centre. The centre can only start the job
 * by entering it, which proves the citizen was there. No SMS and no extra table: the code is an
 * HMAC of the booking id with a server secret, so it is stable, per booking, and not guessable.
 * Wrong guesses are capped per booking (see BookingsService.updatePartnerBooking).
 */
const secret = () => process.env.START_CODE_SECRET || jwtAccessSecret();

export function startCode(bookingId: string): string {
  const mac = createHmac('sha256', secret()).update(`booking-start:${bookingId}`).digest();
  return String(mac.readUInt32BE(0) % 10_000).padStart(4, '0');
}

export function startCodeMatches(bookingId: string, entered: string): boolean {
  const a = Buffer.from(startCode(bookingId));
  const b = Buffer.from(entered.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Wrong codes allowed per booking in START_CODE_WINDOW_MS before the desk must wait. */
export const START_CODE_MAX_WRONG = 5;
export const START_CODE_WINDOW_MS = 15 * 60_000;
/** Marks a wrong-code row in service_request_events (counted for the cap, kept for the audit trail). */
export const WRONG_START_CODE_NOTE = 'Wrong start code entered';
