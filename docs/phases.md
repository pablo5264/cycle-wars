# Delivery Phases

## Phase 1: Architecture

Create the repository, project boundaries, shared contracts, CI, environment templates and architectural documentation.

## Phase 2: Data Model

Design PostgreSQL schema, indexes, triggers, RLS, materialized views and seed data for players, territories, routes, clans, seasons, leagues, battles, economy and social systems.

Status: implemented as `supabase/migrations/0002_complete_game_model.sql` with supporting documentation in `docs/DATA_MODEL.md`.

## Phase 3: Backend

Implement Supabase Edge Functions, command handlers, anti-cheat validation, realtime broadcasts, webhooks and rate limits.

Status: implemented with Edge Functions, shared backend helpers and transactional RPCs in `supabase/migrations/0003_backend_rpcs.sql`.

## Phase 4: Frontend

Build the authenticated mobile shell, profile, activity recording, dashboard, social and notification screens.

Status: implemented with Expo screens, app navigation, auth/session handling, Edge Function client, ride recording, map projection view, profile, clan and cosmetic shop.

## Phase 5: Map

Integrate MapLibre, OpenStreetMap tiles, H3 overlays, realtime territory coloring and viewport-based loading.

Status: implemented with MapLibre integration, OpenStreetMap raster style, H3 feature generation, viewport cell loading, realtime territory updates and a fallback renderer.

## Phase 6: Conquest

Implement influence accrual, decay, shields, ownership changes, connected-region capture and season reset behavior.

Status: implemented influence accumulation, shield behavior, scheduled decay, territory level rules and conquest visualization. Connected-region domination remains for later regional-control expansion.

## Phase 7: Battles

Build live same-hex battle detection, ranking factors, animations and result history.

Status: implemented live battle scoring, participant pulses, scorecards, ELO updates, battle result history, active battle endpoint and mobile battle panel. Advanced visual animations can be expanded in the polish pass.

## Phase 8: Social

Friends, follows, feed, likes, comments, route sharing, clan chat and private messages.

Status: implemented feed, likes, comments, friend requests, follows, notifications, private chat, clan chat, route sharing, conquest sharing and a mobile Social tab.

## Phase 9: Economy

Cosmetic-only currencies, inventory, shop, skins, avatars, emblems and non-pay-to-win safeguards.

Status: implemented wallets, catalog, inventory, purchases, equip flow, currency grants, ledger, seed cosmetics and mobile shop UI.

## Phase 10: Optimization

Load testing, database tuning, offline resilience, battery optimization, map rendering performance and observability.

Status: implemented optimization migration, operational tables, rate-limit RPCs, Edge Function throttling, mobile GPS battery adaptation, performance telemetry, static smoke checks and load-test plan. Offline retry queues and deeper map-render profiling remain candidates for a later hardening pass.

## Phase 11: Release Hardening

Prepare a controlled beta launch with offline ride resilience, release gates, rollback guidance and production readiness checks.

Status: implemented session-memory GPS retry queue, release readiness script, CI release check, release checklist and updated smoke checks. Durable offline persistence remains a later requirement before a wide public launch.

## Phase 12: Durable Offline Mode

Persist ride GPS retry data across app restarts so short network loss, app backgrounding and accidental closes do not discard pending samples.

Status: implemented AsyncStorage-backed GPS retry persistence, queue hydration on the ride screen, memory fallback store, expanded smoke checks and release readiness validation.

## Phase 13: Regional Control

Expand territory conquest into aggregate regional objectives using administrative regions and H3 membership.

Status: implemented regional control snapshots, public region control view, internal refresh endpoint, public read endpoint, mobile `Zonas` tab, OpenAPI coverage and operational documentation.

## Phase 14: Season Region Rewards

Reward regional controllers at season boundaries with cosmetic-only currency while keeping settlement server-authoritative and idempotent.

Status: implemented regional reward ledger, idempotent settlement RPC, internal settlement endpoint, authenticated player reward endpoint, mobile reward display, OpenAPI coverage and documentation.

## Phase 15: Player Analytics

Expose player-facing analytics for progress, activity quality, territory influence and regional rewards.

Status: implemented player analytics SQL view, authenticated analytics endpoint, mobile API client, Profile analytics panel, OpenAPI coverage and analytics documentation.

## Phase 16: Weekly Trends

Expose player progress over time so riders can understand recent distance, influence and territory momentum.

Status: implemented weekly trend SQL view, authenticated trend endpoint, mobile API client, Profile weekly trend panel, OpenAPI coverage and analytics documentation.

## Phase 17: Clan Analytics

Expose collective clan progress so squads can understand member strength, territory control, influence and regional rewards.

Status: implemented clan analytics SQL view, authenticated clan analytics endpoint, mobile API client, Clan analytics panel, OpenAPI coverage and analytics documentation.

## Phase 18: Clan Weekly Trends

Expose clan progress over time so squads can track recent activity, influence and contribution momentum.

Status: implemented clan weekly trend SQL view, authenticated clan trend endpoint, mobile API client, Clan weekly trend panel, OpenAPI coverage and analytics documentation.

## Phase 19: Clan Member Drilldown

Expose member-level contribution analytics so clans can see who is driving distance, influence, territory pressure and rewards.

Status: implemented clan member contribution SQL view, authenticated member contribution endpoint, mobile API client, Clan contribution panel, OpenAPI coverage and analytics documentation.

## Phase 20: Clan Governance

Add server-authoritative clan member management with role permissions, removals and audit history.

Status: implemented governance audit table, role permission RPCs, authenticated management endpoint, mobile API client, Clan governance copy, OpenAPI coverage and social/backend documentation.

## Phase 21: Clan Governance Audit

Expose clan governance history so squads can inspect recent role changes and removals with actor, target, reason and timestamp context.

Status: implemented governance audit SQL view, authenticated audit endpoint, mobile API client, Clan audit panel, OpenAPI coverage, smoke checks and social/backend documentation.

## Phase 22: Clan Invitations

Add server-authoritative clan invitations so leaders and captains can recruit eligible riders, and invited riders can accept or decline safely.

Status: implemented clan invitation table, SQL view, invitation RPCs, authenticated endpoint, mobile API client, Clan invitation panel, OpenAPI coverage, smoke checks and social/backend documentation.

## Phase 23: Clan Discovery and Join Requests

Add clan discovery and server-authoritative join requests so riders can find squads and leaders can approve membership safely.

Status: implemented clan join request table, clan directory view, join request RPCs, authenticated endpoint, mobile API client, Clan discovery/request panel, OpenAPI coverage, smoke checks and social/backend documentation.

## Phase 24: Clan Creation

Add server-authoritative clan founding so riders can create squads, become leaders and begin recruitment from the mobile clan screen.

Status: implemented clan creation RPC, slug helper, authenticated create endpoint, mobile API client, Clan creation panel, OpenAPI coverage, smoke checks and social/backend documentation.

## Phase 25: Clan Settings

Add server-authoritative clan settings so leaders can tune recruitment policy and public clan identity from the mobile clan screen.

Status: implemented clan settings RPC, authenticated update endpoint, mobile API client, Clan settings panel, OpenAPI coverage, smoke checks and social/backend documentation.

## Phase 26: Clan Lifecycle

Add clan leave and leadership transfer flows so members can exit safely and leaders can hand off control without breaking clan continuity.

Status: implemented clan lifecycle RPCs, governance audit action expansion, authenticated lifecycle endpoint, mobile API client, Clan lifecycle panel, OpenAPI coverage, smoke checks and social/backend documentation.

## Phase 27: Clan Wars

Add server-authoritative clan war declarations so squads can initiate, track and close organized conflict against rival clans.

Status: implemented clan war table, SQL view, declaration/closure RPCs, authenticated clan war endpoint, mobile API client, Clan wars panel, OpenAPI coverage, smoke checks and social/backend documentation.

## Phase 28: Events and Missions

Add daily, weekly and global mission progression so riders have active objectives beyond conquest and clan play.

Status: implemented event seed data, event progress refresh RPC, player events SQL view, authenticated player-events endpoint, mobile Events tab, OpenAPI coverage, smoke checks and events/backend documentation.

## Phase 29: Event Reward Claims

Add server-authoritative reward claims for completed missions so riders can collect cosmetic economy rewards without duplicate settlement.

Status: implemented event reward claim table, idempotency guard, reward claim RPC, authenticated claim endpoint, mobile Events claim action, OpenAPI coverage, smoke checks and events/backend documentation.

## Phase 30: Event Leaderboards

Add active mission leaderboards so riders can compare event progress and chase top positions during daily, weekly and global objectives.

Status: implemented event leaderboard SQL view, public read endpoint, mobile Events leaderboard panel, OpenAPI coverage, smoke checks and events/backend documentation.

## Phase 31: Event Reward History

Add personal mission reward history so riders can audit recent event payouts after claiming rewards.

Status: implemented event reward history SQL view, authenticated history endpoint, mobile Events history panel, OpenAPI coverage, smoke checks and events/backend documentation.

## Phase 32: Event Schedule

Add upcoming mission discovery so riders can see the next scheduled daily, weekly, monthly and global objectives before they start.

Status: implemented event schedule SQL view, public schedule endpoint, mobile Events schedule panel, OpenAPI coverage, smoke checks and events/backend documentation.

## Phase 33: Event Reminders

Add player-saved reminders for upcoming missions so riders can mark the events they want to return to before they start.

Status: implemented event reminder table and view, authenticated reminder endpoint, mobile reminder action, OpenAPI coverage, smoke checks and events/backend documentation.

## Phase 34: Event Reminder Dispatch

Add scheduled reminder dispatch so active upcoming mission reminders create notification inbox entries when they become due.

Status: implemented due reminder dispatch RPC, service-protected dispatch endpoint, OpenAPI coverage, smoke checks and events/backend documentation.

## Phase 35: Notification Read State

Add notification read actions so riders can clear individual or all unread inbox items after reviewing reminders, clan war alerts and social updates.

Status: implemented authenticated notification POST actions, mobile Social inbox read buttons, OpenAPI coverage, smoke checks and backend/social documentation.

## Phase 36: Notification Badge

Add an unread notification badge on the Social tab so riders can see pending inbox activity before opening the Social screen.

Status: implemented Social tab unread count loading, compact badge rendering, smoke checks and social documentation.

## Phase 37: Notification Filtering

Add unread-only notification filtering so riders can focus the Social inbox on items that still need attention.

Status: implemented unread count, unread-only toggle, empty unread state, smoke checks and social documentation.

## Phase 38: Notification Kind Labels

Add readable notification type labels so riders can quickly tell whether an inbox item is about territory, clan war, event reminders or general alerts.

Status: implemented Social inbox notification kind labels, fallback label, smoke checks and social documentation.

## Phase 39: Notification Category Summary

Add unread notification category totals so riders can quickly see what kinds of inbox items need attention before opening each alert.

Status: implemented unread category aggregation, Social inbox summary chips, smoke checks and social documentation.

## Phase 40: Notification Category Filtering

Add category-based notification filtering so riders can tap an unread category summary and focus the inbox on that notification type.

Status: implemented selected notification category state, category filter actions, empty filtered state, smoke checks and social documentation.

## Phase 41: Notification Filter Reset

Add automatic notification filter reset after bulk read actions so riders return to a clear all-notifications inbox after clearing pending alerts.

Status: implemented mark-all-read filter reset, smoke checks and social documentation.

## Phase 42: Notification Manual Refresh

Add a manual notification refresh action in the Social inbox so riders can pull the latest social alerts, event reminders and clan updates without leaving the screen.

Status: implemented Social inbox refresh action, smoke checks and social documentation.

## Phase 43: Notification Refresh Timestamp

Add a visible Social inbox refresh timestamp so riders can confirm when notifications, event reminders and clan updates were last loaded.

Status: implemented refresh timestamp state, compact inbox label, smoke checks and social documentation.

## Phase 44: Notification Refresh Loading Label

Add an in-progress refresh label to the Social inbox so riders can see when the notification refresh action is actively loading.

Status: implemented refresh action busy label, disabled refresh guard, smoke checks and social documentation.

## Phase 45: Notification Inbox Priority Sorting

Sort the Social notification inbox so unread items appear before read items, with the newest alerts first inside each group.

Status: implemented inbox sorting helper, unread-first display ordering, smoke checks and social documentation.

## Phase 46: Notification Visible Count

Add a visible count to the Social notification inbox so riders can see how many filtered alerts are currently shown out of the total matching inbox items.

Status: implemented visible count label, filtered inbox total display, smoke checks and social documentation.

## Phase 47: Notification Show More

Add a Social inbox show-more action so riders can expand filtered notification results in small batches without leaving the screen.

Status: implemented visible notification limit state, show-more action, smoke checks and social documentation.

## Phase 48: Notification Visible Limit Reset

Reset the Social notification visible limit when riders refresh the inbox, change unread/category filters or clear all alerts so each new view starts from a predictable first page.

Status: implemented visible limit reset helper, filter reset hooks, smoke checks and social documentation.

## Phase 49: Notification Read Status Labels

Add explicit read status labels to each Social inbox item so riders can distinguish pending and read alerts without relying only on text color.

Status: implemented notification status formatter, per-item status labels, smoke checks and social documentation.

## Phase 50: Notification Received Timestamp Labels

Add compact received-time labels to each Social inbox notification so riders can understand when alerts arrived while reviewing filtered inbox results.

Status: implemented notification timestamp formatter, per-item received labels, smoke checks and social documentation.

## Phase 51: Notification Category Active State

Highlight the selected Social inbox notification category so riders can see which unread category filter is currently active.

Status: implemented active category button variant, smoke checks and social documentation.

## Phase 52: Notification Active Filter Count

Add an active filter count to the Social notification inbox so riders can see when unread and category filters are shaping the current list.

Status: implemented active filter counter, visible filter count label, smoke checks and social documentation.

## Phase 53: Notification Clear Filters Action

Add a one-tap clear filters action to the Social notification inbox so riders can return from unread/category filtering to the full inbox quickly.

Status: implemented clear filter helper, visible clear action, smoke checks and social documentation.

## Phase 54: Notification Filter Summary

Add a readable Social inbox filter summary so riders can quickly understand whether they are viewing all notifications, unread alerts or a selected category.

Status: implemented filter summary formatter, visible inbox summary label, smoke checks and social documentation.

## Phase 55: Notification Inbox Total Summary

Add a compact Social inbox total summary so riders can see total, pending and read notification counts while reviewing alerts.

Status: implemented inbox summary formatter, visible total/pending/read label, smoke checks and social documentation.

## Phase 56: Notification Unread Filter Disabled State

Disable the Social inbox unread-only filter when there are no pending notifications and show a clear "Sin pendientes" label instead.

Status: implemented unread filter label helper, disabled no-pending state, smoke checks and social documentation.

## Phase 57: Notification Empty Inbox Guidance

Improve the Social notification empty state with a clearer message and last refresh context so riders understand that the inbox was checked.

Status: implemented empty inbox formatter, refresh-aware empty copy, smoke checks and social documentation.

## Phase 58: Notification Filtered Empty Guidance

Improve the Social notification filtered empty state so riders get a clear explanation when unread/category filters return no matching alerts.

Status: implemented filtered empty formatter, category-aware empty copy, smoke checks and social documentation.

## Phase 59: Notification Filtered Empty Copy Refinement

Refine the Social notification filtered empty copy so category and unread/category combinations read naturally in the inbox.

Status: implemented category-specific empty copy, unread/category empty copy, smoke checks and social documentation.

## Phase 60: Notification Item Separators

Add subtle separators between Social inbox notification items so riders can scan alerts more easily on mobile screens.

Status: implemented notification item style, separator borders, smoke checks and social documentation.

## Phase 61: Notification Unread Item Accent

Add a subtle accent to unread Social inbox items so riders can quickly spot pending alerts while scanning the notification list.

Status: implemented unread notification accent style, pending-item styling, smoke checks and social documentation.

## Phase 62: Notification Read Time Labels

Add read-time labels to reviewed Social inbox notifications so riders can confirm when each alert was marked as read.

Status: implemented read-time formatter, per-item read labels, smoke checks and social documentation.

## Phase 63: Notification Latest Alert Summary

Add a compact latest-alert summary to the Social notification inbox so riders can quickly see the newest matching alert in the current view.

Status: implemented sorted inbox reuse, latest alert formatter, smoke checks and social documentation.

## Phase 64: Notification Oldest Pending Summary

Add an oldest-pending summary to the Social notification inbox so riders can identify the alert that has waited longest for review.

Status: implemented oldest pending formatter, filtered inbox pending summary, smoke checks and social documentation.

## Phase 65: Notification Show Fewer

Add a show-fewer action to the Social notification inbox so riders can collapse expanded filtered lists back to the compact first page.

Status: implemented show-fewer guard, compact reset action, smoke checks and social documentation.

## Phase 66: Notification Oldest Pending Quick Read

Add a quick action to mark the oldest pending Social inbox notification as read so riders can clear the longest-waiting alert first.

Status: implemented oldest pending selector, quick-read action, smoke checks and social documentation.

## Phase 67: Notification Newest Pending Quick Read

Add a quick action to mark the newest pending Social inbox notification as read so riders can clear the latest alert first when reviewing recent activity.

Status: implemented newest pending selector, quick-read action, smoke checks and social documentation.

## Phase 68: Notification Quick Read Dedupe

Hide the oldest-pending quick-read action when it points to the same alert as the newest-pending quick-read action so the Social inbox does not show duplicate actions for one pending notification.

Status: implemented quick-read dedupe guard, oldest action visibility check, smoke checks and social documentation.

## Phase 69: Notification Quick Actions Row Layout

Group Social inbox quick-read actions into a compact wrapping row so newest/oldest pending actions use less vertical space on mobile.

Status: implemented quick actions row style, grouped quick-read controls, smoke checks and social documentation.

## Phase 70: Notification Quick Actions Guidance

Add short guidance copy above Social inbox quick-read actions so riders understand when to use newest-first or oldest-first review.

Status: implemented quick action guidance copy, smoke checks and social documentation.

## Phase 71: Notification Quick Actions Busy Guard

Disable Social inbox quick-read actions while the Social screen is busy and guard notification read mutations against double taps.

Status: implemented busy guard for quick-read actions, smoke checks and social documentation.

## Phase 72: Notification Read Actions Busy Guard

Disable individual and bulk Social inbox read actions while the screen is busy and guard bulk read mutations against repeated taps.

Status: implemented busy guard for notification read actions, smoke checks and social documentation.

## Phase 73: Notification Read Actions Busy Labels

Show in-progress labels on Social inbox read actions so riders can see when a read or bulk-read mutation is being processed.

Status: implemented busy labels for notification read actions, smoke checks and social documentation.

## Phase 74: Notification Filters Busy Guard

Disable Social inbox filter controls while the screen is busy so riders cannot change the notification view during read or refresh operations.

Status: implemented busy guard for notification filters, smoke checks and social documentation.

## Phase 75: Notification Pagination Busy Guard

Disable Social inbox show-more and show-fewer controls while the screen is busy so pagination cannot change during read or refresh operations.

Status: implemented busy guard for notification pagination, smoke checks and social documentation.

## Phase 76: Social Publish Busy Label

Show a processing label on the Social publish action while the screen is busy so riders get immediate feedback after tapping publish.

Status: implemented publish busy label, smoke checks and social documentation.

## Phase 77: Social Share Busy Guard

Guard Social route/conquest sharing against repeated taps and show in-progress labels while share actions are being processed.

Status: implemented share busy guard, share busy labels, smoke checks and social documentation.

## Phase 78: Social Chat Send Busy Guard

Guard Social chat message sending against repeated taps and show an in-progress label while messages are being sent.

Status: implemented chat send busy guard, chat send busy label, smoke checks and social documentation.

## Phase 79: Social Feed Reaction Busy Guard

Guard Social feed likes and comments against repeated taps and show in-progress labels while reaction actions are being processed.

Status: implemented feed reaction busy guard, reaction busy labels, smoke checks and social documentation.

## Phase 80: Social Chat Open Busy Labels

Show in-progress labels on Social private and clan chat open actions while chat threads and messages are being loaded.

Status: implemented chat open busy labels, smoke checks and social documentation.

## Phase 81: Social Chat Open Busy Guard

Guard Social private and clan chat open actions against repeated taps before the chat thread has finished loading.

Status: implemented chat open busy guard, smoke checks and social documentation.

## Phase 82: Social Action Status Reset

Clear stale Social status messages when starting feed reactions, sharing and chat send actions so riders only see feedback for the current operation.

Status: implemented status reset for Social actions, smoke checks and social documentation.

## Phase 83: Notification Action Status Reset

Clear stale Social status messages when starting individual and bulk notification read actions so notification feedback reflects the current operation.

Status: implemented status reset for notification read actions, smoke checks and social documentation.

## Phase 84: Social Input Busy Guard

Disable Social text inputs while actions are busy so riders cannot edit fields during publish, share, chat or notification operations.

Status: implemented Social input disabled state, smoke checks and social documentation.

## Phase 85: Social Empty Action Disabled State

Disable Social actions that require text or ids until their required input has content so riders do not hit avoidable validation errors.

Status: implemented empty-input disabled state for Social actions, smoke checks and social documentation.

## Phase 86: Social Empty Action Labels

Show clear disabled-action labels on Social buttons when required text or ids are missing so riders know what to enter next.

Status: implemented empty-action labels, smoke checks and social documentation.

## Phase 87: Social Feed Empty State

Show a helpful empty state when the Social feed has no posts so riders know how to start activity in the feed.

Status: implemented Social feed empty state, smoke checks and social documentation.

## Phase 88: Social Feed Summary

Show a compact Social feed count summary when posts are loaded so riders can quickly confirm how much activity is visible.

Status: implemented Social feed summary, smoke checks and social documentation.

## Phase 89: Social Feed Engagement Summary

Add total likes and comments to the Social feed summary so riders can quickly confirm visible engagement after reactions update.

Status: implemented Social feed engagement summary, smoke checks and social documentation.

## Phase 90: Social Latest Post Summary

Show a compact latest-post summary in the Social feed so riders can confirm the newest visible author and date at a glance.

Status: implemented Social latest post summary, smoke checks and social documentation.

## Phase 91: Social Feed Type Summary

Show text-post and conquest-share counts in the Social feed summary so riders can see what kind of activity is visible.

Status: implemented Social feed type summary, smoke checks and social documentation.

## Phase 92: Social Feed Route Share Summary

Separate route shares from text posts and conquest shares in the Social feed type summary so riders can see what kind of activity is visible.

Status: implemented Social feed route share summary, smoke checks and social documentation.

## Phase 93: Social Latest Post Preview

Show a short preview of the latest Social feed post so riders can quickly recognize the newest visible activity.

Status: implemented Social latest post preview, smoke checks and social documentation.

## Phase 94: Social Latest Post Kind Summary

Show whether the latest Social feed post is text, a route share or a conquest share so riders can understand the newest activity at a glance.

Status: implemented Social latest post kind summary, smoke checks and social documentation.

## Phase 95: Social Latest Post Engagement Summary

Show likes and comments for the latest Social feed post so riders can verify newest-post reactions at a glance.

Status: implemented Social latest post engagement summary, smoke checks and social documentation.

## Phase 96: Social Latest Post Freshness Summary

Show whether the latest Social feed post is from today or how many days old it is so riders can judge feed freshness quickly.

Status: implemented Social latest post freshness summary, smoke checks and social documentation.

## Phase 97: Social Feed Average Engagement Summary

Show average interactions per visible Social feed post so riders can quickly compare engagement density.

Status: implemented Social feed average engagement summary, smoke checks and social documentation.

## Phase 98: Social Feed Top Engagement Summary

Show the visible Social feed post with the highest combined likes and comments so riders can spot the current leader.

Status: implemented Social feed top engagement summary, smoke checks and social documentation.

## Phase 99: Social Feed Quiet Posts Summary

Show how many visible Social feed posts have no likes or comments so riders can spot activity that still needs engagement.

Status: implemented Social feed quiet posts summary, smoke checks and social documentation.

## Phase 100: Social Feed Active Posts Summary

Show how many visible Social feed posts have at least one like or comment so riders can see active engagement coverage.

Status: implemented Social feed active posts summary, smoke checks and social documentation.

## Phase 101: Social Feed Engagement Coverage Summary

Show the percentage of visible Social feed posts with at least one like or comment so riders can read engagement coverage quickly.

Status: implemented Social feed engagement coverage summary, smoke checks and social documentation.

## Phase 102: Construction Closeout and Testing Handoff

Close the current construction cycle and document the handoff into testing, stabilization and release-readiness work.

Status: implemented construction closeout document, README state update, smoke check and testing handoff.

## Phase 103: Mobile Testing Environment Checklist

Document the Android testing environment, APK build, install, launch and manual QA paths needed to start post-construction validation.

Status: implemented mobile testing checklist, README state update and smoke check coverage.

## Phase 104: Mobile QA Report Template

Add a reusable mobile QA report template for recording APK, emulator, physical-device, manual-flow and crash-log evidence.

Status: implemented mobile QA report template, mobile testing link, README state update and smoke check coverage.

## Phase 105: Android Device And ADB Setup Guide

Document the Android Studio, SDK, ADB, emulator and physical phone checks needed before installing and launching the APK.

Status: implemented Android device setup guide, mobile testing link, README state update and smoke check coverage.

## Phase 106: APK Build Troubleshooting Guide

Document the common Gradle, Maven, Metro, React Native CLI, Java and SDK failures that can block release APK generation.

Status: implemented APK build troubleshooting guide, mobile testing link, README state update and smoke check coverage.

## Phase 107: Android Log Triage Guide

Document how to clear, reproduce, capture and classify Android, React Native, bundle and permission failures during APK QA.

Status: implemented Android log triage guide, QA report link, README state update and smoke check coverage.
