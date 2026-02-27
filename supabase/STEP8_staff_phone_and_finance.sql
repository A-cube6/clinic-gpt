-- STEP8: Add phone to staff_profiles + create clinic finance table for Assets/Liabilities

-- 1) Staff phone column
alter table if exists public.staff_profiles
  add column if not exists phone text;

-- 2) Helper function (owner check) - create if missing
create or replace function public.is_owner()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.id = auth.uid() and sp.role = 'owner'
  );
$$;

-- 3) Clinic assets/liabilities
create table if not exists public.clinic_finance_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('asset','liability')),
  title text not null,
  amount_inr numeric not null default 0,
  note text null,
  created_at timestamptz not null default now()
);

alter table public.clinic_finance_items enable row level security;

-- Read/write restricted to owner
drop policy if exists "clinic_finance_owner_read" on public.clinic_finance_items;
create policy "clinic_finance_owner_read"
  on public.clinic_finance_items
  for select
  using (public.is_owner());

drop policy if exists "clinic_finance_owner_write" on public.clinic_finance_items;
create policy "clinic_finance_owner_write"
  on public.clinic_finance_items
  for all
  using (public.is_owner())
  with check (public.is_owner());

-- Optional index for faster sorting
create index if not exists clinic_finance_items_created_at_idx
  on public.clinic_finance_items (created_at desc);
