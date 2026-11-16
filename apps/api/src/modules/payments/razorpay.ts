import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Tiny Razorpay REST client (orders, subscriptions, refunds) + signature checks.
 * No SDK: four endpoints and an HMAC don't justify a dependency.
 * Keys: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (test keys start with rzp_test_), RAZORPAY_WEBHOOK_SECRET.
 */
export interface RazorpayKeys {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

export function razorpayKeys(): RazorpayKeys | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? '' };
}

const hmac = (secret: string, data: string | Buffer) => createHmac('sha256', secret).update(data).digest('hex');

/** Constant-time compare of two hex signatures. */
export function sameSignature(expected: string, given: string | undefined): boolean {
  if (!given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checkout handler signature: order → `order_id|payment_id`, subscription → `payment_id|subscription_id`. */
export function checkoutSignature(keySecret: string, first: string, second: string): string {
  return hmac(keySecret, `${first}|${second}`);
}

export function webhookSignature(webhookSecret: string, rawBody: Buffer): string {
  return hmac(webhookSecret, rawBody);
}

export class RazorpayError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function razorpay<T>(keys: RazorpayKeys, method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keys.keyId}:${keys.keySecret}`).toString('base64')}`,
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: { description?: string } };
  if (!res.ok) throw new RazorpayError(res.status, json.error?.description ?? `Razorpay ${res.status}`);
  return json as T;
}

export interface RzpOrder {
  id: string;
  amount: number;
  status: string;
}
export interface RzpSubscription {
  id: string;
  status: string;
  current_start: number | null;
  current_end: number | null;
  notes?: Record<string, string>;
}
export interface RzpPayment {
  id: string;
  order_id: string | null;
  amount: number;
  amount_refunded?: number;
  status: string;
  error_description?: string | null;
}
export interface RzpRefund {
  id: string;
  payment_id: string;
  amount: number;
}
