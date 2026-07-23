create or replace view public.v_player_weekly_trends as
with activity_weeks as (
  select
    player_id,
    date_trunc('week', started_at)::date as week_start,
    count(*)::integer as activity_count,
    count(*) filter (where status = 'valid')::integer as valid_activity_count,
    coalesce(sum(distance_meters), 0)::numeric(14, 2) as distance_meters,
    coalesce(sum(moving_seconds), 0)::integer as moving_seconds,
    coalesce(sum(calories), 0)::integer as calories
  from public.activities
  group by player_id, date_trunc('week', started_at)::date
),
influence_weeks as (
  select
    player_id,
    date_trunc('week', occurred_at)::date as week_start,
    count(distinct territory_h3_index)::integer as touched_territories,
    coalesce(sum(influence_delta), 0)::integer as influence_delta
  from public.territory_influence_events
  group by player_id, date_trunc('week', occurred_at)::date
),
reward_weeks as (
  select
    player_id,
    date_trunc('week', awarded_at)::date as week_start,
    count(*)::integer as regional_reward_count,
    coalesce(sum(amount) filter (where currency = 'coins'), 0)::integer as regional_reward_coins
  from public.season_region_rewards
  group by player_id, date_trunc('week', awarded_at)::date
),
player_weeks as (
  select player_id, week_start from activity_weeks
  union
  select player_id, week_start from influence_weeks
  union
  select player_id, week_start from reward_weeks
)
select
  pw.player_id,
  pw.week_start,
  (pw.week_start + interval '6 days')::date as week_end,
  coalesce(a.activity_count, 0) as activity_count,
  coalesce(a.valid_activity_count, 0) as valid_activity_count,
  coalesce(a.distance_meters, 0) as distance_meters,
  coalesce(a.moving_seconds, 0) as moving_seconds,
  coalesce(a.calories, 0) as calories,
  coalesce(i.touched_territories, 0) as touched_territories,
  coalesce(i.influence_delta, 0) as influence_delta,
  coalesce(r.regional_reward_count, 0) as regional_reward_count,
  coalesce(r.regional_reward_coins, 0) as regional_reward_coins
from player_weeks pw
left join activity_weeks a on a.player_id = pw.player_id and a.week_start = pw.week_start
left join influence_weeks i on i.player_id = pw.player_id and i.week_start = pw.week_start
left join reward_weeks r on r.player_id = pw.player_id and r.week_start = pw.week_start;

revoke all on public.v_player_weekly_trends from public, anon, authenticated;
grant select on public.v_player_weekly_trends to service_role;
