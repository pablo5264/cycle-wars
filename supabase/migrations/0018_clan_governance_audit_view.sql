create or replace view public.v_clan_governance_audit as
select
  audit.id,
  audit.clan_id,
  clans.name as clan_name,
  audit.actor_id,
  actor.display_name as actor_name,
  audit.target_player_id,
  target.display_name as target_player_name,
  audit.action,
  audit.previous_role,
  audit.next_role,
  audit.reason,
  audit.created_at
from public.clan_governance_audit audit
join public.clans clans on clans.id = audit.clan_id
join public.player_profiles actor on actor.id = audit.actor_id
join public.player_profiles target on target.id = audit.target_player_id;

revoke all on public.v_clan_governance_audit from public;
revoke all on public.v_clan_governance_audit from anon;
revoke all on public.v_clan_governance_audit from authenticated;
grant select on public.v_clan_governance_audit to service_role;
