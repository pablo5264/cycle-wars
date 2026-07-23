create table public.clan_governance_audit (
  id bigint generated always as identity primary key,
  clan_id uuid not null references public.clans(id) on delete cascade,
  actor_id uuid not null references public.player_profiles(id) on delete cascade,
  target_player_id uuid not null references public.player_profiles(id) on delete cascade,
  action text not null check (action in ('set_role', 'remove_member')),
  previous_role public.clan_role,
  next_role public.clan_role,
  reason text,
  created_at timestamptz not null default now()
);

create index clan_governance_audit_clan_time_idx
on public.clan_governance_audit(clan_id, created_at desc);

create index clan_governance_audit_target_time_idx
on public.clan_governance_audit(target_player_id, created_at desc);

alter table public.clan_governance_audit enable row level security;

create policy "clan members can read governance audit"
on public.clan_governance_audit for select
to authenticated
using (
  exists (
    select 1
    from public.clan_memberships cm
    where cm.clan_id = clan_governance_audit.clan_id
      and cm.player_id = auth.uid()
  )
);

create or replace function public.clan_role_rank(p_role public.clan_role)
returns integer
language sql
immutable
as $$
  select case p_role
    when 'leader' then 5
    when 'captain' then 4
    when 'veteran' then 3
    when 'member' then 2
    when 'recruit' then 1
  end;
$$;

create or replace function public.set_clan_member_role(
  p_actor_id uuid,
  p_target_player_id uuid,
  p_next_role public.clan_role,
  p_reason text default null
)
returns public.clan_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_membership public.clan_memberships;
  target_membership public.clan_memberships;
  updated_membership public.clan_memberships;
begin
  if p_next_role = 'leader' then
    raise exception 'Leader transfer is not supported by this endpoint';
  end if;

  select * into actor_membership
  from public.clan_memberships
  where player_id = p_actor_id;

  if actor_membership.player_id is null then
    raise exception 'Actor is not in a clan';
  end if;

  select * into target_membership
  from public.clan_memberships
  where player_id = p_target_player_id
    and clan_id = actor_membership.clan_id;

  if target_membership.player_id is null then
    raise exception 'Target is not in actor clan';
  end if;

  if p_actor_id = p_target_player_id then
    raise exception 'Actors cannot change their own role';
  end if;

  if actor_membership.role not in ('leader', 'captain') then
    raise exception 'Insufficient clan permissions';
  end if;

  if actor_membership.role = 'captain'
     and public.clan_role_rank(target_membership.role) >= public.clan_role_rank('captain') then
    raise exception 'Captains cannot manage leaders or captains';
  end if;

  if actor_membership.role = 'captain'
     and public.clan_role_rank(p_next_role) >= public.clan_role_rank('captain') then
    raise exception 'Captains cannot promote members to captain or leader';
  end if;

  update public.clan_memberships
  set role = p_next_role
  where clan_id = actor_membership.clan_id
    and player_id = p_target_player_id
  returning * into updated_membership;

  insert into public.clan_governance_audit (
    clan_id,
    actor_id,
    target_player_id,
    action,
    previous_role,
    next_role,
    reason
  )
  values (
    actor_membership.clan_id,
    p_actor_id,
    p_target_player_id,
    'set_role',
    target_membership.role,
    p_next_role,
    p_reason
  );

  return updated_membership;
end;
$$;

create or replace function public.remove_clan_member(
  p_actor_id uuid,
  p_target_player_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_membership public.clan_memberships;
  target_membership public.clan_memberships;
begin
  select * into actor_membership
  from public.clan_memberships
  where player_id = p_actor_id;

  if actor_membership.player_id is null then
    raise exception 'Actor is not in a clan';
  end if;

  select * into target_membership
  from public.clan_memberships
  where player_id = p_target_player_id
    and clan_id = actor_membership.clan_id;

  if target_membership.player_id is null then
    raise exception 'Target is not in actor clan';
  end if;

  if p_actor_id = p_target_player_id then
    raise exception 'Actors cannot remove themselves';
  end if;

  if actor_membership.role not in ('leader', 'captain') then
    raise exception 'Insufficient clan permissions';
  end if;

  if actor_membership.role = 'captain'
     and public.clan_role_rank(target_membership.role) >= public.clan_role_rank('captain') then
    raise exception 'Captains cannot remove leaders or captains';
  end if;

  delete from public.clan_memberships
  where clan_id = actor_membership.clan_id
    and player_id = p_target_player_id;

  update public.player_profiles
  set clan_id = null
  where id = p_target_player_id
    and clan_id = actor_membership.clan_id;

  insert into public.clan_governance_audit (
    clan_id,
    actor_id,
    target_player_id,
    action,
    previous_role,
    next_role,
    reason
  )
  values (
    actor_membership.clan_id,
    p_actor_id,
    p_target_player_id,
    'remove_member',
    target_membership.role,
    null,
    p_reason
  );
end;
$$;

revoke execute on function public.clan_role_rank(public.clan_role) from public, anon, authenticated;
revoke execute on function public.set_clan_member_role(uuid, uuid, public.clan_role, text) from public, anon, authenticated;
revoke execute on function public.remove_clan_member(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.clan_role_rank(public.clan_role) to service_role;
grant execute on function public.set_clan_member_role(uuid, uuid, public.clan_role, text) to service_role;
grant execute on function public.remove_clan_member(uuid, uuid, text) to service_role;
