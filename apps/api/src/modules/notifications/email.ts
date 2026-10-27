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
  unsubscribeUrl?: string,
  fromOverride?: string,
): Promise<string> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
  };
  const bodyPayload: Record<string, any> = {
    from: fromOverride ?? process.env.EMAIL_FROM ?? 'ApplyFields <no-reply@applyfields.in>',
    to: [to],
    subject: email.subject,
    html: email.html,
    text: email.text,
  };
  if (unsubscribeUrl) {
    bodyPayload.headers = {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyPayload),
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!res.ok || !json?.id) throw new Error(`Resend ${res.status}: ${json?.message ?? 'no message id'}`);
  return json.id;
}

/**
 * Sends one-time password (OTP) verification email via Resend with dynamic sender routing
 * based on the purpose:
 * - verify_email / login / reset_password -> support@applyfields.com
 * - query / help -> help@applyfields.com
 * - services -> services@applyfields.com
 */
export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: string,
): Promise<string | null> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;

  let fromAddress = process.env.EMAIL_SUPPORT_FROM ?? 'ApplyFields Support <support@applyfields.com>';
  let purposeTitle = 'Verification Code';

  if (purpose === 'verify_email') {
    purposeTitle = 'Email Verification';
    fromAddress = process.env.EMAIL_SUPPORT_FROM ?? 'ApplyFields Support <support@applyfields.com>';
  } else if (purpose === 'login') {
    purposeTitle = 'Sign-in Verification';
    fromAddress = process.env.EMAIL_SUPPORT_FROM ?? 'ApplyFields Support <support@applyfields.com>';
  } else if (purpose === 'reset_password') {
    purposeTitle = 'Password Reset';
    fromAddress = process.env.EMAIL_SUPPORT_FROM ?? 'ApplyFields Support <support@applyfields.com>';
  } else if (purpose === 'query' || purpose === 'help') {
    purposeTitle = 'Support Query Update';
    fromAddress = process.env.EMAIL_HELP_FROM ?? 'ApplyFields Help Desk <help@applyfields.com>';
  } else if (purpose === 'service_order' || purpose === 'services') {
    purposeTitle = 'Service Order Verification';
    fromAddress = process.env.EMAIL_SERVICES_FROM ?? 'ApplyFields Services <services@applyfields.com>';
  }

  const subject = `${otp} is your ${purposeTitle} - ApplyFields`;
  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:24px;background:#F0F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#082046">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;border:1px solid #d3ddeb;padding:32px;box-shadow:0 10px 25px rgba(8,32,70,0.06)">
    <div style="margin-bottom:24px;display:flex;align-items:center;gap:8px">
      <h2 style="margin:0;font-size:22px;font-weight:900;color:#082046">Apply<span style="color:#0e7bf4">Fields</span></h2>
    </div>
    <h1 style="font-size:20px;font-weight:700;margin:0 0 12px;color:#082046">${purposeTitle}</h1>
    <p style="font-size:15px;line-height:1.6;color:#435775;margin:0 0 24px">
      Use the following 6-digit one-time code to complete your request. This code will expire in <strong>10 minutes</strong>.
    </p>
    <div style="background:#f0f5fc;border:2px dashed #0e7bf4;border-radius:14px;padding:20px;text-align:center;margin:0 0 24px">
      <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#0e7bf4;font-family:monospace">${otp}</span>
    </div>
    <p style="font-size:13px;line-height:1.5;color:#6b829e;margin:0 0 16px">
      If you did not request this verification code, please ignore this email or reach out to <a href="mailto:support@applyfields.com" style="color:#0e7bf4">support@applyfields.com</a> if you have security concerns.
    </p>
    <hr style="border:none;border-top:1px solid #e3eaf3;margin:24px 0" />
    <p style="font-size:11px;color:#8ba0b8;margin:0;text-align:center">
      ApplyFields · Secure Citizen Opportunities & Services Portal<br/>
      Sent from ${fromAddress}
    </p>
  </div>
</body>
</html>`;

  const text = `${purposeTitle}: ${otp}\n\nYour 6-digit ApplyFields verification code is: ${otp}\nValid for 10 minutes.\n\nSent from ${fromAddress}`;

  return await sendWithResend(
    to,
    { subject, html, text },
    `otp-${to}-${purpose}-${Date.now()}`,
    undefined,
    fromAddress,
  );
}
