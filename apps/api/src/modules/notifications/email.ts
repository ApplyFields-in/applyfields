const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/** The one email layout: title, body, a button to the item, and the unsubscribe footer. */
export function renderEmail(n: {
  title: string;
  body: string | null;
  url: string | null;
  unsubscribeUrl: string;
  preferencesUrl: string;
}): EmailContent {
  const button = n.url
    ? `<p style="margin:24px 0"><a href="${esc(n.url)}" style="background:#0f4c5c;color:#fdfbf3;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Open on ApplyFields</a></p>`
    : '';
  const html = `<!doctype html><html><body style="margin:0;background:#f4f1e6;font-family:Arial,sans-serif;color:#0f4c5c">
<div style="max-width:560px;margin:0 auto;padding:24px">
<p style="font-weight:700;font-size:18px;margin:0 0 16px">ApplyFields</p>
<div style="background:#fdfbf3;border-radius:16px;padding:24px">
<h1 style="font-size:20px;margin:0 0 12px">${esc(n.title)}</h1>
${n.body ? `<p style="line-height:1.5;margin:0">${esc(n.body)}</p>` : ''}
${button}
<p style="font-size:13px;margin:16px 0 0">Always apply on the official website. ApplyFields is a guide, not a government body.</p>
</div>
<p style="font-size:12px;margin:16px 0 0">You get this because you saved this item on ApplyFields.
<a href="${esc(n.preferencesUrl)}" style="color:#0f4c5c">Choose what you get</a> ·
<a href="${esc(n.unsubscribeUrl)}" style="color:#0f4c5c">Unsubscribe from emails</a></p>
</div></body></html>`;
  const text = [
    n.title,
    n.body ?? '',
    n.url ? `Open: ${n.url}` : '',
    'Always apply on the official website.',
    `Choose what you get: ${n.preferencesUrl}`,
    `Unsubscribe: ${n.unsubscribeUrl}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  return { subject: n.title, html, text };
}

/**
 * Sends one email with Resend's HTTP API (no SDK needed). The delivery id is the idempotency key,
 * so a retry after a crash between "sent" and "marked sent" doesn't email twice.
 */
export async function sendWithResend(
  to: string,
  email: EmailContent,
  idempotencyKey: string,
  unsubscribeUrl: string,
): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'ApplyFields <no-reply@applyfields.in>',
      to: [to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!res.ok || !json?.id) throw new Error(`Resend ${res.status}: ${json?.message ?? 'no message id'}`);
  return json.id;
}
