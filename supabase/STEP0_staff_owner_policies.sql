-- STEP 0 (run if needed): Ensure owner can manage staff_profiles
-- Assumes: public.staff_profiles exists and RLS is enabled.

alter table public.staff_profiles enable row level security;

-- Owner can do everything on staff_profiles
drop policy if exists "staff_owner_all" on public.staff_profiles;
create policy "staff_owner_all" on public.staff_profiles
for all
using (public.is_owner(auth.uid()))
with check (public.is_owner(auth.uid()));

-- Staff can read their own row
drop policy if exists "staff_select_own" on public.staff_profiles;
create policy "staff_select_own" on public.staff_profiles
for select
using (auth.uid() = id);
