/**
 * OTP SMS through MSG91's OTP API (we generate the code; MSG91 only delivers it).
 * Returns false when MSG91 is not configured — callers fall back to the dev console print.
 * Needs DLT approval first: see APPLYGIELDS/requirements/02_sms_otp.md.
 */
export async function sendOtpSms(phone: string, otp: string): Promise<boolean> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  if (!authKey || !templateId) return false;

  // MSG91 wants country code + number, digits only. Bare 10-digit numbers are Indian.
  const digits = phone.replace(/\D/g, '');
  const mobile = digits.length === 10 ? `91${digits}` : digits;

  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.searchParams.set('template_id', templateId);
  url.searchParams.set('mobile', mobile);
  url.searchParams.set('otp', otp);
  url.searchParams.set('otp_expiry', '10');

  const res = await fetch(url, { method: 'POST', headers: { authkey: authKey } });
  if (!res.ok) throw new Error(`MSG91 responded ${res.status}`);
  return true;
}
