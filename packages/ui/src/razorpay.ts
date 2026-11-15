/**
 * Razorpay Checkout (https://checkout.razorpay.com/v1/checkout.js), loaded on first use.
 * Pass either an order (one-time payment) or a subscription (ApplyFields Plus). Resolves with the ids + signature
 * to POST to /payments/verify, or null if the person closed the window.
 */
export interface RazorpayResult {
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
}

export interface RazorpayOptions {
  key_id: string;
  order_id?: string;
  subscription_id?: string;
  amount_paise?: number;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
}

type RazorpayCtor = new (opts: Record<string, unknown>) => { open(): void; on(evt: string, cb: () => void): void };

let loading: Promise<RazorpayCtor> | null = null;
function loadCheckout(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error('Razorpay did not load')));
    s.onerror = () => {
      loading = null;
      reject(new Error('Could not load Razorpay. Check your connection.'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export async function openRazorpayCheckout(o: RazorpayOptions): Promise<RazorpayResult | null> {
  const Razorpay = await loadCheckout();
  return new Promise((resolve) => {
    const rzp = new Razorpay({
      key: o.key_id,
      ...(o.order_id && { order_id: o.order_id, amount: o.amount_paise, currency: 'INR' }),
      ...(o.subscription_id && { subscription_id: o.subscription_id }),
      name: 'ApplyFields',
      description: o.description,
      prefill: o.prefill,
      theme: { color: '#00876a' },
      handler: (r: RazorpayResult) => resolve(r),
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.open();
  });
}
