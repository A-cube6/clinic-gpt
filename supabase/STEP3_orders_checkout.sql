-- STEP 3: Orders + secure checkout (DB-priced) for Shop
-- Run in Supabase SQL Editor.
--
-- What this does:
-- 1) Ensures helper function public.is_staff(uid) matches your staff_profiles roles.
-- 2) Ensures orders + order_items tables have the extra columns needed for checkout.
-- 3) Adds a DB function (RPC) public.create_shop_order(items jsonb, customer jsonb)
--    that computes totals from catalog_items (no trusting client totals).

create extension if not exists "uuid-ossp";

-- Staff helper (aligned with your current staff_profiles approach)
create or replace function public.is_owner(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.id = uid
      and sp.role = 'owner'
  );
$$;

create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.id = uid
      and sp.role in ('owner','reception')
  );
$$;

-- Ensure catalog_items has the columns your app uses (Owner dashboard + Homepage shop)
alter table public.catalog_items
  add column if not exists title text,
  add column if not exists note text,
  add column if not exists price_inr int not null default 0,
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

-- RLS for catalog_items (owner manage; public read active)
alter table public.catalog_items enable row level security;

drop policy if exists "catalog_owner_all" on public.catalog_items;
create policy "catalog_owner_all" on public.catalog_items
for all
using (public.is_owner(auth.uid()))
with check (public.is_owner(auth.uid()));

drop policy if exists "catalog_public_select_active" on public.catalog_items;
create policy "catalog_public_select_active" on public.catalog_items
for select
using (active = true);

-- If an older schema exists (sku/name), try to backfill title from name
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='catalog_items' and column_name='name'
  ) then
    update public.catalog_items
      set title = coalesce(title, public.catalog_items.name)
      where title is null;
  end if;
end $$;

-- Orders table (created by earlier MVP script; we extend it safely)
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id),
  status text not null default 'created',
  subtotal_inr int not null default 0,
  shipping_inr int not null default 0,
  total_inr int not null default 0
);

alter table public.orders
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists address1 text,
  add column if not exists city text,
  add column if not exists pin_code text,
  add column if not exists currency text not null default 'INR',
  add column if not exists payment_provider text,
  add column if not exists provider_order_id text,
  add column if not exists provider_payment_id text,
  add column if not exists provider_signature text;

-- Order items table (extend safely)
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  title text not null,
  qty int not null default 1,
  price_inr int not null default 0
);

alter table public.order_items
  add column if not exists catalog_item_id uuid references public.catalog_items(id);

-- RLS
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Orders policies: customer can see own; staff can see all; staff can update
drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
for select
using (auth.uid() = user_id or public.is_staff(auth.uid()));

drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert" on public.orders
for insert
with check (auth.uid() = user_id or public.is_staff(auth.uid()));

drop policy if exists "orders_update_staff" on public.orders;
create policy "orders_update_staff" on public.orders
for update
using (public.is_staff(auth.uid()))
with check (public.is_staff(auth.uid()));

-- Order items policies
drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
for select
using (
  exists(
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.is_staff(auth.uid()))
  )
);

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items
for insert
with check (
  exists(
    select 1 from public.orders o
    where o.id = order_id
      and (o.user_id = auth.uid() or public.is_staff(auth.uid()))
  )
);

-- Secure checkout RPC: create order from cart items (catalog-priced)
-- items: JSON array of { item_id: <catalog_items.id>, qty: <int> }
-- customer: JSON object { full_name, phone, address1, city, pin_code }
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
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'auth_required';
  end if;

  -- Validate items
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'cart_empty';
  end if;

  with cart as (
    select
      (x.item_id)::uuid as item_id,
      greatest(1, least(99, (x.qty)::int)) as qty
    from jsonb_to_recordset(items) as x(item_id text, qty text)
  ), priced as (
    select
      c.item_id,
      c.qty,
      ci.title,
      ci.price_inr
    from cart c
    join public.catalog_items ci on ci.id = c.item_id
    where ci.active = true
  )
  select coalesce(sum(price_inr * qty), 0)
    into v_subtotal
  from priced;

  if v_subtotal <= 0 then
    raise exception 'invalid_cart_or_inactive_items';
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
    greatest(1, least(99, (x.qty)::int)) as qty,
    ci.price_inr,
    ci.id
  from jsonb_to_recordset(items) as x(item_id text, qty text)
  join public.catalog_items ci on ci.id = (x.item_id)::uuid
  where ci.active = true;

  return v_order_id;
end;
$$;

grant execute on function public.create_shop_order(jsonb, jsonb) to authenticated;
