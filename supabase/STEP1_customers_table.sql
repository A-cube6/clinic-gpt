-- STEP 1: Customers table (stores customer directory; later, customer signup can auto-populate this)

create extension if not exists "uuid-ossp";

create table if not exists public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;

-- Helper: owner check (expects public.staff_profiles with role)
create or replace function public.is_owner(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.staff_profiles sp
    where sp.id = uid and sp.role = 'owner'
  );
$$;

-- Owner can manage all customers
drop policy if exists "customers_owner_all" on public.customers;
create policy "customers_owner_all" on public.customers
for all
using (public.is_owner(auth.uid()))
with check (public.is_owner(auth.uid()));

-- A user can read their own customer row (useful later)
drop policy if exists "customers_select_own" on public.customers;
create policy "customers_select_own" on public.customers
for select
using (auth.uid() = id);
