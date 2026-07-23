create index if not exists admin_regions_kind_name_idx
on public.admin_regions(kind, name);

create index if not exists region_control_snapshots_region_time_idx
on public.region_control_snapshots(region_id, captured_at desc);

create or replace function public.refresh_region_control(p_region_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_season_id uuid;
  inserted_count integer := 0;
begin
  current_season_id := public.active_season_id();

  insert into public.region_control_snapshots (
    region_id,
    season_id,
    controller_player_id,
    controller_clan_id,
    controlled_hexes,
    total_hexes,
    captured_at
  )
  with scoped_regions as (
    select id
    from public.admin_regions
    where p_region_id is null or id = p_region_id
  ),
  totals as (
    select sr.id as region_id, count(rh.h3_index)::integer as total_hexes
    from scoped_regions sr
    left join public.region_hexes rh on rh.region_id = sr.id
    group by sr.id
  ),
  contenders as (
    select
      rh.region_id,
      t.clan_id,
      t.owner_id,
      count(*)::integer as controlled_hexes,
      row_number() over (
        partition by rh.region_id
        order by count(*) desc, max(t.updated_at) desc
      ) as rank
    from public.region_hexes rh
    join public.territories t on t.h3_index = rh.h3_index
    where (p_region_id is null or rh.region_id = p_region_id)
      and t.owner_id is not null
    group by rh.region_id, t.clan_id, t.owner_id
  )
  select
    totals.region_id,
    current_season_id,
    contenders.owner_id,
    contenders.clan_id,
    coalesce(contenders.controlled_hexes, 0),
    totals.total_hexes,
    now()
  from totals
  left join contenders on contenders.region_id = totals.region_id and contenders.rank = 1
  where totals.total_hexes > 0;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace view public.v_region_control as
select
  r.id as region_id,
  r.parent_id,
  r.kind,
  r.name,
  r.country_code,
  s.season_id,
  s.controller_player_id,
  p.display_name as controller_player_name,
  s.controller_clan_id,
  c.name as controller_clan_name,
  c.color as controller_clan_color,
  s.controlled_hexes,
  s.total_hexes,
  case
    when s.total_hexes = 0 then 0
    else round((s.controlled_hexes::numeric / s.total_hexes::numeric) * 100, 2)
  end as control_percent,
  s.captured_at
from public.admin_regions r
join lateral (
  select *
  from public.region_control_snapshots latest
  where latest.region_id = r.id
  order by latest.captured_at desc
  limit 1
) s on true
left join public.player_profiles p on p.id = s.controller_player_id
left join public.clans c on c.id = s.controller_clan_id;

revoke execute on function public.refresh_region_control(uuid) from public, anon, authenticated;
grant execute on function public.refresh_region_control(uuid) to service_role;

grant select on public.v_region_control to anon, authenticated;
