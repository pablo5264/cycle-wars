create or replace view public.v_event_schedule as
select
  events.id,
  events.code,
  events.name,
  events.description,
  events.starts_at,
  events.ends_at,
  events.scope,
  events.objectives,
  events.rewards
from public.events
where events.ends_at > now()
order by events.starts_at asc, events.ends_at asc;

revoke all on public.v_event_schedule from public;
revoke all on public.v_event_schedule from anon;
revoke all on public.v_event_schedule from authenticated;
grant select on public.v_event_schedule to service_role;
