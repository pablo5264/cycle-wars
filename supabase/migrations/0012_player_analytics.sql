create or replace view public.v_player_analytics as
select
  p.id as player_id,
  p.display_name,
  p.avatar_url,
  coalesce(l.league, 'bronze') as league,
  coalesce(l.elo, 1000) as elo,
  coalesce(activity_stats.activity_count, 0) as activity_count,
  coalesce(activity_stats.valid_activity_count, 0) as valid_activity_count,
  coalesce(activity_stats.total_distance_meters, 0) as total_distance_meters,
  coalesce(activity_stats.total_moving_seconds, 0) as total_moving_seconds,
  coalesce(activity_stats.average_speed_kmh, 0) as average_speed_kmh,
  coalesce(activity_stats.max_speed_kmh, 0) as max_speed_kmh,
  coalesce(activity_stats.total_calories, 0) as total_calories,
  coalesce(territory_stats.territory_count, 0) as territory_count,
  coalesce(territory_stats.total_influence, 0) as total_influence,
  coalesce(influence_stats.influence_events, 0) as influence_events,
  coalesce(influence_stats.influence_delta, 0) as influence_delta,
  coalesce(reward_stats.regional_reward_count, 0) as regional_reward_count,
  coalesce(reward_stats.regional_reward_coins, 0) as regional_reward_coins,
  greatest(
    0,
    least(
      100,
      round(
        (
          coalesce(activity_stats.valid_activity_count, 0) * 8
          + coalesce(territory_stats.territory_count, 0) * 5
          + coalesce(reward_stats.regional_reward_count, 0) * 12
        )::numeric,
        0
      )
    )
  ) as season_progress,
  now() as calculated_at
from public.player_profiles p
left join public.player_league_ratings l on l.player_id = p.id
left join lateral (
  select
    count(*)::integer as activity_count,
    count(*) filter (where status = 'valid')::integer as valid_activity_count,
    coalesce(sum(distance_meters), 0)::numeric(14, 2) as total_distance_meters,
    coalesce(sum(moving_seconds), 0)::integer as total_moving_seconds,
    coalesce(avg(nullif(average_speed_kmh, 0)), 0)::numeric(8, 2) as average_speed_kmh,
    coalesce(max(max_speed_kmh), 0)::numeric(8, 2) as max_speed_kmh,
    coalesce(sum(calories), 0)::integer as total_calories
  from public.activities a
  where a.player_id = p.id
) activity_stats on true
left join lateral (
  select
    count(*)::integer as territory_count,
    coalesce(sum(influence_points), 0)::integer as total_influence
  from public.territories t
  where t.owner_id = p.id
) territory_stats on true
left join lateral (
  select
    count(*)::integer as influence_events,
    coalesce(sum(influence_delta), 0)::integer as influence_delta
  from public.territory_influence_events e
  where e.player_id = p.id
) influence_stats on true
left join lateral (
  select
    count(*)::integer as regional_reward_count,
    coalesce(sum(amount) filter (where currency = 'coins'), 0)::integer as regional_reward_coins
  from public.season_region_rewards r
  where r.player_id = p.id
) reward_stats on true;

revoke all on public.v_player_analytics from public, anon, authenticated;
grant select on public.v_player_analytics to service_role;
