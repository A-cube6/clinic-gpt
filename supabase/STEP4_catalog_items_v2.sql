-- STEP 4: Catalog v2 (MRP/Discount/Purchase/Stock/Photo) + updated checkout pricing
-- Run in Supabase SQL Editor AFTER STEP 3.
--
-- Adds new columns to public.catalog_items:
--   mrp_inr, discount_inr, purchase_price_inr, stock, photo_url, sell_price_inr (generated)
-- Updates RPC public.create_shop_order to:
--   - price items using sell_price_inr (MRP - discount)
--   - enforce stock
--   - decrement stock atomically

-- 1) Extend catalog_items
alter table public.catalog_items
  add column if not exists mrp_inr int not null default 0,
  add column if not exists discount_inr int not null default 0,
  add column if not exists purchase_price_inr int not null default 0,
  add column if not exists stock int not null default 0,
  add column if not exists photo_url text;

-- Add generated sell_price_inr only if missing
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='catalog_items' and column_name='sell_price_inr'
  ) then
    alter table public.catalog_items
      add column sell_price_inr int generated always as (greatest(mrp_inr - discount_inr, 0)) stored;
  end if;
end $$;

-- 2) Backfill from old price_inr (if you previously used it)
--    - If mrp/purchase are still 0, copy from price_inr
--    - Give existing active items a default stock of 100 (you can edit later in Owner → Catalog)
update public.catalog_items
set
  mrp_inr = case when mrp_inr = 0 and coalesce(price_inr, 0) > 0 then price_inr else mrp_inr end,
  purchase_price_inr = case when purchase_price_inr = 0 and coalesce(price_inr, 0) > 0 then price_inr else purchase_price_inr end,
  discount_inr = coalesce(discount_inr, 0),
  stock = case when stock = 0 and active = true then 100 else stock end
where true;

-- 3) Update secure checkout RPC to use sell_price_inr + enforce/decrement stock
create or replace function public.create_shop_order(items jsonb, customer jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_order_id uuid;
  v_subtotal int;
  v_shipping int;
  v_total int;
  v_cart_cnt int;
  v_upd_cnt int;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'auth_required';
  end if;

  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'cart_empty';
  end if;

  -- Atomically validate stock + decrement stock
  with raw as (
    select
      (x.item_id)::uuid as item_id,
      greatest(1, least(99, (x.qty)::int)) as qty
    from jsonb_to_recordset(items) as x(item_id text, qty text)
  ),
  cart as (
    select item_id, sum(qty)::int as qty
    from raw
    group by item_id
  ),
  updated as (
    update public.catalog_items ci
    set stock = ci.stock - cart.qty
    from cart
    where ci.id = cart.item_id
      and ci.active = true
      and ci.stock >= cart.qty
    returning ci.id as item_id, cart.qty, ci.sell_price_inr
  )
  select
    (select count(*) from cart),
    (select count(*) from updated),
    (select coalesce(sum(sell_price_inr * qty), 0) from updated)
  into v_cart_cnt, v_upd_cnt, v_subtotal;

  if v_cart_cnt <> v_upd_cnt then
    raise exception 'out_of_stock_or_inactive_items';
  end if;

  if v_subtotal <= 0 then
    raise exception 'invalid_cart_or_zero_priced_items';
  end if;

  v_shipping := case when v_subtotal > 499 then 0 else 49 end;
  v_total := v_subtotal + v_shipping;

  insert into public.orders (
    user_id,
    status,
    subtotal_inr,
    shipping_inr,
    total_inr,
    customer_name,
    customer_phone,
    address1,
    city,
    pin_code,
    currency
  )
  values (
    v_uid,
    'created',
    v_subtotal,
    v_shipping,
    v_total,
    nullif(trim(customer->>'full_name'), ''),
    nullif(trim(customer->>'phone'), ''),
    nullif(trim(customer->>'address1'), ''),
    nullif(trim(customer->>'city'), ''),
    nullif(trim(customer->>'pin_code'), ''),
    'INR'
  )
  returning id into v_order_id;

  -- Insert line items at the (current) sell_price_inr
  with raw as (
    select
      (x.item_id)::uuid as item_id,
      greatest(1, least(99, (x.qty)::int)) as qty
    from jsonb_to_recordset(items) as x(item_id text, qty text)
  ),
  cart as (
    select item_id, sum(qty)::int as qty
    from raw
    group by item_id
  )
  insert into public.order_items (
    order_id,
    product_id,
    title,
    qty,
    price_inr,
    catalog_item_id
  )
  select
    v_order_id,
    ci.id::text,
    ci.title,
    cart.qty,
    ci.sell_price_inr,
    ci.id
  from cart
  join public.catalog_items ci on ci.id = cart.item_id
  where ci.active = true;

  return v_order_id;
end;
$$;

grant execute on function public.create_shop_order(jsonb, jsonb) to authenticated;
