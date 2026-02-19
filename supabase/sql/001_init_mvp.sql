-- Run this in Supabase SQL Editor.
-- Creates minimal tables for: staff roles, leads/bookings, orders, billing/expenses foundation.

create extension if not exists "uuid-ossp";

-- Profiles: 1 row per auth user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer', -- owner | reception | customer
  full_name text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Leads (booking requests / messages)
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text,
  service text,
  message text,
  status text not null default 'new' -- new | contacted | booked | closed
);

-- Bookings
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  patient_name text not null,
  patient_phone text,
  service text,
  doctor text,
  start_time timestamptz,
  end_time timestamptz,
  status text not null default 'scheduled' -- scheduled | completed | cancelled
);

-- Orders (merch)
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id),
  status text not null default 'created', -- created | paid | cancelled | fulfilled
  subtotal_inr int not null default 0,
  shipping_inr int not null default 0,
  total_inr int not null default 0
);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  title text not null,
  qty int not null default 1,
  price_inr int not null default 0
);

-- Billing records (clinic services)
create table if not exists public.billing_entries (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  booking_id uuid references public.bookings(id),
  amount_inr int not null default 0,
  payment_mode text, -- cash | upi | card
  notes text
);

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  category text not null, -- materials | doctor_payment | staff_salary | other
  amount_inr int not null default 0,
  notes text
);

-- RLS
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.bookings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.billing_entries enable row level security;
alter table public.expenses enable row level security;

-- Helper: is staff?
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role in ('owner','reception')
  );
$$;

-- Policies
-- Profiles: user can read/update own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id);

-- Staff can read/write operational tables
drop policy if exists "staff_leads_all" on public.leads;
create policy "staff_leads_all" on public.leads
for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "staff_bookings_all" on public.bookings;
create policy "staff_bookings_all" on public.bookings
for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "staff_billing_all" on public.billing_entries;
create policy "staff_billing_all" on public.billing_entries
for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "staff_expenses_all" on public.expenses;
create policy "staff_expenses_all" on public.expenses
for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Orders: customer can see own orders; staff can see all
drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
for select using (auth.uid() = user_id or public.is_staff(auth.uid()));

drop policy if exists "orders_insert" on public.orders;
create policy "orders_insert" on public.orders
for insert with check (auth.uid() = user_id or public.is_staff(auth.uid()));

drop policy if exists "orders_update_staff" on public.orders;
create policy "orders_update_staff" on public.orders
for update using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
for select using (
  exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff(auth.uid())))
);

drop policy if exists "order_items_insert" on public.order_items;
create policy "order_items_insert" on public.order_items
for insert with check (
  exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff(auth.uid())))
);
