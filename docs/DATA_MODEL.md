# Data Model

Phase 2 defines the production PostgreSQL model for Cycle Wars. The database is designed around server authority, H3 territory ownership, high-frequency GPS ingestion and realtime projections.

## Core Decisions

- `territories.h3_index` is the canonical territory ID. H3 gives deterministic global cells and efficient adjacency queries.
- GPS samples are append-only in `gps_samples`. Game state is derived from validated samples, not trusted directly from the mobile client.
- `territory_influence_events` and `territory_ownership_history` are immutable ledgers. They make conquest, decay, season resets and dispute resolution auditable.
- `territories` is the hot read table for the map. It is intentionally denormalized for fast viewport loading.
- Seasons never delete historical activity. Reset behavior affects active territory state and influence, while history remains queryable.
- Economy writes are represented in `economy_ledger`. Wallet balances are a projection of trusted economic events.
- Anti-cheat is modeled as evidence, not a boolean. Multiple low-confidence signals can quarantine activity before it changes ownership.

## Domains

## Identity And Progression

- `player_profiles`: public rider profile and aggregated player stats.
- `player_league_ratings`: ELO and league tier.
- `wallets`: current cosmetic currency balances.
- `player_inventory`: owned cosmetics.
- `player_achievements`: unlocked achievements and progress.

## Clans

- `clans`: clan identity, leader, color, level and membership policy.
- `clan_memberships`: role, contribution and membership relation.

The `player_profiles.clan_id` shortcut exists for fast reads, while `clan_memberships` remains the source of role membership.

## Seasons

- `seasons`: quarterly season windows and configurable rules.
- `territories.season_id`: active ownership context.
- Historical tables preserve previous seasons without resetting player progression.

## Activity And GPS

- `activities`: ride summary, status and route metadata.
- `gps_samples`: timestamped location samples with H3 cell, accuracy, speed and trust score.
- `activity_exports`: generated GPX, FIT and CSV outputs.

Activities can be `quarantined` or `rejected` when anti-cheat signals indicate unreliable data.

## Territory And Regions

- `territories`: current H3 ownership, influence, shield, level and map color.
- `territory_influence_events`: influence changes caused by validated rides.
- `territory_ownership_history`: ownership transition log.
- `admin_regions`: neighborhood, commune, city, province, region and country polygons.
- `region_hexes`: mapping between administrative regions and H3 cells.
- `region_control_snapshots`: domination records for connected regional capture.

## Battles

- `battles`: active or resolved same-hex encounters.
- `battle_participants`: per-rider scoring factors such as distance, speed and time in territory.

Battle score calculation stays server-side in Phase 3 so clients cannot forge outcomes.

## Social

- `friendships`, `follows`: social graph.
- `feed_posts`, `feed_likes`, `feed_comments`: public and scoped social feed.
- `chat_threads`, `chat_thread_members`, `chat_messages`: private and group chat.
- `notifications`: push-ready notification inbox.

## Events And Achievements

- `events`: daily, weekly, monthly and global missions.
- `event_progress`: per-player progress.
- `achievements`: public, hidden and secret achievements.

The achievement catalog can hold 300+ rows without schema changes.

## Economy

- `shop_items`: cosmetic-only catalog.
- `wallets`: projected balances.
- `economy_ledger`: authoritative currency movement log.
- `player_inventory`: owned/equipped cosmetic items.

No gameplay power is modeled in shop items, preserving the non-pay-to-win rule.

## Security And Audit

- RLS is enabled on every table.
- Public map/profile data is readable where gameplay requires it.
- Private data is scoped to the authenticated user.
- Server-only mutations will be implemented through Edge Functions using service role authorization.
- `audit_logs` records privileged and game-state-changing operations.

## Realtime Tables

Realtime is enabled for:

- Territory influence events.
- Territory ownership history.
- Battles and participants.
- Feed posts, likes and comments.
- Chat messages.
- Notifications.

## Read Projections

- `mv_clan_rankings`: clan leaderboard.
- `mv_player_rankings`: player leaderboard.
- `v_active_battles`: active battle list.
- `v_public_territory_map`: map-friendly territory view.

Materialized views should be refreshed by scheduled backend jobs after Phase 3 introduces operational workers.
