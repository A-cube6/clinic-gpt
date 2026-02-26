-- STEP 6: Discount % for catalog + Procedures (with doctor mapping)
-- Run in Supabase SQL Editor AFTER your existing catalog/orders scripts.
--
-- 1) Adds discount_pct to public.catalog_items
-- 2) Creates procedures + procedure_doctors (many-to-many with doctors)
-- 3) Enables RLS + owner-only write policies

-- 1) Catalog: add discount_pct
alter table public.catalog_items
  add column if not exists discount_pct numeric not null default 0;

-- Backfill % from existing discount_inr/mrp_inr (best-effort)
update public.catalog_items
set discount_pct =
  case
    when mrp_inr > 0 then round((discount_inr::numeric / mrp_inr::numeric) * 100, 2)
    else 0
  end
where discount_pct = 0 and discount_inr <> 0 and mrp_inr > 0;

-- 2) Procedures tables
create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_inr int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.procedure_doctors (
  procedure_id uuid not null references public.procedures(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (procedure_id, doctor_id)
);

-- 3) RLS
alter table public.procedures enable row level security;
alter table public.procedure_doctors enable row level security;

-- Helper functions might already exist; keep them aligned to staff_profiles
create or replace function public.is_owner()
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.id = auth.uid() and sp.role = 'owner'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.id = auth.uid() and sp.role in ('owner','reception')
  );
$$;

-- Clean up old policies if rerunning
drop policy if exists procedures_public_read on public.procedures;
drop policy if exists procedures_owner_write on public.procedures;

drop policy if exists procedure_doctors_public_read on public.procedure_doctors;
drop policy if exists procedure_doctors_owner_write on public.procedure_doctors;

-- Procedures: public can read active (useful later for booking UI)
create policy procedures_public_read
on public.procedures
for select
to public
using (active = true);

-- Procedures: owner can do everything
create policy procedures_owner_write
on public.procedures
for all
to authenticated
using (public.is_owner())
with check (public.is_owner());

-- Mapping: public read only for active procedures (optional, but handy later)
create policy procedure_doctors_public_read
on public.procedure_doctors
for select
to public
using (
  exists (
    select 1 from public.procedures p
    where p.id = procedure_doctors.procedure_id and p.active = true
  )
);

-- Mapping: owner can do everything
create policy procedure_doctors_owner_write
on public.procedure_doctors
for all
to authenticated
using (public.is_owner())
with check (public.is_owner());

-- Grants (Supabase usually manages these, but explicit is okay)
grant select on public.procedures to anon, authenticated;
grant select on public.procedure_doctors to anon, authenticated;
grant insert, update, delete on public.procedures to authenticated;
grant insert, update, delete on public.procedure_doctors to authenticated;
