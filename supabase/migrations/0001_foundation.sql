create extension if not exists pgcrypto;
create extension if not exists postgis;

create type public.league_tier as enum (
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'master',
  'grand_master',
  'legend'
);

create type public.territory_status as enum (
  'neutral',
  'protected',
  'vulnerable',
  'contested'
);

create table public.player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  avatar_url text,
  biography text check (biography is null or char_length(biography) <= 240),
  city text,
  level integer not null default 1 check (level >= 1),
  experience bigint not null default 0 check (experience >= 0),
  clan_id uuid,
  league public.league_tier not null default 'bronze',
  stats jsonb not null default jsonb_build_object(
    'territories', 0,
    'totalSeconds', 0,
    'distanceMeters', 0,
    'averageSpeedKmh', 0,
    'elevationGainMeters', 0,
    'calories', 0,
    'conquests', 0,
    'defenses', 0,
    'wins', 0,
    'losses', 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.territories (
  h3_index text primary key,
  owner_id uuid references public.player_profiles(id) on delete set null,
  clan_id uuid,
  captured_at timestamptz,
  influence_points integer not null default 0 check (influence_points >= 0),
  level integer not null default 1 check (level between 1 and 5),
  shield_until timestamptz,
  color text not null default '#7A8794',
  status public.territory_status not null default 'neutral',
  season_id uuid,
  updated_at timestamptz not null default now()
);

create index territories_owner_id_idx on public.territories(owner_id);
create index territories_clan_id_idx on public.territories(clan_id);
create index territories_status_idx on public.territories(status);
create index territories_season_id_idx on public.territories(season_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger player_profiles_set_updated_at
before update on public.player_profiles
for each row execute function public.set_updated_at();

create trigger territories_set_updated_at
before update on public.territories
for each row execute function public.set_updated_at();

alter table public.player_profiles enable row level security;
alter table public.territories enable row level security;

create policy "players can read public profiles"
on public.player_profiles for select
to authenticated, anon
using (true);

create policy "players can update own profile"
on public.player_profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "players can read territories"
on public.territories for select
to authenticated, anon
using (true);

create publication supabase_realtime for table public.territories;
