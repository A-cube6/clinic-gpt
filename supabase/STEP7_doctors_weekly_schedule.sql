-- STEP7: Doctors weekly schedule (Sunday-Saturday) for Owner dashboard twisty view
-- Adds a JSONB map {sun,mon,tue,wed,thu,fri,sat} -> timing string (e.g. "10:00-13:00, 16:00-19:00")

alter table public.doctors
  add column if not exists weekly_schedule jsonb not null default '{}'::jsonb;

comment on column public.doctors.weekly_schedule is
  'Weekly sitting schedule map. Keys: sun, mon, tue, wed, thu, fri, sat. Values are free-text timing strings.';
