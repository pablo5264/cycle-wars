create table public.clan_invitations (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans(id) on delete cascade,
  actor_id uuid not null references public.player_profiles(id) on delete cascade,
  target_player_id uuid not null references public.player_profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  message text check (message is null or char_length(message) <= 280),
  expires_at timestamptz not null default (now() + interval '7 days'),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  check (actor_id <> target_player_id)
);

create unique index clan_invitations_pending_target_clan_idx
on public.clan_invitations(clan_id, target_player_id)
where status = 'pending';

create index clan_invitations_target_time_idx
on public.clan_invitations(target_player_id, created_at desc);

create index clan_invitations_clan_time_idx
on public.clan_invitations(clan_id, created_at desc);

alter table public.clan_invitations enable row level security;

create policy "players can read own clan invitations"
on public.clan_invitations for select
to authenticated
using (
  target_player_id = auth.uid()
  or actor_id = auth.uid()
  or exists (
    select 1
    from public.clan_memberships cm
    where cm.clan_id = clan_invitations.clan_id
      and cm.player_id = auth.uid()
      and cm.role in ('leader', 'captain')
  )
);

create or replace view public.v_clan_invitations as
select
  invitation.id,
  invitation.clan_id,
  clans.name as clan_name,
  clans.color as clan_color,
  invitation.actor_id,
  actor.display_name as actor_name,
  invitation.target_player_id,
  target.display_name as target_player_name,
  invitation.status,
  invitation.message,
  invitation.expires_at,
  invitation.responded_at,
  invitation.created_at
from public.clan_invitations invitation
join public.clans clans on clans.id = invitation.clan_id
join public.player_profiles actor on actor.id = invitation.actor_id
join public.player_profiles target on target.id = invitation.target_player_id;

revoke all on public.v_clan_invitations from public;
revoke all on public.v_clan_invitations from anon;
revoke all on public.v_clan_invitations from authenticated;
grant select on public.v_clan_invitations to service_role;

create or replace function public.create_clan_invitation(
  p_actor_id uuid,
  p_target_player_id uuid,
  p_message text default null
)
returns public.clan_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_membership public.clan_memberships;
  target_profile public.player_profiles;
  created_invitation public.clan_invitations;
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

  if p_actor_id = p_target_player_id then
    raise exception 'Actors cannot invite themselves';
  end if;

  select * into target_profile
  from public.player_profiles
  where id = p_target_player_id;

  if target_profile.id is null then
    raise exception 'Target player does not exist';
  end if;

  if target_profile.clan_id is not null then
    raise exception 'Target player already belongs to a clan';
  end if;

  update public.clan_invitations
  set status = 'expired',
      responded_at = now()
  where clan_id = actor_membership.clan_id
    and target_player_id = p_target_player_id
    and status = 'pending'
    and expires_at <= now();

  insert into public.clan_invitations (
    clan_id,
    actor_id,
    target_player_id,
    message
  )
  values (
    actor_membership.clan_id,
    p_actor_id,
    p_target_player_id,
    nullif(trim(p_message), '')
  )
  returning * into created_invitation;

  return created_invitation;
end;
$$;

create or replace function public.respond_to_clan_invitation(
  p_actor_id uuid,
  p_invitation_id uuid,
  p_response text
)
returns public.clan_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.clan_invitations;
  target_profile public.player_profiles;
  member_count integer;
  clan_capacity integer;
begin
  if p_response not in ('accepted', 'declined') then
    raise exception 'Unsupported invitation response';
  end if;

  select * into invitation
  from public.clan_invitations
  where id = p_invitation_id
    and target_player_id = p_actor_id
  for update;

  if invitation.id is null then
    raise exception 'Invitation not found';
  end if;

  if invitation.status <> 'pending' then
    raise exception 'Invitation is no longer pending';
  end if;

  if invitation.expires_at <= now() then
    update public.clan_invitations
    set status = 'expired',
        responded_at = now()
    where id = invitation.id
    returning * into invitation;

    raise exception 'Invitation has expired';
  end if;

  if p_response = 'declined' then
    update public.clan_invitations
    set status = 'declined',
        responded_at = now()
    where id = invitation.id
    returning * into invitation;

    return invitation;
  end if;

  select * into target_profile
  from public.player_profiles
  where id = p_actor_id
  for update;

  if target_profile.clan_id is not null then
    raise exception 'Player already belongs to a clan';
  end if;

  select count(*) into member_count
  from public.clan_memberships
  where clan_id = invitation.clan_id;

  select max_members into clan_capacity
  from public.clans
  where id = invitation.clan_id;

  if member_count >= clan_capacity then
    raise exception 'Clan is full';
  end if;

  insert into public.clan_memberships (
    clan_id,
    player_id,
    role
  )
  values (
    invitation.clan_id,
    p_actor_id,
    'recruit'
  );

  update public.player_profiles
  set clan_id = invitation.clan_id
  where id = p_actor_id;

  update public.clan_invitations
  set status = 'accepted',
      responded_at = now()
  where id = invitation.id
  returning * into invitation;

  update public.clan_invitations
  set status = 'expired',
      responded_at = now()
  where target_player_id = p_actor_id
    and status = 'pending'
    and id <> invitation.id;

  return invitation;
end;
$$;

revoke execute on function public.create_clan_invitation(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.respond_to_clan_invitation(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.create_clan_invitation(uuid, uuid, text) to service_role;
grant execute on function public.respond_to_clan_invitation(uuid, uuid, text) to service_role;
