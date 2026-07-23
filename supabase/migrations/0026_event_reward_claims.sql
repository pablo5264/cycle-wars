create table if not exists public.event_reward_claims (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  rewards jsonb not null default '{}'::jsonb,
  claimed_at timestamptz not null default now(),
  unique (event_id, player_id)
);

create index if not exists event_reward_claims_player_idx
on public.event_reward_claims(player_id, claimed_at desc);

alter table public.event_reward_claims enable row level security;

drop policy if exists "Players can read own event reward claims" on public.event_reward_claims;
create policy "Players can read own event reward claims"
on public.event_reward_claims
for select
to authenticated
using (auth.uid() = player_id);

create or replace function public.claim_player_event_reward(
  p_player_id uuid,
  p_event_id uuid
)
returns public.event_reward_claims
language plpgsql
security definer
set search_path = public
as $$
declare
  event_row public.events;
  progress_row public.event_progress;
  claim_row public.event_reward_claims;
  currency_key text;
  reward_amount bigint;
begin
  select *
  into event_row
  from public.events
  where id = p_event_id
    and starts_at <= now()
    and ends_at > now();

  if event_row.id is null then
    raise exception 'Event is not active';
  end if;

  perform public.refresh_player_event_progress(p_player_id);

  select *
  into progress_row
  from public.event_progress
  where event_id = p_event_id
    and player_id = p_player_id;

  if progress_row.completed_at is null then
    raise exception 'Event mission is not complete';
  end if;

  insert into public.event_reward_claims (
    event_id,
    player_id,
    rewards
  )
  values (
    p_event_id,
    p_player_id,
    event_row.rewards
  )
  on conflict (event_id, player_id) do nothing
  returning * into claim_row;

  if claim_row.id is null then
    raise exception 'Event reward already claimed';
  end if;

  for currency_key, reward_amount in
    select key, value::bigint
    from jsonb_each_text(event_row.rewards)
    where key in ('coins', 'crystals')
  loop
    perform public.grant_currency(
      p_player_id,
      currency_key::public.currency_kind,
      reward_amount,
      'event_reward',
      'event',
      p_event_id
    );
  end loop;

  return claim_row;
end;
$$;

create or replace view public.v_player_events as
select
  events.id,
  events.code,
  events.name,
  events.description,
  events.starts_at,
  events.ends_at,
  events.scope,
  events.objectives,
  events.rewards,
  progress.player_id,
  coalesce(progress.progress, '{}'::jsonb) as progress,
  progress.completed_at,
  progress.updated_at,
  claims.claimed_at,
  coalesce(claims.rewards, '{}'::jsonb) as claimed_rewards
from public.events
left join public.event_progress progress on progress.event_id = events.id
left join public.event_reward_claims claims
  on claims.event_id = events.id
  and claims.player_id = progress.player_id;

revoke all on public.v_player_events from public;
revoke all on public.v_player_events from anon;
revoke all on public.v_player_events from authenticated;
grant select on public.v_player_events to service_role;

revoke execute on function public.claim_player_event_reward(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_player_event_reward(uuid, uuid) to service_role;
