-- STEP: Doctors table (Owner-managed, public read for homepage)
-- Run in Supabase SQL Editor.
-- Assumes you already have: public.is_owner(uuid) function (used in your existing owner dashboard policies).

create table if not exists public.doctors (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  full_name text not null,
  phone text,
  qualifications text,
  start_date date,
  end_date date,
  active boolean not null default true
);

alter table public.doctors enable row level security;

-- PUBLIC (anon) read: only active doctors within date range (if provided)
-- Note: if you prefer *authenticated only* for the homepage, change `using ( ... )` to `using (auth.uid() is not null and ... )`.
drop policy if exists "doctors_select_public_active" on public.doctors;
create policy "doctors_select_public_active" on public.doctors
for select
using (
  active = true
  and (start_date is null or start_date <= current_date)
  and (end_date is null or end_date >= current_date)
);

-- OWNER manage
-- (If your function is named differently, update public.is_owner(auth.uid()).)
drop policy if exists "doctors_owner_insert" on public.doctors;
create policy "doctors_owner_insert" on public.doctors
for insert
with check (public.is_owner(auth.uid()));

drop policy if exists "doctors_owner_update" on public.doctors;
create policy "doctors_owner_update" on public.doctors
for update
using (public.is_owner(auth.uid()))
with check (public.is_owner(auth.uid()));

drop policy if exists "doctors_owner_delete" on public.doctors;
create policy "doctors_owner_delete" on public.doctors
for delete
using (public.is_owner(auth.uid()));

create index if not exists doctors_active_idx on public.doctors(active);
create index if not exists doctors_created_at_idx on public.doctors(created_at desc);
