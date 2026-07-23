create or replace function public.dispatch_due_event_reminders(
  p_now timestamptz default now(),
  p_limit integer default 100
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  dispatched_count integer;
begin
  with due_reminders as (
    select
      reminders.id,
      reminders.player_id,
      reminders.event_id,
      reminders.remind_at,
      events.name as event_name,
      events.starts_at,
      events.scope
    from public.event_reminders reminders
    join public.events events on events.id = reminders.event_id
    where reminders.status = 'active'
      and reminders.remind_at <= p_now
      and events.starts_at > p_now
    order by reminders.remind_at asc
    limit greatest(1, least(coalesce(p_limit, 100), 500))
    for update skip locked
  ),
  inserted_notifications as (
    insert into public.notifications (
      player_id,
      kind,
      title,
      body,
      payload
    )
    select
      player_id,
      'event_started',
      'Mission reminder',
      'Mission "' || event_name || '" starts soon.',
      jsonb_build_object(
        'eventId', event_id,
        'eventName', event_name,
        'scope', scope,
        'startsAt', starts_at,
        'remindAt', remind_at
      )
    from due_reminders
    returning 1
  ),
  updated_reminders as (
    update public.event_reminders reminders
    set status = 'sent'
    from due_reminders
    where reminders.id = due_reminders.id
    returning reminders.id
  )
  select count(*) into dispatched_count from updated_reminders;

  return dispatched_count;
end;
$$;

revoke all on function public.dispatch_due_event_reminders(timestamptz, integer) from public;
grant execute on function public.dispatch_due_event_reminders(timestamptz, integer) to service_role;
