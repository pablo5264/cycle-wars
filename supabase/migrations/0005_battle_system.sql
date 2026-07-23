alter table public.battle_participants
  add column if not exists level_at_start integer not null default 1 check (level_at_start >= 1),
  add column if not exists resistance_score numeric(8, 2) not null default 0 check (resistance_score >= 0),
  add column if not exists history_score numeric(8, 2) not null default 0 check (history_score >= 0),
  add column if not exists velocity_score numeric(8, 2) not null default 0 check (velocity_score >= 0),
  add column if not exists last_pulse_at timestamptz;

create table public.battle_results (
  battle_id uuid primary key references public.battles(id) on delete cascade,
  winner_id uuid not null references public.player_profiles(id) on delete cascade,
  resolved_at timestamptz not null default now(),
  participant_count integer not null check (participant_count > 0),
  scorecard jsonb not null,
  elo_delta jsonb not null default '{}'::jsonb
);

alter table public.battle_results enable row level security;

create policy "players can read battle results"
on public.battle_results for select
to authenticated
using (true);

create index battle_results_winner_idx on public.battle_results(winner_id, resolved_at desc);
create index battle_participants_score_idx on public.battle_participants(battle_id, score desc);

create or replace function public.battle_score(
  p_distance_meters numeric,
  p_level integer,
  p_resistance_score numeric,
  p_history_score numeric,
  p_speed_kmh numeric,
  p_time_in_territory_seconds integer
)
returns numeric
language sql
immutable
as $$
  select round((
    greatest(p_distance_meters, 0) * 1.00
    + greatest(p_level, 1) * 35.00
    + greatest(p_resistance_score, 0) * 0.85
    + greatest(p_history_score, 0) * 0.65
    + least(greatest(p_speed_kmh, 0), 65) * 7.00
    + greatest(p_time_in_territory_seconds, 0) * 0.45
  )::numeric, 2)
$$;

create or replace function public.upsert_battle_participant_pulse(
  p_battle_id uuid,
  p_player_id uuid,
  p_clan_id uuid,
  p_distance_meters numeric,
  p_speed_kmh numeric,
  p_time_in_territory_seconds integer,
  p_now timestamptz
)
returns public.battle_participants
language plpgsql
security definer
set search_path = public
as $$
declare
  player_level integer;
  player_wins integer;
  player_losses integer;
  resistance numeric;
  history numeric;
  next_score numeric;
  row_value public.battle_participants;
begin
  select level,
         coalesce((stats ->> 'wins')::integer, 0),
         coalesce((stats ->> 'losses')::integer, 0)
  into player_level, player_wins, player_losses
  from public.player_profiles
  where id = p_player_id;

  player_level := coalesce(player_level, 1);
  resistance := greatest(0, player_level * 10 + greatest(p_time_in_territory_seconds, 0) * 0.15);
  history := greatest(0, player_wins * 12 - player_losses * 6);
  next_score := public.battle_score(
    p_distance_meters,
    player_level,
    resistance,
    history,
    p_speed_kmh,
    p_time_in_territory_seconds
  );

  insert into public.battle_participants (
    battle_id,
    player_id,
    clan_id,
    score,
    distance_meters,
    time_in_territory_seconds,
    average_speed_kmh,
    level_at_start,
    resistance_score,
    history_score,
    velocity_score,
    last_pulse_at
  )
  values (
    p_battle_id,
    p_player_id,
    p_clan_id,
    next_score,
    p_distance_meters,
    p_time_in_territory_seconds,
    p_speed_kmh,
    player_level,
    resistance,
    history,
    least(greatest(p_speed_kmh, 0), 65) * 7,
    p_now
  )
  on conflict (battle_id, player_id) do update
  set clan_id = excluded.clan_id,
      distance_meters = public.battle_participants.distance_meters + excluded.distance_meters,
      time_in_territory_seconds = greatest(public.battle_participants.time_in_territory_seconds, excluded.time_in_territory_seconds),
      average_speed_kmh = case
        when public.battle_participants.average_speed_kmh = 0 then excluded.average_speed_kmh
        else round(((public.battle_participants.average_speed_kmh + excluded.average_speed_kmh) / 2)::numeric, 2)
      end,
      level_at_start = greatest(public.battle_participants.level_at_start, excluded.level_at_start),
      resistance_score = excluded.resistance_score,
      history_score = excluded.history_score,
      velocity_score = excluded.velocity_score,
      score = public.battle_score(
        public.battle_participants.distance_meters + excluded.distance_meters,
        greatest(public.battle_participants.level_at_start, excluded.level_at_start),
        excluded.resistance_score,
        excluded.history_score,
        excluded.average_speed_kmh,
        greatest(public.battle_participants.time_in_territory_seconds, excluded.time_in_territory_seconds)
      ),
      last_pulse_at = excluded.last_pulse_at
  returning * into row_value;

  update public.battles
  set status = 'active',
      metrics = coalesce(metrics, '{}'::jsonb) || jsonb_build_object('lastPulseAt', p_now)
  where id = p_battle_id
    and status in ('pending', 'active');

  return row_value;
end;
$$;

create or replace function public.resolve_battle(
  p_battle_id uuid,
  p_now timestamptz
)
returns public.battles
language plpgsql
security definer
set search_path = public
as $$
declare
  winner uuid;
  battle_row public.battles;
  scorecard jsonb;
  participant_count integer;
begin
  select player_id
  into winner
  from public.battle_participants
  where battle_id = p_battle_id
  order by score desc, distance_meters desc, time_in_territory_seconds desc, joined_at asc
  limit 1;

  if winner is null then
    raise exception 'Battle has no participants';
  end if;

  select count(*),
         jsonb_agg(
           jsonb_build_object(
             'playerId', player_id,
             'score', score,
             'distanceMeters', distance_meters,
             'level', level_at_start,
             'resistance', resistance_score,
             'history', history_score,
             'speed', average_speed_kmh,
             'timeInTerritorySeconds', time_in_territory_seconds
           )
           order by score desc
         )
  into participant_count, scorecard
  from public.battle_participants
  where battle_id = p_battle_id;

  update public.battles
  set status = 'resolved',
      ended_at = p_now,
      winner_id = winner,
      metrics = coalesce(metrics, '{}'::jsonb) || jsonb_build_object(
        'resolvedBy', 'server',
        'participantCount', participant_count,
        'scorecard', scorecard
      )
  where id = p_battle_id
    and status <> 'resolved'
  returning * into battle_row;

  if battle_row.id is null then
    select * into battle_row from public.battles where id = p_battle_id;
    return battle_row;
  end if;

  insert into public.battle_results (battle_id, winner_id, resolved_at, participant_count, scorecard, elo_delta)
  values (
    p_battle_id,
    winner,
    p_now,
    participant_count,
    coalesce(scorecard, '[]'::jsonb),
    jsonb_build_object('winner', 18, 'losers', -12)
  )
  on conflict (battle_id) do nothing;

  update public.player_league_ratings
  set elo = elo + case when player_id = winner then 18 else -12 end,
      peak_elo = greatest(peak_elo, elo + case when player_id = winner then 18 else -12 end),
      wins = wins + case when player_id = winner then 1 else 0 end,
      losses = losses + case when player_id = winner then 0 else 1 end,
      updated_at = p_now
  where player_id in (
    select player_id from public.battle_participants where battle_id = p_battle_id
  );

  update public.player_profiles
  set stats = jsonb_set(
        stats,
        case when id = winner then '{wins}' else '{losses}' end,
        to_jsonb(coalesce((stats ->> case when id = winner then 'wins' else 'losses' end)::integer, 0) + 1)
      )
  where id in (
    select player_id from public.battle_participants where battle_id = p_battle_id
  );

  insert into public.notifications (player_id, kind, title, body, payload)
  select
    player_id,
    'battle_result',
    case when player_id = winner then 'Battle won' else 'Battle lost' end,
    case when player_id = winner then 'You won the territory battle.' else 'Your rival won the territory battle.' end,
    jsonb_build_object('battleId', p_battle_id, 'winnerId', winner, 'scorecard', scorecard)
  from public.battle_participants
  where battle_id = p_battle_id;

  return battle_row;
end;
$$;

drop view if exists public.v_active_battles;

create view public.v_active_battles as
select
  b.id,
  b.territory_h3_index,
  b.season_id,
  b.status,
  b.started_at,
  b.ended_at,
  b.winner_id,
  count(bp.player_id) as participant_count,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'playerId', bp.player_id,
        'clanId', bp.clan_id,
        'score', bp.score,
        'distanceMeters', bp.distance_meters,
        'level', bp.level_at_start,
        'speedKmh', bp.average_speed_kmh,
        'timeInTerritorySeconds', bp.time_in_territory_seconds
      )
      order by bp.score desc
    ) filter (where bp.player_id is not null),
    '[]'::jsonb
  ) as participants
from public.battles b
left join public.battle_participants bp on bp.battle_id = b.id
where b.status in ('pending', 'active')
group by b.id;

revoke execute on function public.upsert_battle_participant_pulse(uuid, uuid, uuid, numeric, numeric, integer, timestamptz) from public, anon, authenticated;
grant execute on function public.upsert_battle_participant_pulse(uuid, uuid, uuid, numeric, numeric, integer, timestamptz) to service_role;

alter publication supabase_realtime add table public.battle_results;
