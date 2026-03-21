-- STEP11: Public booking calendar RPC for homepage doctor availability.
-- Exposes only aggregate confirmed booking counts by doctor and date.

create or replace function public.get_public_doctor_booking_calendar(
  p_doctor_id uuid,
  p_from date default null,
  p_to date default null
)
returns table (
  booking_date date,
  booking_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    br.preferred_date as booking_date,
    count(*)::bigint as booking_count
  from public.booking_requests br
  where br.status = 'confirmed'
    and br.doctor_id = p_doctor_id
    and br.preferred_date is not null
    and (p_from is null or br.preferred_date >= p_from)
    and (p_to is null or br.preferred_date <= p_to)
  group by br.preferred_date
  order by br.preferred_date asc;
$$;

revoke all on function public.get_public_doctor_booking_calendar(uuid, date, date) from public;
grant execute on function public.get_public_doctor_booking_calendar(uuid, date, date) to anon, authenticated;
