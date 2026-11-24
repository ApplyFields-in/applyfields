/**
 * Where a notification opens in the partner app (push tap and the Alerts list). Links are the
 * website URLs the notification engine stores. null = no matching screen.
 */
export function notificationRoute(
  link: string | null | undefined,
): { pathname: '/chat/[id]' | '/booking/[id]'; params: { id: string } } | null {
  if (!link) return null;
  // A citizen wrote in a booking chat (partner inbox link: /messages?booking=<id>).
  const chat = link.match(/\/messages\?(?:.*&)?booking=([0-9a-f-]{36})/i);
  if (chat) return { pathname: '/chat/[id]', params: { id: chat[1] } };
  // Booking updates link the booking on the service site: /bookings/<id>.
  const booking = link.match(/\/bookings\/([0-9a-f-]{36})/i);
  if (booking) return { pathname: '/booking/[id]', params: { id: booking[1] } };
  return null;
}
