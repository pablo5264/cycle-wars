# Events and Missions

Phase 28 adds player-facing events and missions on top of the existing `events` and `event_progress` tables. Phase 29 adds server-authoritative reward claims. Phase 30 adds event leaderboards. Phase 31 adds personal reward history. Phase 32 adds upcoming mission discovery. Phase 33 adds event reminders. Phase 34 adds reminder dispatch.

## Event Types

- Daily missions for short ride goals.
- Weekly missions for sustained activity and influence.
- Global missions for longer exploration goals.

## Progress

`refresh_player_event_progress(...)` recalculates active event progress from trusted server data:

- `distance_meters`: valid activity distance during the event window.
- `influence_delta`: positive territory influence generated during the event window.
- `touched_territories`: distinct territories influenced during the event window.

Progress is stored in `event_progress` as objective-level JSON so the mobile client can render consistent progress bars.

## Reward Claims

`event_reward_claims` stores one claim per event and player. `claim_player_event_reward(...)` refreshes progress before settlement, rejects incomplete missions, prevents duplicate claims and grants supported economy rewards through the existing wallet ledger.

Current claim settlement grants `coins` and `crystals`. Other reward keys remain visible in event metadata and can be wired into future XP or progression systems.

## Reward History

`v_player_event_reward_claims` exposes claimed mission payouts with event name, scope, rewards and claim time. The `player-event-reward-history` endpoint returns the authenticated rider's recent claims so the Events tab can show what was already collected.

## Schedule

`v_event_schedule` exposes active and upcoming events ordered by start time. The `event-schedule` endpoint returns upcoming missions by default, with an option to include active events for broader calendar surfaces.

## Reminders

`event_reminders` stores one reminder per player and event. The `event-reminders` endpoint lists reminder state and lets riders activate a reminder for an upcoming mission from the Events tab.

`dispatch_due_event_reminders(...)` finds due active reminders, creates `event_started` notifications and marks reminders as sent. The service-protected `dispatch-event-reminders` endpoint is intended for a scheduled job.

## Leaderboards

`v_event_leaderboards` ranks active mission progress from `event_progress`. The ranking favors completed missions, then objective progress percent, score and earliest update time.

The `event-leaderboard` endpoint returns the top riders for an active event. The Events tab shows a compact leaderboard for the featured active mission so riders can compare progress while chasing objectives.

## Mobile

The Events tab reads `player-events`, refreshes progress server-side and renders active objectives, completion state, rewards, claim state, leaderboard, reward history, upcoming schedule, reminder action and expiration date. Completed unclaimed missions expose a `Reclamar recompensa` action backed by `claim-event-reward`.
