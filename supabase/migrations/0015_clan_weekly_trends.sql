create or replace view public.v_clan_weekly_trends as
with activity_weeks as (
  select
    cm.clan_id,
    date_trunc('week', a.started_at)::date as week_start,
    count(*)::integer as activity_count,
    count(*) filter (where a.status = 'valid')::integer as valid_activity_count,
    count(distinct a.player_id)::integer as active_members,
    coalesce(sum(a.distance_meters), 0)::numeric(14, 2) as distance_meters,
    coalesce(sum(a.moving_seconds), 0)::integer as moving_seconds,
    coalesce(sum(a.calories), 0)::integer as calories
  from public.activities a
  join public.clan_memberships cm on cm.player_id = a.player_id
  group by cm.clan_id, date_trunc('week', a.started_at)::date
),
influence_weeks as (
  select
    clan_id,
    date_trunc('week', occurred_at)::date as week_start,
    count(distinct player_id)::integer as contributing_members,
    count(distinct territory_h3_index)::integer as touched_territories,
    coalesce(sum(influence_delta), 0)::integer as influence_delta
  from public.territory_influence_events
  where clan_id is not null
  group by clan_id, date_trunc('week', occurred_at)::date
),
reward_weeks as (
  select
    clan_id,
    date_trunc('week', awarded_at)::date as week_start,
    count(*)::integer as regional_reward_count,
    coalesce(sum(amount) filter (where currency = 'coins'), 0)::integer as regional_reward_coins
  from public.season_region_rewards
  where clan_id is not null
  group by clan_id, date_trunc('week', awarded_at)::date
),
clan_weeks as (
  select clan_id, week_start from activity_weeks
  union
  select clan_id, week_start from influence_weeks
  union
  select clan_id, week_start from reward_weeks
)
select
  cw.clan_id,
  cw.week_start,
  (cw.week_start + interval '6 days')::date as week_end,
  coalesce(a.activity_count, 0) as activity_count,
  coalesce(a.valid_activity_count, 0) as valid_activity_count,
  coalesce(a.active_members, 0) as active_members,
  coalesce(i.contributing_members, 0) as contributing_members,
  coalesce(a.distance_meters, 0) as distance_meters,
  coalesce(a.moving_seconds, 0) as moving_seconds,
  coalesce(a.calories, 0) as calories,
  coalesce(i.touched_territories, 0) as touched_territories,
  coalesce(i.influence_delta, 0) as influence_delta,
  coalesce(r.regional_reward_count, 0) as regional_reward_count,
  coalesce(r.regional_reward_coins, 0) as regional_reward_coins
from clan_weeks cw
left join activity_weeks a on a.clan_id = cw.clan_id and a.week_start = cw.week_start
left join influence_weeks i on i.clan_id = cw.clan_id and i.week_start = cw.week_start
left join reward_weeks r on r.clan_id = cw.clan_id and r.week_start = cw.week_start;

revoke all on public.v_clan_weekly_trends from public, anon, authenticated;
grant select on public.v_clan_weekly_trends to service_role;
