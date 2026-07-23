create type public.clan_role as enum ('leader', 'captain', 'veteran', 'member', 'recruit');
create type public.clan_join_policy as enum ('open', 'approval_required', 'invite_only');
create type public.season_status as enum ('scheduled', 'active', 'completed', 'archived');
create type public.activity_status as enum ('recording', 'processing', 'valid', 'quarantined', 'rejected');
create type public.gps_sample_status as enum ('trusted', 'suspicious', 'rejected');
create type public.battle_status as enum ('pending', 'active', 'resolved', 'cancelled');
create type public.friendship_status as enum ('pending', 'accepted', 'blocked');
create type public.feed_visibility as enum ('public', 'friends', 'clan', 'private');
create type public.notification_kind as enum (
  'territory_lost',
  'territory_won',
  'territory_attacked',
  'clan_war',
  'achievement_unlocked',
  'event_started',
  'battle_result',
  'friend_request'
);
create type public.currency_kind as enum ('coins', 'crystals');
create type public.inventory_item_kind as enum ('skin', 'theme', 'animation', 'emblem', 'frame', 'virtual_bike', 'flag', 'avatar');
create type public.achievement_visibility as enum ('public', 'hidden', 'secret');
create type public.anti_cheat_signal_kind as enum (
  'fake_gps',
  'teleport',
  'root',
  'jailbreak',
  'impossible_speed',
  'vehicle_profile',
  'route_duplication',
  'clock_tampering',
  'spoofing'
);
create type public.audit_action_kind as enum ('create', 'update', 'delete', 'login', 'game_state_change', 'moderation');

create table public.clans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 3 and 32),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,40}$'),
  description text check (description is null or char_length(description) <= 280),
  emblem_url text,
  color text not null default '#39E58C',
  city text,
  country_code char(2),
  join_policy public.clan_join_policy not null default 'approval_required',
  max_members integer not null default 50 check (max_members between 2 and 250),
  leader_id uuid references public.player_profiles(id) on delete set null,
  experience bigint not null default 0 check (experience >= 0),
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clan_memberships (
  clan_id uuid not null references public.clans(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  role public.clan_role not null default 'recruit',
  joined_at timestamptz not null default now(),
  contribution_points bigint not null default 0 check (contribution_points >= 0),
  primary key (clan_id, player_id)
);

alter table public.player_profiles
  add constraint player_profiles_clan_id_fkey
  foreign key (clan_id) references public.clans(id) on delete set null;

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.season_status not null default 'scheduled',
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table public.territories
  add constraint territories_season_id_fkey
  foreign key (season_id) references public.seasons(id) on delete set null,
  add constraint territories_clan_id_fkey
  foreign key (clan_id) references public.clans(id) on delete set null;

create table public.player_league_ratings (
  player_id uuid primary key references public.player_profiles(id) on delete cascade,
  league public.league_tier not null default 'bronze',
  elo integer not null default 1000 check (elo >= 0),
  peak_elo integer not null default 1000 check (peak_elo >= 0),
  wins integer not null default 0 check (wins >= 0),
  losses integer not null default 0 check (losses >= 0),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  status public.activity_status not null default 'recording',
  started_at timestamptz not null,
  ended_at timestamptz,
  distance_meters numeric(12, 2) not null default 0 check (distance_meters >= 0),
  moving_seconds integer not null default 0 check (moving_seconds >= 0),
  elevation_gain_meters numeric(10, 2) not null default 0 check (elevation_gain_meters >= 0),
  average_speed_kmh numeric(6, 2) not null default 0 check (average_speed_kmh >= 0),
  max_speed_kmh numeric(6, 2) not null default 0 check (max_speed_kmh >= 0),
  calories integer not null default 0 check (calories >= 0),
  polyline text,
  route_hash text,
  source text not null default 'mobile',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);

create table public.gps_samples (
  id bigint generated always as identity primary key,
  activity_id uuid not null references public.activities(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  recorded_at timestamptz not null,
  location geography(point, 4326) not null,
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  altitude_meters numeric(8, 2),
  accuracy_meters numeric(8, 2) not null check (accuracy_meters >= 0),
  speed_kmh numeric(6, 2) not null default 0 check (speed_kmh >= 0),
  heading_degrees numeric(5, 2) check (heading_degrees is null or heading_degrees between 0 and 360),
  h3_index text not null,
  status public.gps_sample_status not null default 'trusted',
  trust_score numeric(5, 2) not null default 100 check (trust_score between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.activity_exports (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  format text not null check (format in ('gpx', 'fit', 'csv')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table public.territory_influence_events (
  id bigint generated always as identity primary key,
  territory_h3_index text not null references public.territories(h3_index) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  clan_id uuid references public.clans(id) on delete set null,
  season_id uuid references public.seasons(id) on delete set null,
  influence_delta integer not null,
  distance_meters numeric(10, 2) not null default 0 check (distance_meters >= 0),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table public.territory_ownership_history (
  id bigint generated always as identity primary key,
  territory_h3_index text not null references public.territories(h3_index) on delete cascade,
  previous_owner_id uuid references public.player_profiles(id) on delete set null,
  new_owner_id uuid references public.player_profiles(id) on delete set null,
  previous_clan_id uuid references public.clans(id) on delete set null,
  new_clan_id uuid references public.clans(id) on delete set null,
  season_id uuid references public.seasons(id) on delete set null,
  changed_at timestamptz not null default now(),
  reason text not null default 'conquest'
);

create table public.admin_regions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.admin_regions(id) on delete cascade,
  kind text not null check (kind in ('neighborhood', 'commune', 'city', 'province', 'region', 'country')),
  name text not null,
  country_code char(2),
  geometry geometry(multipolygon, 4326),
  created_at timestamptz not null default now()
);

create table public.region_hexes (
  region_id uuid not null references public.admin_regions(id) on delete cascade,
  h3_index text not null references public.territories(h3_index) on delete cascade,
  primary key (region_id, h3_index)
);

create table public.region_control_snapshots (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.admin_regions(id) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  controller_player_id uuid references public.player_profiles(id) on delete set null,
  controller_clan_id uuid references public.clans(id) on delete set null,
  controlled_hexes integer not null default 0 check (controlled_hexes >= 0),
  total_hexes integer not null check (total_hexes >= 0),
  captured_at timestamptz not null default now()
);

create table public.battles (
  id uuid primary key default gen_random_uuid(),
  territory_h3_index text not null references public.territories(h3_index) on delete cascade,
  season_id uuid references public.seasons(id) on delete set null,
  status public.battle_status not null default 'pending',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  winner_id uuid references public.player_profiles(id) on delete set null,
  metrics jsonb not null default '{}'::jsonb,
  check (ended_at is null or ended_at >= started_at)
);

create table public.battle_participants (
  battle_id uuid not null references public.battles(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  clan_id uuid references public.clans(id) on delete set null,
  score numeric(12, 2) not null default 0 check (score >= 0),
  distance_meters numeric(10, 2) not null default 0 check (distance_meters >= 0),
  time_in_territory_seconds integer not null default 0 check (time_in_territory_seconds >= 0),
  average_speed_kmh numeric(6, 2) not null default 0 check (average_speed_kmh >= 0),
  joined_at timestamptz not null default now(),
  primary key (battle_id, player_id)
);

create table public.friendships (
  requester_id uuid not null references public.player_profiles(id) on delete cascade,
  addressee_id uuid not null references public.player_profiles(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table public.follows (
  follower_id uuid not null references public.player_profiles(id) on delete cascade,
  followed_id uuid not null references public.player_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.player_profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  territory_h3_index text references public.territories(h3_index) on delete set null,
  visibility public.feed_visibility not null default 'public',
  body text check (body is null or char_length(body) <= 800),
  media_paths text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.feed_likes (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, player_id)
);

create table public.feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  author_id uuid not null references public.player_profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid references public.clans(id) on delete cascade,
  is_group boolean not null default false,
  title text check (title is null or char_length(title) <= 80),
  created_at timestamptz not null default now()
);

create table public.chat_thread_members (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (thread_id, player_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.player_profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  scope text not null check (scope in ('daily', 'weekly', 'monthly', 'global')),
  objectives jsonb not null default '[]'::jsonb,
  rewards jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.event_progress (
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (event_id, player_id)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]{3,80}$'),
  name text not null,
  description text not null,
  visibility public.achievement_visibility not null default 'public',
  criteria jsonb not null,
  reward jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.player_achievements (
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  progress jsonb not null default '{}'::jsonb,
  primary key (player_id, achievement_id)
);

create table public.wallets (
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  currency public.currency_kind not null,
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now(),
  primary key (player_id, currency)
);

create table public.shop_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]{3,80}$'),
  kind public.inventory_item_kind not null,
  name text not null,
  description text,
  price_currency public.currency_kind not null,
  price_amount integer not null check (price_amount >= 0),
  asset_path text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.player_inventory (
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  item_id uuid not null references public.shop_items(id) on delete restrict,
  acquired_at timestamptz not null default now(),
  equipped_at timestamptz,
  primary key (player_id, item_id)
);

create table public.economy_ledger (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  currency public.currency_kind not null,
  amount bigint not null,
  reason text not null,
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create table public.anti_cheat_signals (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  signal public.anti_cheat_signal_kind not null,
  severity integer not null check (severity between 1 and 5),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.player_profiles(id) on delete set null,
  action public.audit_action_kind not null,
  entity_name text not null,
  entity_id text,
  before_state jsonb,
  after_state jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index clans_leader_id_idx on public.clans(leader_id);
create index clan_memberships_player_id_idx on public.clan_memberships(player_id);
create index seasons_status_starts_at_idx on public.seasons(status, starts_at);
create index activities_player_started_idx on public.activities(player_id, started_at desc);
create index activities_season_status_idx on public.activities(season_id, status);
create index gps_samples_activity_recorded_idx on public.gps_samples(activity_id, recorded_at);
create index gps_samples_player_recorded_idx on public.gps_samples(player_id, recorded_at desc);
create index gps_samples_h3_idx on public.gps_samples(h3_index);
create index gps_samples_location_gix on public.gps_samples using gist(location);
create index territory_influence_territory_time_idx on public.territory_influence_events(territory_h3_index, occurred_at desc);
create index territory_influence_player_time_idx on public.territory_influence_events(player_id, occurred_at desc);
create index territory_history_territory_time_idx on public.territory_ownership_history(territory_h3_index, changed_at desc);
create index admin_regions_geometry_gix on public.admin_regions using gist(geometry);
create index region_hexes_h3_idx on public.region_hexes(h3_index);
create index battles_territory_status_idx on public.battles(territory_h3_index, status);
create index battle_participants_player_idx on public.battle_participants(player_id);
create index friendships_addressee_status_idx on public.friendships(addressee_id, status);
create index follows_followed_id_idx on public.follows(followed_id);
create index feed_posts_author_created_idx on public.feed_posts(author_id, created_at desc);
create index feed_posts_visibility_created_idx on public.feed_posts(visibility, created_at desc);
create index feed_comments_post_created_idx on public.feed_comments(post_id, created_at);
create index chat_messages_thread_created_idx on public.chat_messages(thread_id, created_at desc);
create index notifications_player_unread_idx on public.notifications(player_id, created_at desc) where read_at is null;
create index event_progress_player_idx on public.event_progress(player_id);
create index player_achievements_achievement_idx on public.player_achievements(achievement_id);
create index economy_ledger_player_time_idx on public.economy_ledger(player_id, created_at desc);
create index anti_cheat_player_time_idx on public.anti_cheat_signals(player_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_name, entity_id);

create trigger clans_set_updated_at
before update on public.clans
for each row execute function public.set_updated_at();

create trigger player_league_ratings_set_updated_at
before update on public.player_league_ratings
for each row execute function public.set_updated_at();

create trigger activities_set_updated_at
before update on public.activities
for each row execute function public.set_updated_at();

create trigger friendships_set_updated_at
before update on public.friendships
for each row execute function public.set_updated_at();

create trigger feed_posts_set_updated_at
before update on public.feed_posts
for each row execute function public.set_updated_at();

create trigger feed_comments_set_updated_at
before update on public.feed_comments
for each row execute function public.set_updated_at();

create trigger event_progress_set_updated_at
before update on public.event_progress
for each row execute function public.set_updated_at();

create trigger wallets_set_updated_at
before update on public.wallets
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'Rider'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.player_league_ratings (player_id)
  values (new.id)
  on conflict (player_id) do nothing;

  insert into public.wallets (player_id, currency, balance)
  values (new.id, 'coins', 0), (new.id, 'crystals', 0)
  on conflict (player_id, currency) do nothing;

  return new;
end;
$$;

create trigger auth_users_create_player_profile
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create materialized view public.mv_clan_rankings as
select
  c.id as clan_id,
  c.name,
  c.slug,
  c.color,
  count(distinct cm.player_id) as member_count,
  count(distinct t.h3_index) as territory_count,
  coalesce(sum(t.influence_points), 0) as total_influence,
  c.experience,
  c.level
from public.clans c
left join public.clan_memberships cm on cm.clan_id = c.id
left join public.territories t on t.clan_id = c.id
group by c.id;

create unique index mv_clan_rankings_clan_id_idx on public.mv_clan_rankings(clan_id);
create index mv_clan_rankings_score_idx on public.mv_clan_rankings(territory_count desc, total_influence desc);

create materialized view public.mv_player_rankings as
select
  p.id as player_id,
  p.display_name,
  p.avatar_url,
  p.level,
  p.experience,
  p.league,
  coalesce(l.elo, 1000) as elo,
  count(distinct t.h3_index) as territory_count,
  coalesce(sum(t.influence_points), 0) as total_influence
from public.player_profiles p
left join public.player_league_ratings l on l.player_id = p.id
left join public.territories t on t.owner_id = p.id
group by p.id, l.elo;

create unique index mv_player_rankings_player_id_idx on public.mv_player_rankings(player_id);
create index mv_player_rankings_score_idx on public.mv_player_rankings(territory_count desc, elo desc, total_influence desc);

create view public.v_active_battles as
select
  b.id,
  b.territory_h3_index,
  b.season_id,
  b.started_at,
  count(bp.player_id) as participant_count
from public.battles b
left join public.battle_participants bp on bp.battle_id = b.id
where b.status = 'active'
group by b.id;

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
  t.shield_until,
  t.status,
  t.season_id,
  t.updated_at
from public.territories t
left join public.player_profiles p on p.id = t.owner_id
left join public.clans c on c.id = t.clan_id;

alter table public.clans enable row level security;
alter table public.clan_memberships enable row level security;
alter table public.seasons enable row level security;
alter table public.player_league_ratings enable row level security;
alter table public.activities enable row level security;
alter table public.gps_samples enable row level security;
alter table public.activity_exports enable row level security;
alter table public.territory_influence_events enable row level security;
alter table public.territory_ownership_history enable row level security;
alter table public.admin_regions enable row level security;
alter table public.region_hexes enable row level security;
alter table public.region_control_snapshots enable row level security;
alter table public.battles enable row level security;
alter table public.battle_participants enable row level security;
alter table public.friendships enable row level security;
alter table public.follows enable row level security;
alter table public.feed_posts enable row level security;
alter table public.feed_likes enable row level security;
alter table public.feed_comments enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_thread_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.events enable row level security;
alter table public.event_progress enable row level security;
alter table public.achievements enable row level security;
alter table public.player_achievements enable row level security;
alter table public.wallets enable row level security;
alter table public.shop_items enable row level security;
alter table public.player_inventory enable row level security;
alter table public.economy_ledger enable row level security;
alter table public.anti_cheat_signals enable row level security;
alter table public.audit_logs enable row level security;

create policy "public can read clans"
on public.clans for select
to authenticated, anon
using (true);

create policy "members can read clan memberships"
on public.clan_memberships for select
to authenticated, anon
using (true);

create policy "players can read seasons"
on public.seasons for select
to authenticated, anon
using (true);

create policy "players can read ratings"
on public.player_league_ratings for select
to authenticated, anon
using (true);

create policy "players can read own activities"
on public.activities for select
to authenticated
using (player_id = auth.uid());

create policy "players can create own activities"
on public.activities for insert
to authenticated
with check (player_id = auth.uid());

create policy "players can update own recording activities"
on public.activities for update
to authenticated
using (player_id = auth.uid() and status in ('recording', 'processing'))
with check (player_id = auth.uid());

create policy "players can read own gps samples"
on public.gps_samples for select
to authenticated
using (player_id = auth.uid());

create policy "players can insert own gps samples"
on public.gps_samples for insert
to authenticated
with check (player_id = auth.uid());

create policy "players can read own exports"
on public.activity_exports for select
to authenticated
using (player_id = auth.uid());

create policy "players can read influence history"
on public.territory_influence_events for select
to authenticated
using (true);

create policy "players can read ownership history"
on public.territory_ownership_history for select
to authenticated, anon
using (true);

create policy "players can read admin regions"
on public.admin_regions for select
to authenticated, anon
using (true);

create policy "players can read region hexes"
on public.region_hexes for select
to authenticated, anon
using (true);

create policy "players can read region control"
on public.region_control_snapshots for select
to authenticated, anon
using (true);

create policy "players can read battles"
on public.battles for select
to authenticated
using (true);

create policy "players can read battle participants"
on public.battle_participants for select
to authenticated
using (true);

create policy "players can read own friendships"
on public.friendships for select
to authenticated
using (requester_id = auth.uid() or addressee_id = auth.uid());

create policy "players can request friendships"
on public.friendships for insert
to authenticated
with check (requester_id = auth.uid());

create policy "players can update addressed friendships"
on public.friendships for update
to authenticated
using (addressee_id = auth.uid() or requester_id = auth.uid())
with check (addressee_id = auth.uid() or requester_id = auth.uid());

create policy "players can read follows"
on public.follows for select
to authenticated
using (true);

create policy "players can create own follows"
on public.follows for insert
to authenticated
with check (follower_id = auth.uid());

create policy "players can delete own follows"
on public.follows for delete
to authenticated
using (follower_id = auth.uid());

create policy "players can read visible feed posts"
on public.feed_posts for select
to authenticated
using (
  visibility = 'public'
  or author_id = auth.uid()
  or (
    visibility = 'clan'
    and exists (
      select 1
      from public.clan_memberships own_membership
      join public.player_profiles author on author.clan_id = own_membership.clan_id
      where own_membership.player_id = auth.uid()
        and author.id = feed_posts.author_id
    )
  )
);

create policy "players can create own feed posts"
on public.feed_posts for insert
to authenticated
with check (author_id = auth.uid());

create policy "players can update own feed posts"
on public.feed_posts for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "players can read feed likes"
on public.feed_likes for select
to authenticated
using (true);

create policy "players can like as self"
on public.feed_likes for insert
to authenticated
with check (player_id = auth.uid());

create policy "players can remove own likes"
on public.feed_likes for delete
to authenticated
using (player_id = auth.uid());

create policy "players can read comments"
on public.feed_comments for select
to authenticated
using (true);

create policy "players can create own comments"
on public.feed_comments for insert
to authenticated
with check (author_id = auth.uid());

create policy "players can update own comments"
on public.feed_comments for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "members can read chat threads"
on public.chat_threads for select
to authenticated
using (
  exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = chat_threads.id
      and m.player_id = auth.uid()
  )
);

create policy "members can read chat membership"
on public.chat_thread_members for select
to authenticated
using (player_id = auth.uid());

create policy "members can read chat messages"
on public.chat_messages for select
to authenticated
using (
  exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = chat_messages.thread_id
      and m.player_id = auth.uid()
  )
);

create policy "members can send chat messages"
on public.chat_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.chat_thread_members m
    where m.thread_id = chat_messages.thread_id
      and m.player_id = auth.uid()
  )
);

create policy "players can read own notifications"
on public.notifications for select
to authenticated
using (player_id = auth.uid());

create policy "players can update own notifications"
on public.notifications for update
to authenticated
using (player_id = auth.uid())
with check (player_id = auth.uid());

create policy "players can read events"
on public.events for select
to authenticated, anon
using (true);

create policy "players can read own event progress"
on public.event_progress for select
to authenticated
using (player_id = auth.uid());

create policy "players can read public achievements"
on public.achievements for select
to authenticated, anon
using (visibility = 'public');

create policy "players can read own achievements"
on public.player_achievements for select
to authenticated
using (player_id = auth.uid());

create policy "players can read own wallets"
on public.wallets for select
to authenticated
using (player_id = auth.uid());

create policy "players can read active shop items"
on public.shop_items for select
to authenticated, anon
using (is_active);

create policy "players can read own inventory"
on public.player_inventory for select
to authenticated
using (player_id = auth.uid());

create policy "players can read own ledger"
on public.economy_ledger for select
to authenticated
using (player_id = auth.uid());

create policy "players can read own anti cheat signals"
on public.anti_cheat_signals for select
to authenticated
using (player_id = auth.uid());

alter publication supabase_realtime add table
  public.territory_influence_events,
  public.territory_ownership_history,
  public.battles,
  public.battle_participants,
  public.feed_posts,
  public.feed_likes,
  public.feed_comments,
  public.chat_messages,
  public.notifications;
