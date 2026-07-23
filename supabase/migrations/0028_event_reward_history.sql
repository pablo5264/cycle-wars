create or replace view public.v_player_event_reward_claims as
select
  claims.id,
  claims.event_id,
  events.code as event_code,
  events.name as event_name,
  events.scope,
  claims.player_id,
  claims.rewards,
  claims.claimed_at
from public.event_reward_claims claims
join public.events on events.id = claims.event_id;

revoke all on public.v_player_event_reward_claims from public;
revoke all on public.v_player_event_reward_claims from anon;
revoke all on public.v_player_event_reward_claims from authenticated;
grant select on public.v_player_event_reward_claims to service_role;
