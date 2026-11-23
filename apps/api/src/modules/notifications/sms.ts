/**
 * OTP SMS through MSG91's OTP API (we generate the code; MSG91 only delivers it).
 * Returns false when MSG91 is not configured — callers fall back to the dev console print.
 * Needs DLT approval first: see APPLYGIELDS/requirements/02_sms_otp.md.
 */
/** False until MSG91 is set up: in production phone codes can't be delivered, so phone-only flows must say so. */
export const smsAvailable = () => Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_OTP_TEMPLATE_ID);

/** Production without SMS: a phone code would never arrive, so refuse up front instead of saying "sent". */
export const phoneCodesUnavailable = () => process.env.NODE_ENV === 'production' && !smsAvailable();

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
