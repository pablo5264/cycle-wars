alter table public.clan_governance_audit
drop constraint if exists clan_governance_audit_action_check;

alter table public.clan_governance_audit
add constraint clan_governance_audit_action_check
check (action in ('set_role', 'remove_member', 'leave_clan', 'transfer_leadership'));

create or replace function public.leave_clan(
  p_actor_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_membership public.clan_memberships;
begin
  select * into actor_membership
  from public.clan_memberships
  where player_id = p_actor_id;

  if actor_membership.player_id is null then
    raise exception 'Actor is not in a clan';
  end if;

  if actor_membership.role = 'leader' then
    raise exception 'Leaders must transfer leadership before leaving';
  end if;

  delete from public.clan_memberships
  where clan_id = actor_membership.clan_id
    and player_id = p_actor_id;

  update public.player_profiles
  set clan_id = null
  where id = p_actor_id
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
    p_actor_id,
    'leave_clan',
    actor_membership.role,
    null,
    p_reason
  );
end;
$$;

create or replace function public.transfer_clan_leadership(
  p_actor_id uuid,
  p_target_player_id uuid,
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
  updated_target public.clan_memberships;
begin
  select * into actor_membership
  from public.clan_memberships
  where player_id = p_actor_id;

  if actor_membership.player_id is null then
    raise exception 'Actor is not in a clan';
  end if;

  if actor_membership.role <> 'leader' then
    raise exception 'Only leaders can transfer leadership';
  end if;

  if p_actor_id = p_target_player_id then
    raise exception 'Leaders cannot transfer leadership to themselves';
  end if;

  select * into target_membership
  from public.clan_memberships
  where player_id = p_target_player_id
    and clan_id = actor_membership.clan_id;

  if target_membership.player_id is null then
    raise exception 'Target is not in actor clan';
  end if;

  update public.clan_memberships
  set role = 'captain'
  where clan_id = actor_membership.clan_id
    and player_id = p_actor_id;

  update public.clan_memberships
  set role = 'leader'
  where clan_id = actor_membership.clan_id
    and player_id = p_target_player_id
  returning * into updated_target;

  update public.clans
  set leader_id = p_target_player_id,
      updated_at = now()
  where id = actor_membership.clan_id;

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
    'transfer_leadership',
    target_membership.role,
    'leader',
    p_reason
  );

  return updated_target;
end;
$$;

revoke execute on function public.leave_clan(uuid, text) from public, anon, authenticated;
revoke execute on function public.transfer_clan_leadership(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.leave_clan(uuid, text) to service_role;
grant execute on function public.transfer_clan_leadership(uuid, uuid, text) to service_role;
