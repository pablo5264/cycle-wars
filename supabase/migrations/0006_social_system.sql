create or replace view public.v_feed_posts as
select
  fp.id,
  fp.author_id,
  pp.display_name as author_name,
  pp.avatar_url as author_avatar_url,
  fp.activity_id,
  fp.territory_h3_index,
  fp.visibility,
  fp.body,
  fp.media_paths,
  fp.created_at,
  fp.updated_at,
  count(distinct fl.player_id) as like_count,
  count(distinct fc.id) as comment_count
from public.feed_posts fp
join public.player_profiles pp on pp.id = fp.author_id
left join public.feed_likes fl on fl.post_id = fp.id
left join public.feed_comments fc on fc.post_id = fp.id
group by fp.id, pp.id;

create or replace view public.v_chat_threads as
select
  ct.id,
  ct.clan_id,
  ct.is_group,
  ct.title,
  ct.created_at,
  max(cm.created_at) as last_message_at,
  count(distinct ctm.player_id) as member_count
from public.chat_threads ct
left join public.chat_thread_members ctm on ctm.thread_id = ct.id
left join public.chat_messages cm on cm.thread_id = ct.id
group by ct.id;

create or replace function public.create_feed_post(
  p_author_id uuid,
  p_body text,
  p_visibility public.feed_visibility,
  p_activity_id uuid,
  p_territory_h3_index text,
  p_media_paths text[]
)
returns public.feed_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  row_value public.feed_posts;
begin
  insert into public.feed_posts (
    author_id,
    body,
    visibility,
    activity_id,
    territory_h3_index,
    media_paths
  )
  values (
    p_author_id,
    nullif(trim(p_body), ''),
    coalesce(p_visibility, 'public'),
    p_activity_id,
    p_territory_h3_index,
    coalesce(p_media_paths, '{}')
  )
  returning * into row_value;

  return row_value;
end;
$$;

create or replace function public.toggle_feed_like(
  p_post_id uuid,
  p_player_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  existed boolean;
begin
  select exists (
    select 1 from public.feed_likes where post_id = p_post_id and player_id = p_player_id
  ) into existed;

  if existed then
    delete from public.feed_likes where post_id = p_post_id and player_id = p_player_id;
    return false;
  end if;

  insert into public.feed_likes (post_id, player_id)
  values (p_post_id, p_player_id);

  return true;
end;
$$;

create or replace function public.add_feed_comment(
  p_post_id uuid,
  p_author_id uuid,
  p_body text
)
returns public.feed_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  row_value public.feed_comments;
begin
  insert into public.feed_comments (post_id, author_id, body)
  values (p_post_id, p_author_id, trim(p_body))
  returning * into row_value;

  return row_value;
end;
$$;

create or replace function public.request_friendship(
  p_requester_id uuid,
  p_addressee_id uuid
)
returns public.friendships
language plpgsql
security definer
set search_path = public
as $$
declare
  row_value public.friendships;
begin
  if p_requester_id = p_addressee_id then
    raise exception 'Cannot friend yourself';
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (p_requester_id, p_addressee_id, 'pending')
  on conflict (requester_id, addressee_id) do update
  set status = public.friendships.status
  returning * into row_value;

  insert into public.notifications (player_id, kind, title, body, payload)
  values (
    p_addressee_id,
    'friend_request',
    'New friend request',
    'A rider wants to connect with you.',
    jsonb_build_object('requesterId', p_requester_id)
  );

  return row_value;
end;
$$;

create or replace function public.set_follow(
  p_follower_id uuid,
  p_followed_id uuid,
  p_should_follow boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_follower_id = p_followed_id then
    raise exception 'Cannot follow yourself';
  end if;

  if p_should_follow then
    insert into public.follows (follower_id, followed_id)
    values (p_follower_id, p_followed_id)
    on conflict do nothing;
    return true;
  end if;

  delete from public.follows where follower_id = p_follower_id and followed_id = p_followed_id;
  return false;
end;
$$;

create or replace function public.ensure_private_chat(
  p_player_a uuid,
  p_player_b uuid
)
returns public.chat_threads
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_thread_id uuid;
  row_value public.chat_threads;
begin
  if p_player_a = p_player_b then
    raise exception 'Cannot create private chat with yourself';
  end if;

  select ctm_a.thread_id
  into existing_thread_id
  from public.chat_thread_members ctm_a
  join public.chat_thread_members ctm_b on ctm_b.thread_id = ctm_a.thread_id
  join public.chat_threads ct on ct.id = ctm_a.thread_id
  where ctm_a.player_id = p_player_a
    and ctm_b.player_id = p_player_b
    and ct.is_group = false
    and ct.clan_id is null
  limit 1;

  if existing_thread_id is not null then
    select * into row_value from public.chat_threads where id = existing_thread_id;
    return row_value;
  end if;

  insert into public.chat_threads (is_group, title)
  values (false, null)
  returning * into row_value;

  insert into public.chat_thread_members (thread_id, player_id)
  values (row_value.id, p_player_a), (row_value.id, p_player_b);

  return row_value;
end;
$$;

create or replace function public.send_chat_message(
  p_thread_id uuid,
  p_sender_id uuid,
  p_body text
)
returns public.chat_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  row_value public.chat_messages;
begin
  if not exists (
    select 1
    from public.chat_thread_members
    where thread_id = p_thread_id
      and player_id = p_sender_id
  ) then
    raise exception 'Sender is not a member of this chat';
  end if;

  insert into public.chat_messages (thread_id, sender_id, body)
  values (p_thread_id, p_sender_id, trim(p_body))
  returning * into row_value;

  return row_value;
end;
$$;

revoke execute on function public.create_feed_post(uuid, text, public.feed_visibility, uuid, text, text[]) from public, anon, authenticated;
revoke execute on function public.toggle_feed_like(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.add_feed_comment(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.request_friendship(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.set_follow(uuid, uuid, boolean) from public, anon, authenticated;
revoke execute on function public.ensure_private_chat(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.send_chat_message(uuid, uuid, text) from public, anon, authenticated;

grant execute on function public.create_feed_post(uuid, text, public.feed_visibility, uuid, text, text[]) to service_role;
grant execute on function public.toggle_feed_like(uuid, uuid) to service_role;
grant execute on function public.add_feed_comment(uuid, uuid, text) to service_role;
grant execute on function public.request_friendship(uuid, uuid) to service_role;
grant execute on function public.set_follow(uuid, uuid, boolean) to service_role;
grant execute on function public.ensure_private_chat(uuid, uuid) to service_role;
grant execute on function public.send_chat_message(uuid, uuid, text) to service_role;
