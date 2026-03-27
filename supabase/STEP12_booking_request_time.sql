alter table public.booking_requests
  add column if not exists preferred_time time null;

create index if not exists booking_requests_preferred_time_idx
  on public.booking_requests (preferred_time);
