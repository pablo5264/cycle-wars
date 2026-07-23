create or replace function public.slugify_clan_name(p_name text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.create_clan(
  p_actor_id uuid,
  p_name text,
  p_description text default null,
  p_color text default '#39E58C',
  p_city text default null,
  p_country_code text default null,
  p_join_policy public.clan_join_policy default 'approval_required'
)
returns public.clans
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.player_profiles;
  base_slug text;
  candidate_slug text;
  slug_suffix integer := 0;
  created_clan public.clans;
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

  if char_length(trim(p_name)) < 3 or char_length(trim(p_name)) > 32 then
    raise exception 'Clan name must be between 3 and 32 characters';
  end if;

  if p_description is not null and char_length(p_description) > 280 then
    raise exception 'Clan description is too long';
  end if;

  if p_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Clan color must be a hex color';
  end if;

  if p_join_policy not in ('open', 'approval_required', 'invite_only') then
    raise exception 'Unsupported join policy';
  end if;

  base_slug := public.slugify_clan_name(p_name);

  if char_length(base_slug) < 3 then
    base_slug := 'clan-' || substring(replace(p_actor_id::text, '-', ''), 1, 8);
  end if;

  base_slug := substring(base_slug from 1 for 32);
  candidate_slug := base_slug;

  while exists (select 1 from public.clans where slug = candidate_slug) loop
    slug_suffix := slug_suffix + 1;
    candidate_slug := substring(base_slug from 1 for greatest(3, 39 - char_length(slug_suffix::text)))
      || '-' || slug_suffix::text;
  end loop;

  insert into public.clans (
    name,
    slug,
    description,
    color,
    city,
    country_code,
    join_policy,
    leader_id
  )
  values (
    trim(p_name),
    candidate_slug,
    nullif(trim(p_description), ''),
    upper(p_color),
    nullif(trim(p_city), ''),
    upper(nullif(trim(p_country_code), '')),
    p_join_policy,
    p_actor_id
  )
  returning * into created_clan;

  insert into public.clan_memberships (
    clan_id,
    player_id,
    role
  )
  values (
    created_clan.id,
    p_actor_id,
    'leader'
  );

  update public.player_profiles
  set clan_id = created_clan.id
  where id = p_actor_id;

  update public.clan_join_requests
  set status = 'cancelled',
      responded_at = now()
  where requester_id = p_actor_id
    and status = 'pending';

  update public.clan_invitations
  set status = 'expired',
      responded_at = now()
  where target_player_id = p_actor_id
    and status = 'pending';

  return created_clan;
end;
$$;

revoke execute on function public.slugify_clan_name(text) from public, anon, authenticated;
revoke execute on function public.create_clan(uuid, text, text, text, text, text, public.clan_join_policy) from public, anon, authenticated;

grant execute on function public.slugify_clan_name(text) to service_role;
grant execute on function public.create_clan(uuid, text, text, text, text, text, public.clan_join_policy) to service_role;
