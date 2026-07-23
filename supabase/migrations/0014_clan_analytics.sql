create or replace view public.v_clan_analytics as
select
  c.id as clan_id,
  c.name,
  c.slug,
  c.color,
  c.level,
  c.experience,
  coalesce(member_stats.member_count, 0) as member_count,
  coalesce(member_stats.total_contribution_points, 0) as total_contribution_points,
  coalesce(territory_stats.territory_count, 0) as territory_count,
  coalesce(territory_stats.total_influence, 0) as total_influence,
  coalesce(territory_stats.average_level, 0) as average_territory_level,
  coalesce(influence_stats.influence_events, 0) as influence_events,
  coalesce(influence_stats.influence_delta, 0) as influence_delta,
  coalesce(region_stats.controlled_regions, 0) as controlled_regions,
  coalesce(reward_stats.regional_reward_count, 0) as regional_reward_count,
  coalesce(reward_stats.regional_reward_coins, 0) as regional_reward_coins,
  greatest(
    0,
    least(
      100,
      round(
        (
          coalesce(territory_stats.territory_count, 0) * 4
          + coalesce(region_stats.controlled_regions, 0) * 15
          + coalesce(member_stats.member_count, 0) * 2
        )::numeric,
        0
      )
    )
  ) as war_readiness,
  now() as calculated_at
from public.clans c
left join lateral (
  select
    count(*)::integer as member_count,
    coalesce(sum(contribution_points), 0)::bigint as total_contribution_points
  from public.clan_memberships cm
  where cm.clan_id = c.id
) member_stats on true
left join lateral (
  select
    count(*)::integer as territory_count,
    coalesce(sum(influence_points), 0)::integer as total_influence,
    coalesce(avg(level), 0)::numeric(8, 2) as average_level
  from public.territories t
  where t.clan_id = c.id
) territory_stats on true
left join lateral (
  select
    count(*)::integer as influence_events,
    coalesce(sum(influence_delta), 0)::integer as influence_delta
  from public.territory_influence_events e
  where e.clan_id = c.id
) influence_stats on true
left join lateral (
  select count(distinct region_id)::integer as controlled_regions
  from public.region_control_snapshots s
  where s.controller_clan_id = c.id
) region_stats on true
left join lateral (
  select
    count(*)::integer as regional_reward_count,
    coalesce(sum(amount) filter (where currency = 'coins'), 0)::integer as regional_reward_coins
  from public.season_region_rewards r
  where r.clan_id = c.id
) reward_stats on true;

revoke all on public.v_clan_analytics from public, anon, authenticated;
grant select on public.v_clan_analytics to service_role;
