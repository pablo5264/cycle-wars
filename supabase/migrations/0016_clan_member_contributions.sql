create or replace view public.v_clan_member_contributions as
select
  cm.clan_id,
  cm.player_id,
  p.display_name,
  p.avatar_url,
  cm.role,
  cm.joined_at,
  cm.contribution_points,
  coalesce(activity_stats.activity_count, 0) as activity_count,
  coalesce(activity_stats.valid_activity_count, 0) as valid_activity_count,
  coalesce(activity_stats.distance_meters, 0) as distance_meters,
  coalesce(activity_stats.moving_seconds, 0) as moving_seconds,
  coalesce(influence_stats.touched_territories, 0) as touched_territories,
  coalesce(influence_stats.influence_delta, 0) as influence_delta,
  coalesce(reward_stats.regional_reward_count, 0) as regional_reward_count,
  coalesce(reward_stats.regional_reward_coins, 0) as regional_reward_coins,
  greatest(
    0,
    round(
      (
        coalesce(activity_stats.valid_activity_count, 0) * 5
        + coalesce(influence_stats.touched_territories, 0) * 3
        + coalesce(influence_stats.influence_delta, 0) / 100.0
        + coalesce(reward_stats.regional_reward_count, 0) * 10
      )::numeric,
      0
    )
  )::integer as squad_score,
  now() as calculated_at
from public.clan_memberships cm
join public.player_profiles p on p.id = cm.player_id
left join lateral (
  select
    count(*)::integer as activity_count,
    count(*) filter (where status = 'valid')::integer as valid_activity_count,
    coalesce(sum(distance_meters), 0)::numeric(14, 2) as distance_meters,
    coalesce(sum(moving_seconds), 0)::integer as moving_seconds
  from public.activities a
  where a.player_id = cm.player_id
) activity_stats on true
left join lateral (
  select
    count(distinct territory_h3_index)::integer as touched_territories,
    coalesce(sum(influence_delta), 0)::integer as influence_delta
  from public.territory_influence_events e
  where e.player_id = cm.player_id
    and e.clan_id = cm.clan_id
) influence_stats on true
left join lateral (
  select
    count(*)::integer as regional_reward_count,
    coalesce(sum(amount) filter (where currency = 'coins'), 0)::integer as regional_reward_coins
  from public.season_region_rewards r
  where r.player_id = cm.player_id
    and r.clan_id = cm.clan_id
) reward_stats on true;

revoke all on public.v_clan_member_contributions from public, anon, authenticated;
grant select on public.v_clan_member_contributions to service_role;
