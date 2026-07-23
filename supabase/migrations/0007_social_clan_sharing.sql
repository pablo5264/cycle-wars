create or replace function public.ensure_clan_chat(
  p_player_id uuid
)
returns public.chat_threads
language plpgsql
security definer
set search_path = public
as $$
declare
  player_clan_id uuid;
  existing_thread public.chat_threads;
  row_value public.chat_threads;
begin
  select clan_id
  into player_clan_id
  from public.player_profiles
  where id = p_player_id;

  if player_clan_id is null then
    raise exception 'Player is not in a clan';
  end if;

  select *
  into existing_thread
  from public.chat_threads
  where clan_id = player_clan_id
    and is_group = true
  limit 1;

  if existing_thread.id is not null then
    insert into public.chat_thread_members (thread_id, player_id)
    values (existing_thread.id, p_player_id)
    on conflict do nothing;

    return existing_thread;
  end if;

  insert into public.chat_threads (clan_id, is_group, title)
  select player_clan_id, true, name || ' clan chat'
  from public.clans
  where id = player_clan_id
  returning * into row_value;

  insert into public.chat_thread_members (thread_id, player_id)
  select row_value.id, player_id
  from public.clan_memberships
  where clan_id = player_clan_id
  on conflict do nothing;

  return row_value;
end;
$$;

create or replace function public.share_activity_post(
  p_author_id uuid,
  p_activity_id uuid,
  p_body text
)
returns public.feed_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  row_value public.feed_posts;
begin
  if not exists (
    select 1 from public.activities where id = p_activity_id and player_id = p_author_id
  ) then
    raise exception 'Activity does not belong to player';
  end if;

  insert into public.feed_posts (author_id, activity_id, visibility, body)
  values (p_author_id, p_activity_id, 'public', nullif(trim(p_body), ''))
  returning * into row_value;

  return row_value;
end;
$$;

create or replace function public.share_conquest_post(
  p_author_id uuid,
  p_territory_h3_index text,
  p_body text
)
returns public.feed_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  row_value public.feed_posts;
begin
  if not exists (
    select 1
    from public.territories
    where h3_index = p_territory_h3_index
      and owner_id = p_author_id
  ) then
    raise exception 'Territory is not owned by player';
  end if;

  insert into public.feed_posts (author_id, territory_h3_index, visibility, body)
  values (p_author_id, p_territory_h3_index, 'public', nullif(trim(p_body), ''))
  returning * into row_value;

  return row_value;
end;
$$;

revoke execute on function public.ensure_clan_chat(uuid) from public, anon, authenticated;
revoke execute on function public.share_activity_post(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.share_conquest_post(uuid, text, text) from public, anon, authenticated;

grant execute on function public.ensure_clan_chat(uuid) to service_role;
grant execute on function public.share_activity_post(uuid, uuid, text) to service_role;
grant execute on function public.share_conquest_post(uuid, text, text) to service_role;
