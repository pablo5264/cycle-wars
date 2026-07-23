# Backend

Phase 3 implements the server authority layer using Supabase Edge Functions and PostgreSQL RPCs.

## Backend Principles

- Mobile clients can record intent and sensor data, but the server decides territory influence, battles, purchases and ranking refreshes.
- Sensitive mutations use service-role Edge Functions and transactional SQL RPCs.
- GPS samples are stored even when suspicious, but rejected or quarantined samples do not produce influence.
- Territory influence is applied through `public.apply_territory_influence`, which locks the target H3 row before deciding ownership.
- Cosmetic purchases use `public.purchase_shop_item`, which locks the wallet row and avoids double-charging already owned items.

## Edge Functions

## `start-activity`

Creates a recording activity for the authenticated rider.

Request:

```json
{
  "startedAt": "2026-06-28T22:00:00.000Z",
  "source": "mobile",
  "metadata": {}
}
```

## `ingest-gps-sample`

Stores a GPS sample, evaluates anti-cheat signals, calculates influence and applies conquest when the sample is trusted.

Request:

```json
{
  "activityId": "uuid",
  "latitude": -33.4489,
  "longitude": -70.6693,
  "altitudeMeters": 570,
  "accuracyMeters": 8,
  "speedKmh": 24,
  "headingDegrees": 180,
  "recordedAt": "2026-06-28T22:01:00.000Z",
  "deviceIntegrity": {
    "isMocked": false,
    "isRooted": false,
    "isJailbroken": false,
    "clockOffsetMs": 0
  }
}
```

Server behavior:

- Computes H3 index from latitude/longitude.
- Compares with previous sample for teleport and derived-speed checks.
- Inserts `gps_samples`.
- Inserts `anti_cheat_signals` when needed.
- Calls `apply_territory_influence` only for trusted samples with positive influence.
- Opens or joins an active battle when another trusted rider is recently present in the same H3 cell.

## `finish-activity`

Closes a ride, computes ride summary from trusted samples and influence events, and merges aggregate rider stats.

## `get-territory-map`

Reads map-friendly territory data from `v_public_territory_map`.

Query params:

- `h3`: optional comma-separated H3 indexes.
- `limit`: optional result limit, capped at 2000.

## `get-region-control`

Reads latest regional control snapshots from `v_region_control`.

Query params:

- `regionId`: optional region UUID.
- `limit`: optional result limit, capped at 100.

## `resolve-battle`

Allows a battle participant to request battle resolution. Final winner selection is server-side through `public.resolve_battle`.

## `get-active-battle`

Returns the authenticated rider's most recent active battle with participant scorecard data.

## `purchase-shop-item`

Purchases an active cosmetic shop item for the authenticated rider using `public.purchase_shop_item`.

## `record-performance`

Records authenticated mobile performance telemetry, such as GPS ingestion roundtrip time, into `mobile_performance_events`.

Request:

```json
{
  "eventName": "gps_sample_roundtrip",
  "durationMs": 420,
  "metadata": {
    "antiCheat": "trusted",
    "influenceDelta": 12
  }
}
```

## `refresh-rankings`

Internal endpoint for scheduled jobs. Requires `x-cycle-wars-secret` and calls `public.refresh_rankings`.

## `refresh-region-control`

Internal endpoint for scheduled regional-control snapshots. Requires `x-cycle-wars-secret` and calls `public.refresh_region_control`.

## `settle-region-rewards`

Internal endpoint for season regional rewards. Requires `x-cycle-wars-secret` and calls `public.settle_region_season_rewards`.

## `player-region-rewards`

Returns the authenticated rider's regional reward history from `v_player_region_rewards`.

## `player-analytics`

Returns the authenticated rider's analytics summary from `v_player_analytics`, including activity totals, territory ownership, influence, regional rewards, ELO and season progress.

## `player-weekly-trends`

Returns authenticated rider weekly trend rows from `v_player_weekly_trends`, capped to 26 weeks.

## `player-events`

Refreshes active event progress for the authenticated rider and returns active daily, weekly, monthly and global missions from `v_player_events`.

## `claim-event-reward`

Claims a completed mission reward for the authenticated rider. The `claim_player_event_reward` RPC refreshes progress, verifies completion, prevents duplicate claims with `event_reward_claims`, and grants supported economy rewards through `grant_currency`.

## `event-leaderboard`

Returns ranked progress for active missions from `v_event_leaderboards`. Results can be filtered by event and are ordered by completion, progress percent, score and earliest update.

## `player-event-reward-history`

Returns recent claimed mission rewards for the authenticated rider from `v_player_event_reward_claims`, capped to 50 rows and ordered by claim time.

## `event-schedule`

Returns upcoming mission events from `v_event_schedule`, capped to 50 rows and ordered by start time. Pass `includeActive=true` when the caller needs active and upcoming events in one calendar list.

## `event-reminders`

Returns and manages upcoming mission reminders for the authenticated rider. POST with `eventId` activates a reminder one hour before the event starts; POST with `action=cancel` cancels the reminder.

## `dispatch-event-reminders`

Service-protected scheduled endpoint that calls `dispatch_due_event_reminders(...)`, creates notification inbox entries for due active reminders and marks those reminders as sent.

## `notifications`

Returns authenticated rider notifications. POST with `mark_read` marks one notification as read; POST with `mark_all_read` clears all unread notifications for the authenticated rider.

## `clan-analytics`

Returns analytics for the authenticated rider's clan from `v_clan_analytics`. Riders outside a clan receive `null`.

## `clan-weekly-trends`

Returns weekly trend rows for the authenticated rider's clan from `v_clan_weekly_trends`, capped to 26 weeks. Riders outside a clan receive an empty list.

## `clan-member-contributions`

Returns contribution rows for members of the authenticated rider's clan from `v_clan_member_contributions`, capped to 50 members. Riders outside a clan receive an empty list.

## `manage-clan-member`

Allows authorized clan leaders or captains to set member roles or remove members. Rules are enforced by `set_clan_member_role` and `remove_clan_member`, with every mutation written to `clan_governance_audit`.

## `clan-governance-audit`

Returns recent governance audit events for the authenticated rider's clan from `v_clan_governance_audit`, capped to 100 events. Riders outside a clan receive an empty list.

## `clan-invitations`

Returns received and sent clan invitations for the authenticated rider. POST actions can send invitations, accept invitations or decline invitations. Server-side RPCs enforce leader/captain sender permissions, target eligibility, expiration and clan capacity before membership is created.

## `clan-join-requests`

Returns a clan directory plus sent and received join requests. Riders outside a clan can request entry to open or approval-required clans. Leaders and captains can approve or reject pending requests for their clan. Open clans create membership immediately; approval-required clans wait for a server-authoritative response.

## `create-clan`

Creates a new clan for the authenticated rider when they do not already belong to one. The RPC generates a unique slug, creates the clan, inserts the creator as leader, updates the rider profile and cancels stale pending join/invitation flows in one transaction.

## `update-clan-settings`

Updates public clan settings for the authenticated rider's clan. Only leaders can change description, color, city, country code or join policy. The RPC validates branding and policy values before updating the clan.

## `clan-lifecycle`

Allows authenticated riders to leave their clan, and allows leaders to transfer leadership to another current member. Leaders must transfer leadership before leaving. Lifecycle actions are recorded in `clan_governance_audit`.

## `clan-wars`

Returns active and historical wars for the authenticated rider's clan. Leaders and captains can declare war against another clan or end an active war involving their clan. Declarations notify the target clan through `clan_war` notifications.

## Required Environment

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CYCLE_WARS_INTERNAL_SECRET`
- `H3_DEFAULT_RESOLUTION`
- `TERRITORY_SHIELD_MINUTES`
- `ANTICHEAT_MAX_CYCLING_SPEED_KMH`

## RPCs

- `active_season_id()`: returns the current active season.
- `apply_territory_influence(...)`: atomic influence and conquest mutation.
- `purchase_shop_item(...)`: atomic cosmetic purchase.
- `resolve_battle(...)`: battle resolution and notifications.
- `upsert_battle_participant_pulse(...)`: updates live battle scoring from trusted GPS pulses.
- `refresh_rankings()`: refreshes leaderboard projections.
- `decay_territory_influence(...)`: scheduled influence decay for territories and player pressure.
- `check_rate_limit(...)`: rate-limit gate used by write-heavy and map-read Edge Functions.
- `record_mobile_performance_event(...)`: stores authenticated client performance telemetry.
- `record_edge_function_log(...)`: stores operational function logs for dashboards and alerts.
- `refresh_region_control(...)`: snapshots aggregate region control from territory ownership.
- `refresh_player_event_progress(...)`: recalculates active event objective progress for one rider.
- `dispatch_due_event_reminders(...)`: turns due mission reminders into notification inbox entries.
- `create_clan_invitation(...)`: creates pending invitations for eligible targets.
- `respond_to_clan_invitation(...)`: accepts or declines pending invitations and creates memberships atomically.
- `request_to_join_clan(...)`: creates or auto-approves join requests according to clan policy.
- `respond_to_clan_join_request(...)`: approves or rejects pending clan join requests.
- `create_clan(...)`: creates a clan and founder leader membership atomically.
- `update_clan_settings(...)`: updates leader-controlled clan settings.
- `leave_clan(...)`: removes a non-leader from their clan.
- `transfer_clan_leadership(...)`: transfers leader role to another clan member.
- `declare_clan_war(...)`: opens a server-authoritative clan war and notifies the target clan.
- `end_clan_war(...)`: closes an active clan war involving the actor's clan.
- `settle_region_season_rewards(...)`: grants idempotent cosmetic currency rewards to regional controllers.
- `set_clan_member_role(...)`: changes a member role with server-side permission checks.
- `remove_clan_member(...)`: removes a member with server-side permission checks.

Direct execution of sensitive RPCs is revoked from public, anon and authenticated roles. Edge Functions call them with the service role after validating the request.
