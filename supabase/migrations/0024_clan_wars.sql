create table public.clan_wars (
  id uuid primary key default gen_random_uuid(),
  declarer_clan_id uuid not null references public.clans(id) on delete cascade,
  target_clan_id uuid not null references public.clans(id) on delete cascade,
  declared_by uuid not null references public.player_profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended', 'cancelled')),
  reason text check (reason is null or char_length(reason) <= 280),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '7 days'),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (declarer_clan_id <> target_clan_id),
  check (ends_at > starts_at)
);

create unique index clan_wars_active_pair_idx
on public.clan_wars(
  least(declarer_clan_id::text, target_clan_id::text),
  greatest(declarer_clan_id::text, target_clan_id::text)
)
where status = 'active';

create index clan_wars_declarer_time_idx
on public.clan_wars(declarer_clan_id, created_at desc);

create index clan_wars_target_time_idx
on public.clan_wars(target_clan_id, created_at desc);

alter table public.clan_wars enable row level security;

create policy "clan members can read clan wars"
on public.clan_wars for select
to authenticated
using (
  exists (
    select 1
    from public.clan_memberships cm
    where cm.player_id = auth.uid()
      and cm.clan_id in (clan_wars.declarer_clan_id, clan_wars.target_clan_id)
  )
);

create or replace view public.v_clan_wars as
select
  war.id,
  war.declarer_clan_id,
  declarer.name as declarer_clan_name,
  declarer.color as declarer_clan_color,
  war.target_clan_id,
  target.name as target_clan_name,
  target.color as target_clan_color,
  war.declared_by,
  actor.display_name as declared_by_name,
  war.status,
  war.reason,
  war.starts_at,
  war.ends_at,
  war.ended_at,
  war.created_at
from public.clan_wars war
join public.clans declarer on declarer.id = war.declarer_clan_id
join public.clans target on target.id = war.target_clan_id
join public.player_profiles actor on actor.id = war.declared_by;

revoke all on public.v_clan_wars from public;
revoke all on public.v_clan_wars from anon;
revoke all on public.v_clan_wars from authenticated;
grant select on public.v_clan_wars to service_role;

create or replace function public.declare_clan_war(
  p_actor_id uuid,
  p_target_clan_id uuid,
  p_reason text default null
)
returns public.clan_wars
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_membership public.clan_memberships;
  target_clan public.clans;
  created_war public.clan_wars;
begin
  select * into actor_membership
  from public.clan_memberships
  where player_id = p_actor_id;

  if actor_membership.player_id is null then
    raise exception 'Actor is not in a clan';
  end if;

  if actor_membership.role not in ('leader', 'captain') then
    raise exception 'Insufficient clan permissions';
  end if;

  if actor_membership.clan_id = p_target_clan_id then
    raise exception 'Clans cannot declare war on themselves';
  end if;

  select * into target_clan
  from public.clans
  where id = p_target_clan_id;

  if target_clan.id is null then
    raise exception 'Target clan does not exist';
  end if;

  insert into public.clan_wars (
    declarer_clan_id,
    target_clan_id,
    declared_by,
    reason
  )
  values (
    actor_membership.clan_id,
    p_target_clan_id,
    p_actor_id,
    nullif(trim(p_reason), '')
  )
  returning * into created_war;

  insert into public.notifications (
    player_id,
    kind,
    title,
    body,
    payload
  )
  select
    cm.player_id,
    'clan_war',
    'Clan en guerra',
    'Tu clan recibio una declaracion de guerra.',
    jsonb_build_object('warId', created_war.id, 'declarerClanId', actor_membership.clan_id)
  from public.clan_memberships cm
  where cm.clan_id = p_target_clan_id;

  return created_war;
end;
$$;

create or replace function public.end_clan_war(
  p_actor_id uuid,
  p_war_id uuid,
  p_reason text default null
)
returns public.clan_wars
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_membership public.clan_memberships;
  war_row public.clan_wars;
begin
  select * into war_row
  from public.clan_wars
  where id = p_war_id
  for update;

  if war_row.id is null then
    raise exception 'Clan war not found';
  end if;

  if war_row.status <> 'active' then
    raise exception 'Clan war is not active';
  end if;

  select * into actor_membership
  from public.clan_memberships
  where player_id = p_actor_id
    and clan_id in (war_row.declarer_clan_id, war_row.target_clan_id);

  if actor_membership.player_id is null or actor_membership.role not in ('leader', 'captain') then
    raise exception 'Insufficient clan permissions';
  end if;

  update public.clan_wars
  set status = 'ended',
      reason = coalesce(nullif(trim(p_reason), ''), reason),
      ended_at = now()
  where id = p_war_id
  returning * into war_row;

  return war_row;
end;
$$;

revoke execute on function public.declare_clan_war(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.end_clan_war(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.declare_clan_war(uuid, uuid, text) to service_role;
grant execute on function public.end_clan_war(uuid, uuid, text) to service_role;
