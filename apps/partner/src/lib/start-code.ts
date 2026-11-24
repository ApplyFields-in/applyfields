/**
 * Start code in the booking chat: the citizen often just types the 4 digits from their app.
 * The newest citizen message with a lone 4-digit number fills the chat's start-code box; the
 * server still decides whether it matches.
 * Same rule as apps/partner-mobile/src/lib/start-code.ts (checked by start-code.check.ts there) — keep in sync.
 */
export function codeFromChat(messages: { senderType: string; text: string }[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.senderType !== 'citizen') continue;
    // Digits may be spaced ("4 8 2 1"); a 4-digit run inside a longer number (phone, PIN code) is not a code.
    const hit = m.text.replace(/(\d)[ -](?=\d)/g, '$1').match(/(?<!\d)\d{4}(?!\d)/);
    if (hit) return hit[0];
  }
  return null;
}

/** Booking statuses that still need the citizen's code before work can start. */
export const NEEDS_START = new Set(['new', 'accepted']);
