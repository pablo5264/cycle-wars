alter table public.events
add column if not exists code text;

create unique index if not exists events_code_idx
on public.events(code)
where code is not null;

insert into public.events (
  code,
  name,
  description,
  starts_at,
  ends_at,
  scope,
  objectives,
  rewards
)
values
  (
    'daily_ride_5k',
    'Ruta diaria 5K',
    'Completa 5 km en actividades validas.',
    date_trunc('day', now()),
    date_trunc('day', now()) + interval '1 day',
    'daily',
    '[{"kind":"distance_meters","target":5000}]'::jsonb,
    '{"coins":50,"experience":100}'::jsonb
  ),
  (
    'weekly_influence_1000',
    'Presion semanal',
    'Genera 1000 puntos de influencia esta semana.',
    date_trunc('week', now()),
    date_trunc('week', now()) + interval '1 week',
    'weekly',
    '[{"kind":"influence_delta","target":1000}]'::jsonb,
    '{"coins":250,"experience":500}'::jsonb
  ),
  (
    'global_touch_25_hexes',
    'Explorador global',
    'Toca 25 territorios distintos durante el evento global.',
    date_trunc('month', now()),
    date_trunc('month', now()) + interval '1 month',
    'global',
    '[{"kind":"touched_territories","target":25}]'::jsonb,
    '{"crystals":10,"experience":1000}'::jsonb
  )
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    scope = excluded.scope,
    objectives = excluded.objectives,
    rewards = excluded.rewards;

create or replace function public.refresh_player_event_progress(p_player_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  event_row public.events;
  objective jsonb;
  objective_kind text;
  target_value numeric;
  current_value numeric;
  objective_results jsonb;
  completed boolean;
  updated_count integer := 0;
begin
  for event_row in
    select *
    from public.events
    where starts_at <= now()
      and ends_at > now()
  loop
    objective_results := '[]'::jsonb;
    completed := true;

    for objective in
      select value
      from jsonb_array_elements(event_row.objectives)
    loop
      objective_kind := objective->>'kind';
      target_value := coalesce((objective->>'target')::numeric, 1);
      current_value := 0;

      if objective_kind = 'distance_meters' then
        select coalesce(sum(distance_meters), 0)
        into current_value
        from public.activities
        where player_id = p_player_id
          and status = 'valid'
          and started_at >= event_row.starts_at
          and started_at < event_row.ends_at;
      elsif objective_kind = 'influence_delta' then
        select coalesce(sum(greatest(influence_delta, 0)), 0)
        into current_value
        from public.territory_influence_events
        where player_id = p_player_id
          and occurred_at >= event_row.starts_at
          and occurred_at < event_row.ends_at;
      elsif objective_kind = 'touched_territories' then
        select count(distinct territory_h3_index)
        into current_value
        from public.territory_influence_events
        where player_id = p_player_id
          and occurred_at >= event_row.starts_at
          and occurred_at < event_row.ends_at;
      end if;

      if current_value < target_value then
        completed := false;
      end if;

      objective_results := objective_results || jsonb_build_array(
        jsonb_build_object(
          'kind', objective_kind,
          'target', target_value,
          'current', current_value,
          'percent', least(100, round((current_value / greatest(target_value, 1)) * 100, 2))
        )
      );
    end loop;

    insert into public.event_progress (
      event_id,
      player_id,
      progress,
      completed_at,
      updated_at
    )
    values (
      event_row.id,
      p_player_id,
      jsonb_build_object('objectives', objective_results),
      case when completed then now() else null end,
      now()
    )
    on conflict (event_id, player_id) do update
    set progress = excluded.progress,
        completed_at = case
          when event_progress.completed_at is not null then event_progress.completed_at
          else excluded.completed_at
        end,
        updated_at = now();

    updated_count := updated_count + 1;
  end loop;

  return updated_count;
end;
$$;

create or replace view public.v_player_events as
select
  events.id,
  events.code,
  events.name,
  events.description,
  events.starts_at,
  events.ends_at,
  events.scope,
  events.objectives,
  events.rewards,
  progress.player_id,
  coalesce(progress.progress, '{}'::jsonb) as progress,
  progress.completed_at,
  progress.updated_at
from public.events
left join public.event_progress progress on progress.event_id = events.id;

revoke all on public.v_player_events from public;
revoke all on public.v_player_events from anon;
revoke all on public.v_player_events from authenticated;
grant select on public.v_player_events to service_role;

revoke execute on function public.refresh_player_event_progress(uuid) from public, anon, authenticated;
grant execute on function public.refresh_player_event_progress(uuid) to service_role;
