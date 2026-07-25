# CYCLE WARS

Cycle Wars is a React Native and Supabase game where cycling activity conquers real-world H3 territories in real time.

## Phase 1 Scope

This repository contains the production architecture foundation:

- Expo React Native mobile app with TypeScript.
- Shared domain package for entities, value objects, use cases and contracts.
- Supabase folder with migrations and Edge Function structure.
- Clean Architecture boundaries: Presentation, Application, Domain, Infrastructure, Data.
- Documentation for architecture, API, security, delivery phases and decisions.
- CI pipeline for linting, type checking and tests.
- Complete Phase 2 PostgreSQL game model for clans, seasons, activities, GPS, territories, battles, social, economy, achievements, anti-cheat and audit.
- Phase 3 Supabase Edge Functions for activities, GPS ingestion, conquest, battles, cosmetic purchases, map reads and ranking refresh.
- Phase 4 Expo mobile frontend with auth entry, app navigation, ride recording, territory map projection, profile, clan and shop screens.
- Phase 5 MapLibre/OpenStreetMap map layer with H3 overlays, viewport loading, realtime territory updates and local fallback rendering.
- Phase 6 conquest system with accumulated influence, shields, decay, territory levels and visual progress in map/ride screens.
- Phase 7 battle system with live participant scoring, ELO updates, scorecards, result history and mobile battle UI.
- Phase 8 social system with feed, likes, comments, friend requests, follows, notifications, private chat, clan chat and route/conquest sharing.
- Phase 9 cosmetic economy with wallets, catalog, inventory, equip flow, ledger and anti pay-to-win constraints.
- Phase 10 optimization layer with rate limits, observability tables, adaptive mobile GPS, performance telemetry, smoke checks and load-test plan.
- Phase 11 release hardening with offline GPS retry queue, readiness checks, beta gates and rollback guidance.
- Phase 12 durable offline mode with AsyncStorage-backed GPS retry persistence.
- Phase 13 regional control with aggregate region snapshots, API endpoints and mobile Zonas tab.
- Phase 14 season region rewards with idempotent cosmetic currency settlement.
- Phase 15 player analytics with profile KPIs, ELO, influence and reward progress.
- Phase 16 weekly trends with distance, influence and territory momentum in the profile.
- Phase 17 clan analytics with member, territory, influence, region and reward metrics.
- Phase 18 clan weekly trends with active members, distance, influence and rewards over time.
- Phase 19 clan member drilldown with per-member contribution scores and activity metrics.
- Phase 20 clan governance with role management, removals and audit trail.
- Phase 21 clan governance audit with readable history for role changes and removals.
- Phase 22 clan invitations with server-authoritative send, accept and decline flows.
- Phase 23 clan discovery and join requests with approval-aware membership.
- Phase 24 clan creation with founder leader assignment.
- Phase 25 clan settings with leader-controlled recruitment policy.
- Phase 26 clan lifecycle with safe leaving and leadership transfer.
- Phase 27 clan wars with declarations, closures and target notifications.
- Phase 28 events and missions with player progress tracking.
- Phase 29 event reward claims with duplicate-safe cosmetic currency settlement.
- Phase 30 event leaderboards with active mission rankings.
- Phase 31 event reward history with recent claimed mission payouts.
- Phase 32 event schedule with upcoming mission discovery.
- Phase 33 event reminders with player-saved upcoming mission alerts.
- Phase 34 event reminder dispatch with scheduled notification creation.
- Phase 35 notification read state with mobile inbox actions.
- Phase 36 notification badge with unread Social tab count.
- Phase 37 notification filtering with unread-only Social inbox mode.
- Phase 38 notification kind labels for clearer Social inbox scanning.
- Phase 39 notification category summary for unread Social inbox triage.
- Phase 40 notification category filtering for focused Social inbox review.
- Phase 41 notification filter reset after bulk read actions.
- Phase 42 notification manual refresh for Social inbox updates.
- Phase 43 notification refresh timestamp for Social inbox confidence.
- Phase 44 notification refresh loading label for clearer Social inbox feedback.
- Phase 45 notification inbox priority sorting for unread and recent alerts.
- Phase 46 notification visible count for filtered Social inbox lists.
- Phase 47 notification show-more action for longer Social inbox lists.
- Phase 48 notification visible limit reset for filter and refresh changes.
- Phase 49 notification read status labels for clearer Social inbox scanning.
- Phase 50 notification received timestamp labels for Social inbox alerts.
- Phase 51 notification category active state for focused Social inbox filters.
- Phase 52 notification active filter count for Social inbox clarity.
- Phase 53 notification clear filters action for Social inbox reset.
- Phase 54 notification filter summary for readable Social inbox context.
- Phase 55 notification inbox total summary for Social inbox review.
- Phase 56 notification unread filter disabled state when no pending alerts remain.
- Phase 57 notification empty inbox guidance for Social review.
- Phase 58 notification filtered empty guidance for Social inbox filters.
- Phase 59 notification filtered empty copy refinement.
- Phase 60 notification item separators for clearer Social inbox scanning.
- Phase 61 notification unread item accent for pending Social inbox alerts.
- Phase 62 notification read time labels for reviewed Social inbox alerts.
- Phase 63 notification latest alert summary for Social inbox context.
- Phase 64 notification oldest pending summary for Social inbox triage.
- Phase 65 notification show-fewer action for compact Social inbox review.
- Phase 66 notification oldest pending quick-read action.
- Phase 67 notification newest pending quick-read action.
- Phase 68 notification quick-read action dedupe.
- Phase 69 notification quick actions row layout.
- Phase 70 notification quick actions guidance copy.
- Phase 71 notification quick actions busy guard.
- Phase 72 notification read actions busy guard.
- Phase 73 notification read actions busy labels.
- Phase 74 notification filters busy guard.
- Phase 75 notification pagination busy guard.
- Phase 76 social publish busy label.
- Phase 77 social share busy guard.
- Phase 78 social chat send busy guard.
- Phase 79 social feed reaction busy guard.
- Phase 80 social chat open busy labels.
- Phase 81 social chat open busy guard.
- Phase 82 social action status reset.
- Phase 83 notification action status reset.
- Phase 84 social input busy guard.
- Phase 85 social empty action disabled state.
- Phase 86 social empty action labels.
- Phase 87 social feed empty state.
- Phase 88 social feed summary.
- Phase 89 social feed engagement summary.
- Phase 90 social latest post summary.
- Phase 91 social feed type summary.
- Phase 92 social feed route share summary.

Later phases can deepen member history, governance UX, region boundary overlays and creator/community operations.

## Why This Shape

The domain is isolated from Expo and Supabase because territory conquest, influence decay, shields, leagues and anti-cheat rules must be testable without a device or database. The mobile app depends on interfaces, while infrastructure adapters implement those interfaces using Supabase, GPS, MapLibre and platform services.

## Getting Started

1. Install Node.js 20 or newer.
2. Install dependencies:

```bash
npm install
```

3. Copy environment values:

```bash
cp .env.example .env
```

4. Start the mobile app:

```bash
npm run dev
```

5. Start local Supabase when the CLI is installed:

```bash
npm run supabase:start
```

## Project Layout

```text
apps/mobile                  Expo React Native app
packages/shared              Domain, application services and contracts
supabase/migrations          PostgreSQL schema changes
supabase/functions           Edge Functions
docs                         Architecture, API and delivery documentation
scripts                      Operational scripts
```

## Current Delivery State

- Phase 1: architecture foundation complete.
- Phase 2: complete data model migration and documentation complete.
- Phase 3: backend Edge Functions and transactional game RPCs complete.
- Phase 4: mobile frontend shell and core gameplay screens complete.
- Phase 5: map, H3 overlay and realtime territory visualization complete.
- Phase 6: conquest loop, decay, shields and territory leveling complete.
- Phase 7: live battle scoring and resolution complete.
- Phase 8: social feed, graph and chat complete.
- Phase 9: cosmetic economy and shop complete.
- Phase 10: optimization, observability and performance guardrails complete.
- Phase 11: release hardening and offline GPS retry complete.
- Phase 12: durable offline GPS queue complete.
- Phase 13: regional control complete.
- Phase 14: season regional rewards complete.
- Phase 15: player analytics complete.
- Phase 16: weekly trends complete.
- Phase 17: clan analytics complete.
- Phase 18: clan weekly trends complete.
- Phase 19: clan member drilldown complete.
- Phase 20: clan governance complete.
- Phase 21: clan governance audit complete.
- Phase 22: clan invitations complete.
- Phase 23: clan discovery and join requests complete.
- Phase 24: clan creation complete.
- Phase 25: clan settings complete.
- Phase 26: clan lifecycle complete.
- Phase 27: clan wars complete.
- Phase 28: events and missions complete.
- Phase 29: event reward claims complete.
- Phase 30: event leaderboards complete.
- Phase 31: event reward history complete.
- Phase 32: event schedule complete.
- Phase 33: event reminders complete.
- Phase 34: event reminder dispatch complete.
- Phase 35: notification read state complete.
- Phase 36: notification badge complete.
- Phase 37: notification filtering complete.
- Phase 38: notification kind labels complete.
- Phase 39: notification category summary complete.
- Phase 40: notification category filtering complete.
- Phase 41: notification filter reset complete.
- Phase 42: notification manual refresh complete.
- Phase 43: notification refresh timestamp complete.
- Phase 44: notification refresh loading label complete.
- Phase 45: notification inbox priority sorting complete.
- Phase 46: notification visible count complete.
- Phase 47: notification show-more action complete.
- Phase 48: notification visible limit reset complete.
- Phase 49: notification read status labels complete.
- Phase 50: notification received timestamp labels complete.
- Phase 51: notification category active state complete.
- Phase 52: notification active filter count complete.
- Phase 53: notification clear filters action complete.
- Phase 54: notification filter summary complete.
- Phase 55: notification inbox total summary complete.
- Phase 56: notification unread filter disabled state complete.
- Phase 57: notification empty inbox guidance complete.
- Phase 58: notification filtered empty guidance complete.
- Phase 59: notification filtered empty copy refinement complete.
- Phase 60: notification item separators complete.
- Phase 61: notification unread item accent complete.
- Phase 62: notification read time labels complete.
- Phase 63: notification latest alert summary complete.
- Phase 64: notification oldest pending summary complete.
- Phase 65: notification show-fewer action complete.
- Phase 66: notification oldest pending quick-read action complete.
- Phase 67: notification newest pending quick-read action complete.
- Phase 68: notification quick-read action dedupe complete.
- Phase 69: notification quick actions row layout complete.
- Phase 70: notification quick actions guidance complete.
- Phase 71: notification quick actions busy guard complete.
- Phase 72: notification read actions busy guard complete.
- Phase 73: notification read actions busy labels complete.
- Phase 74: notification filters busy guard complete.
- Phase 75: notification pagination busy guard complete.
- Phase 76: social publish busy label complete.
- Phase 77: social share busy guard complete.
- Phase 78: social chat send busy guard complete.
- Phase 79: social feed reaction busy guard complete.
- Phase 80: social chat open busy labels complete.
- Phase 81: social chat open busy guard complete.
- Phase 82: social action status reset complete.
- Phase 83: notification action status reset complete.
- Phase 84: social input busy guard complete.
- Phase 85: social empty action disabled state complete.
- Phase 86: social empty action labels complete.
- Phase 87: social feed empty state complete.
- Phase 88: social feed summary complete.
- Phase 89: social feed engagement summary complete.
- Phase 90: social latest post summary complete.
- Phase 91: social feed type summary complete.
- Phase 92: social feed route share summary complete.

## Quality Gates

```bash
npm run typecheck
npm run lint
npm run test
npm run smoke:static
npm run release:check
```

The target for production phases is over 90% coverage on domain and application logic, with integration and E2E coverage for critical ride, conquest and auth flows.
