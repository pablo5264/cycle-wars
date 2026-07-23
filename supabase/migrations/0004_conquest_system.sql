alter table public.territories
  add column if not exists total_distance_meters numeric(14, 2) not null default 0 check (total_distance_meters >= 0),
  add column if not exists last_decay_at timestamptz not null default now();

create table public.territory_player_influence (
  territory_h3_index text not null references public.territories(h3_index) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  clan_id uuid references public.clans(id) on delete set null,
  season_id uuid references public.seasons(id) on delete set null,
  influence_points integer not null default 0 check (influence_points >= 0),
  distance_meters numeric(14, 2) not null default 0 check (distance_meters >= 0),
  last_activity_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (territory_h3_index, player_id)
);

create index territory_player_influence_player_idx
on public.territory_player_influence(player_id, updated_at desc);

create index territory_player_influence_territory_score_idx
on public.territory_player_influence(territory_h3_index, influence_points desc);

create table public.territory_level_rules (
  level integer primary key check (level between 1 and 5),
  name text not null unique,
  required_distance_meters numeric(14, 2) not null check (required_distance_meters >= 0),
  shield_bonus_minutes integer not null default 0 check (shield_bonus_minutes >= 0)
);

insert into public.territory_level_rules (level, name, required_distance_meters, shield_bonus_minutes)
values
  (1, 'Puesto', 0, 0),
  (2, 'Campamento', 5000, 15),
  (3, 'Base', 15000, 30),
  (4, 'Fortaleza', 35000, 60),
  (5, 'Ciudadela', 75000, 120)
on conflict (level) do update
set name = excluded.name,
    required_distance_meters = excluded.required_distance_meters,
    shield_bonus_minutes = excluded.shield_bonus_minutes;

create trigger territory_player_influence_set_updated_at
before update on public.territory_player_influence
for each row execute function public.set_updated_at();

alter table public.territory_player_influence enable row level security;
alter table public.territory_level_rules enable row level security;

create policy "players can read territory influence leaderboard"
on public.territory_player_influence for select
to authenticated
using (true);

create policy "players can read territory level rules"
on public.territory_level_rules for select
to authenticated, anon
using (true);

create or replace function public.territory_level_for_distance(p_distance_meters numeric)
returns integer
language sql
stable
as $$
  select level
  from public.territory_level_rules
  where required_distance_meters <= greatest(p_distance_meters, 0)
  order by level desc
  limit 1
$$;

create or replace function public.apply_territory_influence(
  p_h3_index text,
  p_player_id uuid,
  p_clan_id uuid,
  p_activity_id uuid,
  p_influence_delta integer,
  p_distance_meters numeric,
  p_shield_minutes integer,
  p_now timestamptz
)
returns public.territories
language plpgsql
security definer
set search_path = public
as $$
declare
  current_territory public.territories;
  updated_territory public.territories;
  current_season_id uuid;
  challenger_influence integer;
  owner_influence integer;
  next_distance numeric(14, 2);
  next_level integer;
  next_shield_until timestamptz;
  level_shield_bonus integer;
begin
  if p_influence_delta <= 0 then
    raise exception 'Influence delta must be positive';
  end if;

  current_season_id := public.active_season_id();

  insert into public.territories (
    h3_index,
    owner_id,
    clan_id,
    captured_at,
    influence_points,
    level,
    shield_until,
    color,
    status,
    season_id,
    total_distance_meters,
    last_decay_at
  )
  values (
    p_h3_index,
    null,
    null,
    null,
    0,
    1,
    null,
    '#7A8794',
    'neutral',
    current_season_id,
    0,
    p_now
  )
  on conflict (h3_index) do nothing;

  select *
  into current_territory
  from public.territories
  where h3_index = p_h3_index
  for update;

  insert into public.territory_influence_events (
    territory_h3_index,
    activity_id,
    player_id,
    clan_id,
    season_id,
    influence_delta,
    distance_meters,
    occurred_at
  )
  values (
    p_h3_index,
    p_activity_id,
    p_player_id,
    p_clan_id,
    current_season_id,
    p_influence_delta,
    p_distance_meters,
    p_now
  );

  if current_territory.shield_until is not null and current_territory.shield_until > p_now
     and current_territory.owner_id <> p_player_id then
    update public.territories
    set status = 'protected',
        updated_at = p_now
    where h3_index = p_h3_index
    returning * into updated_territory;

    return updated_territory;
  end if;

  insert into public.territory_player_influence (
    territory_h3_index,
    player_id,
    clan_id,
    season_id,
    influence_points,
    distance_meters,
    last_activity_at
  )
  values (
    p_h3_index,
    p_player_id,
    p_clan_id,
    current_season_id,
    p_influence_delta,
    p_distance_meters,
    p_now
  )
  on conflict (territory_h3_index, player_id) do update
  set clan_id = excluded.clan_id,
      season_id = excluded.season_id,
      influence_points = public.territory_player_influence.influence_points + excluded.influence_points,
      distance_meters = public.territory_player_influence.distance_meters + excluded.distance_meters,
      last_activity_at = excluded.last_activity_at;

  select influence_points
  into challenger_influence
  from public.territory_player_influence
  where territory_h3_index = p_h3_index
    and player_id = p_player_id;

  owner_influence := current_territory.influence_points;

  if current_territory.owner_id = p_player_id or current_territory.owner_id is null then
    next_distance := current_territory.total_distance_meters + p_distance_meters;
    next_level := public.territory_level_for_distance(next_distance);

    update public.territories
    set owner_id = coalesce(owner_id, p_player_id),
        clan_id = coalesce(clan_id, p_clan_id),
        captured_at = coalesce(captured_at, p_now),
        influence_points = greatest(influence_points, 0) + p_influence_delta,
        total_distance_meters = next_distance,
        level = next_level,
        status = case when shield_until is not null and shield_until > p_now then 'protected' else 'vulnerable' end,
        season_id = coalesce(season_id, current_season_id),
        color = coalesce((select color from public.clans where id = p_clan_id), color, '#39E58C'),
        updated_at = p_now
    where h3_index = p_h3_index
    returning * into updated_territory;

    if current_territory.owner_id is null then
      insert into public.territory_ownership_history (
        territory_h3_index,
        previous_owner_id,
        new_owner_id,
        previous_clan_id,
        new_clan_id,
        season_id,
        changed_at,
        reason
      )
      values (p_h3_index, null, p_player_id, null, p_clan_id, current_season_id, p_now, 'first_capture');
    end if;

    return updated_territory;
  end if;

  if challenger_influence > owner_influence then
    next_distance := p_distance_meters;
    next_level := public.territory_level_for_distance(next_distance);

    select shield_bonus_minutes
    into level_shield_bonus
    from public.territory_level_rules
    where level = next_level;

    next_shield_until := p_now + make_interval(mins => greatest(p_shield_minutes, 0) + coalesce(level_shield_bonus, 0));

    insert into public.territory_ownership_history (
      territory_h3_index,
      previous_owner_id,
      new_owner_id,
      previous_clan_id,
      new_clan_id,
      season_id,
      changed_at,
      reason
    )
    values (
      p_h3_index,
      current_territory.owner_id,
      p_player_id,
      current_territory.clan_id,
      p_clan_id,
      current_season_id,
      p_now,
      'conquest'
    );

    update public.territories
    set owner_id = p_player_id,
        clan_id = p_clan_id,
        captured_at = p_now,
        influence_points = challenger_influence,
        total_distance_meters = next_distance,
        level = next_level,
        shield_until = next_shield_until,
        status = 'protected',
        season_id = current_season_id,
        color = coalesce((select color from public.clans where id = p_clan_id), '#39E58C'),
        updated_at = p_now
    where h3_index = p_h3_index
    returning * into updated_territory;

    update public.territory_player_influence
    set influence_points = case when player_id = p_player_id then challenger_influence else 0 end
    where territory_h3_index = p_h3_index;

    insert into public.notifications (player_id, kind, title, body, payload)
    values (
      p_player_id,
      'territory_won',
      'Territory conquered',
      'Your ride captured a territory.',
      jsonb_build_object('h3Index', p_h3_index, 'level', next_level)
    );

    if current_territory.owner_id is not null then
      insert into public.notifications (player_id, kind, title, body, payload)
      values (
        current_territory.owner_id,
        'territory_lost',
        'Territory lost',
        'Another rider overcame your influence.',
        jsonb_build_object('h3Index', p_h3_index, 'newOwnerId', p_player_id)
      );
    end if;

    update public.player_profiles
    set stats = jsonb_set(
          stats,
          '{conquests}',
          to_jsonb(coalesce((stats ->> 'conquests')::integer, 0) + 1)
        )
    where id = p_player_id;

    return updated_territory;
  end if;

  update public.territories
  set status = 'contested',
      updated_at = p_now
  where h3_index = p_h3_index
  returning * into updated_territory;

  insert into public.notifications (player_id, kind, title, body, payload)
  select owner_id,
         'territory_attacked',
         'Territory under attack',
         'A rider is building influence in your territory.',
         jsonb_build_object(
           'h3Index', p_h3_index,
           'challengerId', p_player_id,
           'challengerInfluence', challenger_influence,
           'ownerInfluence', owner_influence
         )
  from public.territories
  where h3_index = p_h3_index
    and owner_id is not null
    and owner_id <> p_player_id;

  return updated_territory;
end;
$$;

create or replace function public.decay_territory_influence(
  p_decay_points_per_hour integer,
  p_now timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_count integer;
begin
  with decayed as (
    select
      h3_index,
      greatest(
        0,
        influence_points - floor(
          greatest(extract(epoch from (p_now - last_decay_at)), 0) / 3600
          * greatest(p_decay_points_per_hour, 0)
        )::integer
      ) as next_influence
    from public.territories
    where owner_id is not null
      and p_now > last_decay_at
  )
  update public.territories t
  set influence_points = d.next_influence,
      status = case
        when t.shield_until is not null and t.shield_until > p_now then 'protected'::public.territory_status
        when d.next_influence = 0 then 'vulnerable'::public.territory_status
        else t.status
      end,
      last_decay_at = p_now,
      updated_at = p_now
  from decayed d
  where t.h3_index = d.h3_index
    and t.influence_points <> d.next_influence;

  get diagnostics changed_count = row_count;

  update public.territory_player_influence
  set influence_points = greatest(influence_points - greatest(p_decay_points_per_hour, 0), 0),
      updated_at = p_now
  where influence_points > 0;

  return changed_count;
end;
$$;

drop view if exists public.v_public_territory_map;

create view public.v_public_territory_map as
select
  t.h3_index,
  t.owner_id,
  p.display_name as owner_name,
  t.clan_id,
  c.name as clan_name,
  c.color as clan_color,
  t.influence_points,
  t.level,
  lr.name as level_name,
  t.total_distance_meters,
  lr.required_distance_meters,
  (
    select next_rule.required_distance_meters
    from public.territory_level_rules next_rule
    where next_rule.level = t.level + 1
  ) as next_level_distance_meters,
  t.shield_until,
  coalesce(greatest(0, extract(epoch from (t.shield_until - now())))::integer, 0) as shield_seconds_remaining,
  t.status,
  t.season_id,
  t.updated_at
from public.territories t
left join public.player_profiles p on p.id = t.owner_id
left join public.clans c on c.id = t.clan_id
left join public.territory_level_rules lr on lr.level = t.level;

alter publication supabase_realtime add table public.territory_player_influence;

revoke execute on function public.decay_territory_influence(integer, timestamptz) from public, anon, authenticated;
grant execute on function public.decay_territory_influence(integer, timestamptz) to service_role;
