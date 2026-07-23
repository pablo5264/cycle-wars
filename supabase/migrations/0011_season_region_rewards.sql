create table public.season_region_rewards (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  region_id uuid not null references public.admin_regions(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  clan_id uuid references public.clans(id) on delete set null,
  currency public.currency_kind not null default 'coins',
  amount integer not null check (amount > 0),
  controlled_hexes integer not null check (controlled_hexes >= 0),
  total_hexes integer not null check (total_hexes >= 0),
  control_percent numeric(6, 2) not null default 0,
  reason text not null default 'regional_control',
  awarded_at timestamptz not null default now(),
  unique (season_id, region_id, player_id, reason)
);

create index season_region_rewards_player_time_idx
on public.season_region_rewards(player_id, awarded_at desc);

create index season_region_rewards_season_region_idx
on public.season_region_rewards(season_id, region_id);

alter table public.season_region_rewards enable row level security;

create policy "players can read own regional rewards"
on public.season_region_rewards for select
to authenticated
using (player_id = auth.uid());

create or replace function public.settle_region_season_rewards(
  p_season_id uuid default null,
  p_min_control_percent numeric default 50,
  p_base_amount integer default 250
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  target_season_id uuid;
  inserted_count integer := 0;
begin
  target_season_id := coalesce(p_season_id, public.active_season_id());

  if target_season_id is null then
    raise exception 'No season available for regional rewards';
  end if;

  with latest as (
    select distinct on (s.region_id)
      s.region_id,
      s.season_id,
      s.controller_player_id,
      s.controller_clan_id,
      s.controlled_hexes,
      s.total_hexes,
      case
        when s.total_hexes = 0 then 0::numeric
        else round((s.controlled_hexes::numeric / s.total_hexes::numeric) * 100, 2)
      end as control_percent
    from public.region_control_snapshots s
    where s.season_id = target_season_id
      and s.controller_player_id is not null
    order by s.region_id, s.captured_at desc
  ),
  eligible as (
    select
      latest.*,
      greatest(
        p_base_amount,
        round(p_base_amount * (latest.control_percent / 100.0))::integer
      ) as reward_amount
    from latest
    where latest.control_percent >= p_min_control_percent
  ),
  inserted as (
    insert into public.season_region_rewards (
      season_id,
      region_id,
      player_id,
      clan_id,
      currency,
      amount,
      controlled_hexes,
      total_hexes,
      control_percent
    )
    select
      target_season_id,
      region_id,
      controller_player_id,
      controller_clan_id,
      'coins',
      reward_amount,
      controlled_hexes,
      total_hexes,
      control_percent
    from eligible
    on conflict (season_id, region_id, player_id, reason) do nothing
    returning *
  ),
  grants as (
    select (public.grant_currency(
      inserted.player_id,
      inserted.currency,
      inserted.amount,
      'regional_control_reward',
      'season_region_rewards',
      inserted.id
    )).player_id
    from inserted
  )
  select count(*)::integer into inserted_count
  from grants;

  return inserted_count;
end;
$$;

create or replace view public.v_player_region_rewards as
select
  r.id,
  r.season_id,
  s.name as season_name,
  r.region_id,
  ar.name as region_name,
  ar.kind as region_kind,
  r.player_id,
  r.clan_id,
  c.name as clan_name,
  c.color as clan_color,
  r.currency,
  r.amount,
  r.controlled_hexes,
  r.total_hexes,
  r.control_percent,
  r.awarded_at
from public.season_region_rewards r
join public.seasons s on s.id = r.season_id
join public.admin_regions ar on ar.id = r.region_id
left join public.clans c on c.id = r.clan_id;

revoke execute on function public.settle_region_season_rewards(uuid, numeric, integer) from public, anon, authenticated;
grant execute on function public.settle_region_season_rewards(uuid, numeric, integer) to service_role;

grant select on public.v_player_region_rewards to authenticated;
