create or replace view public.v_event_leaderboards as
with objective_scores as (
  select
    progress.event_id,
    progress.player_id,
    objective.value as objective,
    coalesce((objective.value->>'current')::numeric, 0) as current_value,
    coalesce((objective.value->>'target')::numeric, 1) as target_value,
    coalesce((objective.value->>'percent')::numeric, 0) as percent_value
  from public.event_progress progress
  cross join lateral jsonb_array_elements(coalesce(progress.progress->'objectives', '[]'::jsonb)) objective(value)
),
ranked as (
  select
    event_id,
    player_id,
    round(avg(least(percent_value, 100)), 2) as progress_percent,
    sum(current_value) as score,
    sum(target_value) as target_score
  from objective_scores
  group by event_id, player_id
)
select
  events.id as event_id,
  events.code as event_code,
  events.name as event_name,
  events.scope,
  events.ends_at,
  ranked.player_id,
  profiles.display_name,
  profiles.avatar_url,
  ranked.progress_percent,
  ranked.score,
  ranked.target_score,
  progress.completed_at,
  row_number() over (
    partition by events.id
    order by
      case when progress.completed_at is null then 0 else 1 end desc,
      ranked.progress_percent desc,
      ranked.score desc,
      progress.updated_at asc
  ) as rank
from ranked
join public.events on events.id = ranked.event_id
join public.event_progress progress
  on progress.event_id = ranked.event_id
  and progress.player_id = ranked.player_id
join public.player_profiles profiles on profiles.id = ranked.player_id
where events.starts_at <= now()
  and events.ends_at > now();

revoke all on public.v_event_leaderboards from public;
revoke all on public.v_event_leaderboards from anon;
revoke all on public.v_event_leaderboards from authenticated;
grant select on public.v_event_leaderboards to service_role;
