create or replace function public.update_clan_settings(
  p_actor_id uuid,
  p_description text default null,
  p_color text default null,
  p_city text default null,
  p_country_code text default null,
  p_join_policy public.clan_join_policy default null
)
returns public.clans
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_membership public.clan_memberships;
  updated_clan public.clans;
begin
  select * into actor_membership
  from public.clan_memberships
  where player_id = p_actor_id;

  if actor_membership.player_id is null then
    raise exception 'Actor is not in a clan';
  end if;

  if actor_membership.role <> 'leader' then
    raise exception 'Only clan leaders can update clan settings';
  end if;

  if p_description is not null and char_length(p_description) > 280 then
    raise exception 'Clan description is too long';
  end if;

  if p_color is not null and p_color !~ '^#[0-9A-Fa-f]{6}$' then
    raise exception 'Clan color must be a hex color';
  end if;

  if p_country_code is not null and char_length(trim(p_country_code)) <> 2 then
    raise exception 'Country code must use two letters';
  end if;

  if p_join_policy is not null and p_join_policy not in ('open', 'approval_required', 'invite_only') then
    raise exception 'Unsupported join policy';
  end if;

  update public.clans
  set description = coalesce(nullif(trim(p_description), ''), description),
      color = coalesce(upper(p_color), color),
      city = coalesce(nullif(trim(p_city), ''), city),
      country_code = coalesce(upper(nullif(trim(p_country_code), '')), country_code),
      join_policy = coalesce(p_join_policy, join_policy),
      updated_at = now()
  where id = actor_membership.clan_id
  returning * into updated_clan;

  return updated_clan;
end;
$$;

revoke execute on function public.update_clan_settings(uuid, text, text, text, text, public.clan_join_policy) from public, anon, authenticated;
grant execute on function public.update_clan_settings(uuid, text, text, text, text, public.clan_join_policy) to service_role;
