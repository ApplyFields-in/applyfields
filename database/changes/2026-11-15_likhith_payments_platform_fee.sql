-- Why: Razorpay payments (session 14, module 3).
-- 1. A booking paid online is one Razorpay order = the centre's charge + ApplyFields' convenience fee.
--    platform_fee_paise is ApplyFields' part, so partner payouts = amount - platform fee - refunds.
-- 2. The optional ₹50/month ApplyFields Plus plan. The matching Razorpay plan id lives in the API env
--    (RAZORPAY_PLUS_PLAN_ID), because it differs between Razorpay test and live mode.
-- Safe to re-run.

alter table payments add column if not exists platform_fee_paise integer not null default 0
  check (platform_fee_paise >= 0);
comment on column payments.platform_fee_paise is 'ApplyFields convenience fee inside amount_paise (the rest belongs to the centre).';

insert into subscription_plans (code, audience, name, price_paise, billing_period, benefits)
values (
  'user_plus_monthly', 'user', 'ApplyFields Plus', 5000, 'monthly',
  '["Unlimited AI chats", "Remind me when applications open"]'::jsonb
)
on conflict (code) do nothing;
