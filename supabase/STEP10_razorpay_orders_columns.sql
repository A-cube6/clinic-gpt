-- STEP10: Razorpay integration columns on orders
-- Safe to run multiple times.

alter table public.orders
  add column if not exists provider text,
  add column if not exists provider_order_id text,
  add column if not exists provider_payment_id text,
  add column if not exists provider_signature text;
