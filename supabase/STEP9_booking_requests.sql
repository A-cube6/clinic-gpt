-- STEP9: Booking requests table (appointment requests)
-- Stores booking requests submitted from the website booking form.

-- 0) Helper functions (safe to re-run)
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

create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.id = auth.uid()
  );
$$;

-- 1) Table
create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  status text not null default 'new' check (status in ('new','called','confirmed','cancelled')),

  full_name text not null,
  phone text not null,

  service text null,
  preferred_date date null,

  doctor_id uuid null references public.doctors(id) on delete set null,

  note text null,
  source text null,
  user_id uuid null references auth.users(id) on delete set null default auth.uid()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists booking_requests_set_updated_at on public.booking_requests;
create trigger booking_requests_set_updated_at
before update on public.booking_requests
for each row execute function public.set_updated_at();

-- Indexes
create index if not exists booking_requests_created_at_idx on public.booking_requests (created_at desc);
create index if not exists booking_requests_status_idx on public.booking_requests (status);
create index if not exists booking_requests_preferred_date_idx on public.booking_requests (preferred_date);

-- 2) RLS
alter table public.booking_requests enable row level security;

-- Anyone (including anon) can create a booking request (minimal checks)
drop policy if exists "booking_requests_public_insert" on public.booking_requests;
create policy "booking_requests_public_insert"
  on public.booking_requests
  for insert
  to public
  with check (
    length(trim(full_name)) > 0
    and length(regexp_replace(phone, '\\D', '', 'g')) >= 8
  );

-- Only staff can read
drop policy if exists "booking_requests_staff_read" on public.booking_requests;
create policy "booking_requests_staff_read"
  on public.booking_requests
  for select
  using (public.is_staff());

-- Staff can update status and add notes (full row updates allowed for now)
drop policy if exists "booking_requests_staff_update" on public.booking_requests;
create policy "booking_requests_staff_update"
  on public.booking_requests
  for update
  using (public.is_staff())
  with check (public.is_staff());

-- Only owner can delete
drop policy if exists "booking_requests_owner_delete" on public.booking_requests;
create policy "booking_requests_owner_delete"
  on public.booking_requests
  for delete
  using (public.is_owner());
