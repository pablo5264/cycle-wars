create table public.clan_join_requests (
  id uuid primary key default gen_random_uuid(),
  clan_id uuid not null references public.clans(id) on delete cascade,
  requester_id uuid not null references public.player_profiles(id) on delete cascade,
  responder_id uuid references public.player_profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  message text check (message is null or char_length(message) <= 280),
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index clan_join_requests_pending_idx
on public.clan_join_requests(clan_id, requester_id)
where status = 'pending';

create index clan_join_requests_requester_time_idx
on public.clan_join_requests(requester_id, created_at desc);

create index clan_join_requests_clan_time_idx
on public.clan_join_requests(clan_id, created_at desc);

alter table public.clan_join_requests enable row level security;

create policy "players can read relevant clan join requests"
on public.clan_join_requests for select
to authenticated
using (
  requester_id = auth.uid()
  or exists (
    select 1
    from public.clan_memberships cm
    where cm.clan_id = clan_join_requests.clan_id
      and cm.player_id = auth.uid()
      and cm.role in ('leader', 'captain')
  )
);

create or replace view public.v_clan_directory as
select
  clans.id as clan_id,
  clans.name,
  clans.slug,
  clans.description,
  clans.color,
  clans.city,
  clans.country_code,
  clans.join_policy,
  clans.max_members,
  clans.level,
  clans.experience,
  count(cm.player_id)::integer as member_count,
  coalesce(sum(cm.contribution_points), 0)::bigint as total_contribution_points
from public.clans
left join public.clan_memberships cm on cm.clan_id = clans.id
group by clans.id;

create or replace view public.v_clan_join_requests as
select
  request.id,
  request.clan_id,
  clans.name as clan_name,
  clans.color as clan_color,
  request.requester_id,
  requester.display_name as requester_name,
  request.responder_id,
  responder.display_name as responder_name,
  request.status,
  request.message,
  request.responded_at,
  request.created_at
from public.clan_join_requests request
join public.clans clans on clans.id = request.clan_id
join public.player_profiles requester on requester.id = request.requester_id
left join public.player_profiles responder on responder.id = request.responder_id;

revoke all on public.v_clan_directory from public;
revoke all on public.v_clan_directory from anon;
revoke all on public.v_clan_directory from authenticated;
grant select on public.v_clan_directory to service_role;

revoke all on public.v_clan_join_requests from public;
revoke all on public.v_clan_join_requests from anon;
revoke all on public.v_clan_join_requests from authenticated;
grant select on public.v_clan_join_requests to service_role;

create or replace function public.request_to_join_clan(
  p_actor_id uuid,
  p_clan_id uuid,
  p_message text default null
)
returns public.clan_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  target_clan public.clans;
  actor_profile public.player_profiles;
  member_count integer;
  created_request public.clan_join_requests;
begin
  select * into actor_profile
  from public.player_profiles
  where id = p_actor_id
  for update;

  if actor_profile.id is null then
    raise exception 'Player does not exist';
  end if;

  if actor_profile.clan_id is not null then
    raise exception 'Player already belongs to a clan';
  end if;

  select * into target_clan
  from public.clans
  where id = p_clan_id;

  if target_clan.id is null then
    raise exception 'Clan does not exist';
  end if;

  if target_clan.join_policy = 'invite_only' then
    raise exception 'Clan is invite only';
  end if;

  select count(*) into member_count
  from public.clan_memberships
  where clan_id = p_clan_id;

  if member_count >= target_clan.max_members then
    raise exception 'Clan is full';
  end if;

  insert into public.clan_join_requests (
    clan_id,
    requester_id,
    status,
    message
  )
  values (
    p_clan_id,
    p_actor_id,
    case when target_clan.join_policy = 'open' then 'approved' else 'pending' end,
    nullif(trim(p_message), '')
  )
  returning * into created_request;

  if target_clan.join_policy = 'open' then
    insert into public.clan_memberships (
      clan_id,
      player_id,
      role
    )
    values (
      p_clan_id,
      p_actor_id,
      'recruit'
    );

    update public.player_profiles
    set clan_id = p_clan_id
    where id = p_actor_id;

    update public.clan_join_requests
    set responded_at = now()
    where id = created_request.id
    returning * into created_request;
  end if;

  return created_request;
end;
$$;

create or replace function public.respond_to_clan_join_request(
  p_actor_id uuid,
  p_request_id uuid,
  p_response text
)
returns public.clan_join_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_membership public.clan_memberships;
  join_request public.clan_join_requests;
  requester_profile public.player_profiles;
  member_count integer;
  clan_capacity integer;
begin
  if p_response not in ('approved', 'rejected') then
    raise exception 'Unsupported join request response';
  end if;

  select * into join_request
  from public.clan_join_requests
  where id = p_request_id
  for update;

  if join_request.id is null then
    raise exception 'Join request not found';
  end if;

  if join_request.status <> 'pending' then
    raise exception 'Join request is no longer pending';
  end if;

  select * into actor_membership
  from public.clan_memberships
  where player_id = p_actor_id
    and clan_id = join_request.clan_id;

  if actor_membership.player_id is null or actor_membership.role not in ('leader', 'captain') then
    raise exception 'Insufficient clan permissions';
  end if;

  if p_response = 'rejected' then
    update public.clan_join_requests
    set status = 'rejected',
        responder_id = p_actor_id,
        responded_at = now()
    where id = join_request.id
    returning * into join_request;

    return join_request;
  end if;

  select * into requester_profile
  from public.player_profiles
  where id = join_request.requester_id
  for update;

  if requester_profile.clan_id is not null then
    raise exception 'Requester already belongs to a clan';
  end if;

  select count(*) into member_count
  from public.clan_memberships
  where clan_id = join_request.clan_id;

  select max_members into clan_capacity
  from public.clans
  where id = join_request.clan_id;

  if member_count >= clan_capacity then
    raise exception 'Clan is full';
  end if;

  insert into public.clan_memberships (
    clan_id,
    player_id,
    role
  )
  values (
    join_request.clan_id,
    join_request.requester_id,
    'recruit'
  );

  update public.player_profiles
  set clan_id = join_request.clan_id
  where id = join_request.requester_id;

  update public.clan_join_requests
  set status = 'approved',
      responder_id = p_actor_id,
      responded_at = now()
  where id = join_request.id
  returning * into join_request;

  update public.clan_join_requests
  set status = 'cancelled',
      responded_at = now()
  where requester_id = join_request.requester_id
    and status = 'pending'
    and id <> join_request.id;

  return join_request;
end;
$$;

revoke execute on function public.request_to_join_clan(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.respond_to_clan_join_request(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.request_to_join_clan(uuid, uuid, text) to service_role;
grant execute on function public.respond_to_clan_join_request(uuid, uuid, text) to service_role;
