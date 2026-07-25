import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "apps/mobile/src/presentation/navigation/AppNavigator.tsx",
  "apps/mobile/src/infrastructure/location/LocationTracker.ts",
  "docs/api/openapi.yaml",
  "docs/RELEASE.md",
  "docs/ANALYTICS.md",
  "docs/EVENTS.md",
  "docs/REGIONAL_CONTROL.md",
  "supabase/migrations/0009_optimization_observability.sql",
  "supabase/migrations/0010_regional_control.sql",
  "supabase/migrations/0011_season_region_rewards.sql",
  "supabase/migrations/0012_player_analytics.sql",
  "supabase/migrations/0013_player_weekly_trends.sql",
  "supabase/migrations/0014_clan_analytics.sql",
  "supabase/migrations/0015_clan_weekly_trends.sql",
  "supabase/migrations/0016_clan_member_contributions.sql",
  "supabase/migrations/0017_clan_governance.sql",
  "supabase/migrations/0018_clan_governance_audit_view.sql",
  "supabase/migrations/0019_clan_invitations.sql",
  "supabase/migrations/0020_clan_join_requests.sql",
  "supabase/migrations/0021_clan_creation.sql",
  "supabase/migrations/0022_clan_settings.sql",
  "supabase/migrations/0023_clan_lifecycle.sql",
  "supabase/migrations/0024_clan_wars.sql",
  "supabase/migrations/0025_events_missions.sql",
  "supabase/migrations/0026_event_reward_claims.sql",
  "supabase/migrations/0027_event_leaderboards.sql",
  "supabase/migrations/0028_event_reward_history.sql",
  "supabase/migrations/0029_event_schedule.sql",
  "supabase/migrations/0030_event_reminders.sql",
  "supabase/migrations/0031_event_reminder_dispatch.sql",
  "supabase/functions/record-performance/index.ts",
  "supabase/functions/get-region-control/index.ts",
  "supabase/functions/refresh-region-control/index.ts",
  "supabase/functions/settle-region-rewards/index.ts",
  "supabase/functions/player-region-rewards/index.ts",
  "supabase/functions/player-weekly-trends/index.ts",
  "supabase/functions/clan-analytics/index.ts",
  "supabase/functions/clan-weekly-trends/index.ts",
  "supabase/functions/clan-member-contributions/index.ts",
  "supabase/functions/manage-clan-member/index.ts",
  "supabase/functions/clan-governance-audit/index.ts",
  "supabase/functions/clan-invitations/index.ts",
  "supabase/functions/clan-join-requests/index.ts",
  "supabase/functions/create-clan/index.ts",
  "supabase/functions/update-clan-settings/index.ts",
  "supabase/functions/clan-lifecycle/index.ts",
  "supabase/functions/clan-wars/index.ts",
  "supabase/functions/player-events/index.ts",
  "supabase/functions/claim-event-reward/index.ts",
  "supabase/functions/event-leaderboard/index.ts",
  "supabase/functions/player-event-reward-history/index.ts",
  "supabase/functions/event-schedule/index.ts",
  "supabase/functions/event-reminders/index.ts",
  "supabase/functions/dispatch-event-reminders/index.ts",
  "apps/mobile/src/infrastructure/offline/OfflineRideQueue.ts",
  "apps/mobile/src/infrastructure/offline/OfflineRideQueueStore.ts",
  "apps/mobile/src/presentation/screens/RegionScreen.tsx"
];

const requiredFunctions = [
  "ingest-gps-sample",
  "get-territory-map",
  "create-feed-post",
  "send-chat-message",
  "purchase-shop-item",
  "record-performance",
  "get-region-control",
  "refresh-region-control",
  "settle-region-rewards",
  "player-region-rewards",
  "player-analytics",
  "player-weekly-trends",
  "clan-analytics",
  "clan-weekly-trends",
  "clan-member-contributions",
  "manage-clan-member",
  "clan-governance-audit",
  "clan-invitations",
  "clan-join-requests",
  "create-clan",
  "update-clan-settings",
  "clan-lifecycle",
  "clan-wars",
  "player-events",
  "claim-event-reward",
  "event-leaderboard",
  "player-event-reward-history",
  "event-schedule",
  "event-reminders",
  "dispatch-event-reminders"
];

const requiredMigrationSnippets = [
  "create table public.edge_function_logs",
  "create table public.rate_limit_events",
  "create table public.mobile_performance_events",
  "create or replace function public.check_rate_limit",
  "create or replace view public.v_operational_health"
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const file of requiredFiles) {
  assert(existsSync(path.join(root, file)), `Missing required file: ${file}`);
}

for (const functionName of requiredFunctions) {
  assert(
    existsSync(path.join(root, "supabase/functions", functionName, "index.ts")),
    `Missing Edge Function: ${functionName}`
  );
}

const migrations = readdirSync(path.join(root, "supabase/migrations")).filter((file) =>
  file.endsWith(".sql")
);
assert(migrations.length >= 9, `Expected at least 9 migrations, found ${migrations.length}`);

const phaseTenMigration = readFileSync(
  path.join(root, "supabase/migrations/0009_optimization_observability.sql"),
  "utf8"
).toLowerCase();
for (const snippet of requiredMigrationSnippets) {
  assert(phaseTenMigration.includes(snippet), `Missing migration snippet: ${snippet}`);
}

const rideScreen = readFileSync(
  path.join(root, "apps/mobile/src/presentation/screens/RideScreen.tsx"),
  "utf8"
);
assert(
  rideScreen.includes("optimizedRideLocation") &&
    rideScreen.includes("recordPerformanceEvent") &&
    rideScreen.includes("offlineRideQueue") &&
    rideScreen.includes(".hydrate()"),
  "Ride screen must use optimized GPS, performance telemetry and hydrated offline queue."
);

const mobilePackage = readFileSync(path.join(root, "apps/mobile/package.json"), "utf8");
assert(
  mobilePackage.includes("@react-native-async-storage/async-storage"),
  "Mobile package must include AsyncStorage for durable offline GPS queue."
);

const openApi = readFileSync(path.join(root, "docs/api/openapi.yaml"), "utf8");
assert(openApi.includes("/record-performance:"), "OpenAPI must document record-performance.");
assert(openApi.includes("/get-region-control:"), "OpenAPI must document get-region-control.");
assert(openApi.includes("/refresh-region-control:"), "OpenAPI must document refresh-region-control.");
assert(openApi.includes("/settle-region-rewards:"), "OpenAPI must document settle-region-rewards.");
assert(openApi.includes("/player-region-rewards:"), "OpenAPI must document player-region-rewards.");
assert(openApi.includes("/player-analytics:"), "OpenAPI must document player-analytics.");
assert(openApi.includes("/player-weekly-trends:"), "OpenAPI must document player-weekly-trends.");
assert(openApi.includes("/player-events:"), "OpenAPI must document player-events.");
assert(openApi.includes("/claim-event-reward:"), "OpenAPI must document claim-event-reward.");
assert(openApi.includes("/event-leaderboard:"), "OpenAPI must document event-leaderboard.");
assert(openApi.includes("/player-event-reward-history:"), "OpenAPI must document player-event-reward-history.");
assert(openApi.includes("/event-schedule:"), "OpenAPI must document event-schedule.");
assert(openApi.includes("/event-reminders:"), "OpenAPI must document event-reminders.");
assert(openApi.includes("/dispatch-event-reminders:"), "OpenAPI must document dispatch-event-reminders.");
assert(openApi.includes("/clan-analytics:"), "OpenAPI must document clan-analytics.");
assert(openApi.includes("/clan-weekly-trends:"), "OpenAPI must document clan-weekly-trends.");
assert(openApi.includes("/clan-member-contributions:"), "OpenAPI must document clan-member-contributions.");
assert(openApi.includes("/manage-clan-member:"), "OpenAPI must document manage-clan-member.");
assert(openApi.includes("/clan-governance-audit:"), "OpenAPI must document clan-governance-audit.");
assert(openApi.includes("/clan-invitations:"), "OpenAPI must document clan-invitations.");
assert(openApi.includes("/clan-join-requests:"), "OpenAPI must document clan-join-requests.");
assert(openApi.includes("/create-clan:"), "OpenAPI must document create-clan.");
assert(openApi.includes("/update-clan-settings:"), "OpenAPI must document update-clan-settings.");
assert(openApi.includes("/clan-lifecycle:"), "OpenAPI must document clan-lifecycle.");
assert(openApi.includes("/clan-wars:"), "OpenAPI must document clan-wars.");

const phaseThirteenMigration = readFileSync(
  path.join(root, "supabase/migrations/0010_regional_control.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseThirteenMigration.includes("create or replace function public.refresh_region_control"),
  "Phase 13 migration must refresh regional control."
);
assert(
  phaseThirteenMigration.includes("create or replace view public.v_region_control"),
  "Phase 13 migration must expose regional control view."
);

const phaseFourteenMigration = readFileSync(
  path.join(root, "supabase/migrations/0011_season_region_rewards.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseFourteenMigration.includes("create table public.season_region_rewards"),
  "Phase 14 migration must create season region rewards."
);
assert(
  phaseFourteenMigration.includes("create or replace function public.settle_region_season_rewards"),
  "Phase 14 migration must settle season region rewards."
);

const regionScreen = readFileSync(
  path.join(root, "apps/mobile/src/presentation/screens/RegionScreen.tsx"),
  "utf8"
);
assert(
  regionScreen.includes("getPlayerRegionRewards") && regionScreen.includes("Mis premios regionales"),
  "Region screen must show player regional rewards."
);

const phaseFifteenMigration = readFileSync(
  path.join(root, "supabase/migrations/0012_player_analytics.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseFifteenMigration.includes("create or replace view public.v_player_analytics"),
  "Phase 15 migration must expose player analytics view."
);

const profileScreen = readFileSync(
  path.join(root, "apps/mobile/src/presentation/screens/ProfileScreen.tsx"),
  "utf8"
);
assert(
  profileScreen.includes("getPlayerAnalytics") && profileScreen.includes("Analytics"),
  "Profile screen must show player analytics."
);
assert(
  profileScreen.includes("getPlayerWeeklyTrends") && profileScreen.includes("Tendencia semanal"),
  "Profile screen must show weekly trends."
);

const appNavigator = readFileSync(
  path.join(root, "apps/mobile/src/presentation/navigation/AppNavigator.tsx"),
  "utf8"
);
assert(
  appNavigator.includes("EventsScreen") && appNavigator.includes("Eventos"),
  "App navigator must expose Events tab."
);
assert(
  appNavigator.includes("unreadNotificationCount") && appNavigator.includes("9+"),
  "App navigator must show unread notification badge."
);

const eventsScreen = readFileSync(
  path.join(root, "apps/mobile/src/presentation/screens/EventsScreen.tsx"),
  "utf8"
);
assert(
  eventsScreen.includes("getPlayerEvents") && eventsScreen.includes("Misiones activas"),
  "Events screen must show player missions."
);
assert(
  eventsScreen.includes("claimEventReward") && eventsScreen.includes("Reclamar recompensa"),
  "Events screen must allow completed mission reward claims."
);
assert(
  eventsScreen.includes("getEventLeaderboard") && eventsScreen.includes("Ranking de mision"),
  "Events screen must show event leaderboards."
);
assert(
  eventsScreen.includes("getPlayerEventRewardHistory") && eventsScreen.includes("Historial de recompensas"),
  "Events screen must show event reward history."
);
assert(
  eventsScreen.includes("getEventSchedule") && eventsScreen.includes("Proximas misiones"),
  "Events screen must show upcoming event schedule."
);
assert(
  eventsScreen.includes("setEventReminder") && eventsScreen.includes("Recordarme"),
  "Events screen must allow upcoming event reminders."
);

const notificationsFunction = readFileSync(
  path.join(root, "supabase/functions/notifications/index.ts"),
  "utf8"
);
assert(
  notificationsFunction.includes("mark_all_read") && notificationsFunction.includes("mark_read"),
  "Notifications function must support read-state actions."
);

const socialScreen = readFileSync(
  path.join(root, "apps/mobile/src/presentation/screens/SocialScreen.tsx"),
  "utf8"
);
assert(
  socialScreen.includes("markNotificationRead") && socialScreen.includes("Marcar leida"),
  "Social screen must allow individual notification read actions."
);
assert(
  socialScreen.includes("markAllNotificationsRead") && socialScreen.includes("Marcar todas leidas"),
  "Social screen must allow bulk notification read actions."
);
assert(
  socialScreen.includes("showUnreadOnly") && socialScreen.includes("Solo no leidas"),
  "Social screen must allow unread-only notification filtering."
);
assert(
  socialScreen.includes("No quedan notificaciones sin leer"),
  "Social screen must show an empty unread notification state."
);
assert(
  socialScreen.includes("formatNotificationKind") && socialScreen.includes("Territorio ganado"),
  "Social screen must label notification kinds."
);
assert(
  socialScreen.includes("summarizeUnreadNotifications") && socialScreen.includes("unreadSummary"),
  "Social screen must summarize unread notification categories."
);
assert(
  socialScreen.includes("selectedNotificationKind") && socialScreen.includes("Ver categorias"),
  "Social screen must allow category notification filtering."
);
assert(
  socialScreen.includes("No hay notificaciones para esta vista") &&
    socialScreen.includes("No hay notificaciones de"),
  "Social screen must show an empty category-filtered notification state."
);
assert(
  socialScreen.includes("setSelectedNotificationKind(null)") &&
    socialScreen.includes("setShowUnreadOnly(false)"),
  "Social screen must reset notification filters after bulk read actions."
);
assert(
  socialScreen.includes("notificationRefreshLabel") &&
    socialScreen.includes("Actualizar") &&
    socialScreen.includes("Actualizando") &&
    socialScreen.includes("void load()"),
  "Social screen must allow manual notification refresh."
);
assert(
  socialScreen.includes("lastSocialRefreshAt") && socialScreen.includes("Actualizado"),
  "Social screen must show the latest notification refresh timestamp."
);
assert(
  socialScreen.includes("sortNotificationsForInbox") &&
    socialScreen.includes("getNotificationTimestamp") &&
    socialScreen.includes("filteredNotifications"),
  "Social screen must sort notification inbox items by unread and recent priority."
);
assert(
  socialScreen.includes("notificationVisibleCountLabel") &&
    socialScreen.includes("Mostrando"),
  "Social screen must show how many filtered notifications are visible."
);
assert(
  socialScreen.includes("notificationVisibleLimit") &&
    socialScreen.includes("canShowMoreNotifications") &&
    socialScreen.includes("Ver mas"),
  "Social screen must allow riders to reveal more filtered notifications."
);
assert(
  socialScreen.includes("resetNotificationVisibleLimit") &&
    socialScreen.includes("setNotificationVisibleLimit(5)"),
  "Social screen must reset visible notification limit when inbox filters change."
);
assert(
  socialScreen.includes("formatNotificationStatus") &&
    socialScreen.includes("Pendiente") &&
    socialScreen.includes("Leida"),
  "Social screen must label notification read status."
);
assert(
  socialScreen.includes("formatNotificationCreatedAt") &&
    socialScreen.includes("Recibida"),
  "Social screen must show received timestamp labels for notifications."
);
assert(
  socialScreen.includes('selectedNotificationKind === item.kind ? "primary" : "secondary"'),
  "Social screen must highlight the selected notification category filter."
);
assert(
  socialScreen.includes("countActiveNotificationFilters") &&
    socialScreen.includes("Filtros activos"),
  "Social screen must show active notification filter count."
);
assert(
  socialScreen.includes("clearNotificationFilters") &&
    socialScreen.includes("Limpiar filtros"),
  "Social screen must let riders clear active notification filters."
);
assert(
  socialScreen.includes("formatNotificationFilterSummary") &&
    socialScreen.includes("Vista:"),
  "Social screen must show a readable notification filter summary."
);
assert(
  socialScreen.includes("formatNotificationInboxSummary") &&
    socialScreen.includes("Bandeja:"),
  "Social screen must show notification inbox total summary."
);
assert(
  socialScreen.includes("formatUnreadFilterLabel") &&
    socialScreen.includes("Sin pendientes") &&
    socialScreen.includes("isUnreadFilterDisabled"),
  "Social screen must disable unread filter when there are no pending notifications."
);
assert(
  socialScreen.includes("formatEmptyNotificationInboxMessage") &&
    socialScreen.includes("Sin notificaciones por ahora"),
  "Social screen must show guided empty notification inbox state."
);
assert(
  socialScreen.includes("formatEmptyFilteredNotificationMessage") &&
    socialScreen.includes("No hay notificaciones para esta vista"),
  "Social screen must show guided empty notification filter state."
);
assert(
  socialScreen.includes("No hay notificaciones sin leer de") &&
    socialScreen.includes("No hay notificaciones de"),
  "Social screen must show refined category empty notification copy."
);
assert(
  socialScreen.includes("notificationItemStyle") &&
    socialScreen.includes("borderBottomColor"),
  "Social screen must separate notification inbox items visually."
);
assert(
  socialScreen.includes("unreadNotificationItemStyle") &&
    socialScreen.includes("borderLeftColor"),
  "Social screen must accent unread notification inbox items."
);
assert(
  socialScreen.includes("formatNotificationReadAt") &&
    socialScreen.includes("Leida {formatNotificationReadAt(notification)}"),
  "Social screen must show read time labels for reviewed notifications."
);
assert(
  socialScreen.includes("formatLatestNotificationSummary") &&
    socialScreen.includes("Ultima alerta:") &&
    socialScreen.includes("sortedFilteredNotifications"),
  "Social screen must show latest notification summary for the current view."
);
assert(
  socialScreen.includes("formatOldestPendingNotificationSummary") &&
    socialScreen.includes("Pendiente mas antigua:"),
  "Social screen must show oldest pending notification summary for the current view."
);
assert(
  socialScreen.includes("canShowFewerNotifications") &&
    socialScreen.includes("Ver menos"),
  "Social screen must let riders collapse expanded notification lists."
);
assert(
  socialScreen.includes("getOldestPendingNotification") &&
    socialScreen.includes("oldestPendingNotification") &&
    socialScreen.includes("Marcar mas antigua leida"),
  "Social screen must let riders mark the oldest pending notification as read."
);
assert(
  socialScreen.includes("getNewestPendingNotification") &&
    socialScreen.includes("newestPendingNotification") &&
    socialScreen.includes("Marcar mas reciente leida"),
  "Social screen must let riders mark the newest pending notification as read."
);
assert(
  socialScreen.includes("canShowOldestPendingQuickRead") &&
    socialScreen.includes("oldestPendingNotification?.id !== newestPendingNotification?.id"),
  "Social screen must avoid duplicate quick-read actions for one pending notification."
);
assert(
  socialScreen.includes("notificationQuickActionsStyle") &&
    socialScreen.includes('flexDirection: "row"'),
  "Social screen must group notification quick actions in a compact row."
);
assert(
  socialScreen.includes("Acciones rapidas:") &&
    socialScreen.includes("lo que lleva mas tiempo pendiente"),
  "Social screen must explain notification quick-read actions."
);
assert(
  socialScreen.includes("if (isBusy)") &&
    socialScreen.includes("setIsBusy(true)") &&
    socialScreen.includes("disabled={isBusy}") &&
    socialScreen.includes("setIsBusy(false)"),
  "Social screen must guard notification quick-read actions while busy."
);
assert(
  socialScreen.includes("async function markAllNotificationsRead()") &&
    socialScreen.includes("notificationReadActionLabel") &&
    socialScreen.includes("notificationReadAllActionLabel") &&
    socialScreen.includes("onPress={() => void markAllNotificationsRead()}") &&
    socialScreen.includes("disabled={isBusy}"),
  "Social screen must guard notification read actions while busy."
);
assert(
  socialScreen.includes('isBusy ? "Marcando" : "Marcar leida"') &&
    socialScreen.includes('isBusy ? "Marcando todas" : "Marcar todas leidas"') &&
    socialScreen.includes('isBusy ? "Marcando reciente" : "Marcar mas reciente leida"') &&
    socialScreen.includes('isBusy ? "Marcando antigua" : "Marcar mas antigua leida"'),
  "Social screen must show busy labels for notification read actions."
);
assert(
  socialScreen.includes("const isUnreadFilterDisabled = isBusy ||") &&
    socialScreen.includes("setSelectedNotificationKind(item.kind)") &&
    socialScreen.includes("onPress={clearNotificationFilters}") &&
    socialScreen.includes("disabled={isBusy}"),
  "Social screen must guard notification filters while busy."
);
assert(
  socialScreen.includes('label="Ver mas"') &&
    socialScreen.includes("setNotificationVisibleLimit((current) => current + 5)") &&
    socialScreen.includes('label="Ver menos"') &&
    socialScreen.includes("onPress={resetNotificationVisibleLimit}") &&
    socialScreen.includes("disabled={isBusy}"),
  "Social screen must guard notification pagination while busy."
);

const phaseSixteenMigration = readFileSync(
  path.join(root, "supabase/migrations/0013_player_weekly_trends.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseSixteenMigration.includes("create or replace view public.v_player_weekly_trends"),
  "Phase 16 migration must expose weekly trends view."
);

const phaseSeventeenMigration = readFileSync(
  path.join(root, "supabase/migrations/0014_clan_analytics.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseSeventeenMigration.includes("create or replace view public.v_clan_analytics"),
  "Phase 17 migration must expose clan analytics view."
);

const clanScreen = readFileSync(
  path.join(root, "apps/mobile/src/presentation/screens/ClanScreen.tsx"),
  "utf8"
);
assert(
  clanScreen.includes("getClanAnalytics") && clanScreen.includes("Preparacion de guerra"),
  "Clan screen must show clan analytics."
);
assert(
  clanScreen.includes("getClanWeeklyTrends") && clanScreen.includes("Ritmo semanal del clan"),
  "Clan screen must show clan weekly trends."
);
assert(
  clanScreen.includes("getClanMemberContributions") && clanScreen.includes("Aportes del escuadron"),
  "Clan screen must show clan member contributions."
);
assert(
  clanScreen.includes("Gobernanza activa"),
  "Clan screen must mention clan governance."
);
assert(
  clanScreen.includes("getClanGovernanceAudit") && clanScreen.includes("Historial de gobernanza"),
  "Clan screen must show clan governance audit."
);
assert(
  clanScreen.includes("getClanInvitations") && clanScreen.includes("Invitaciones de clan"),
  "Clan screen must show clan invitations."
);
assert(
  clanScreen.includes("getClanJoinRequests") && clanScreen.includes("Explorar clanes"),
  "Clan screen must show clan join requests."
);
assert(
  clanScreen.includes("createClan") && clanScreen.includes("Fundar clan"),
  "Clan screen must allow clan creation."
);
assert(
  clanScreen.includes("updateClanSettings") && clanScreen.includes("Ajustes de clan"),
  "Clan screen must allow clan settings updates."
);
assert(
  clanScreen.includes("manageClanLifecycle") && clanScreen.includes("Ciclo del clan"),
  "Clan screen must allow clan lifecycle actions."
);
assert(
  clanScreen.includes("getClanWars") && clanScreen.includes("Guerras de clan"),
  "Clan screen must show clan wars."
);

const phaseEighteenMigration = readFileSync(
  path.join(root, "supabase/migrations/0015_clan_weekly_trends.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseEighteenMigration.includes("create or replace view public.v_clan_weekly_trends"),
  "Phase 18 migration must expose clan weekly trends view."
);

const phaseNineteenMigration = readFileSync(
  path.join(root, "supabase/migrations/0016_clan_member_contributions.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseNineteenMigration.includes("create or replace view public.v_clan_member_contributions"),
  "Phase 19 migration must expose clan member contributions view."
);

const phaseTwentyMigration = readFileSync(
  path.join(root, "supabase/migrations/0017_clan_governance.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseTwentyMigration.includes("create table public.clan_governance_audit"),
  "Phase 20 migration must create clan governance audit."
);
assert(
  phaseTwentyMigration.includes("create or replace function public.set_clan_member_role"),
  "Phase 20 migration must allow role management."
);
assert(
  phaseTwentyMigration.includes("create or replace function public.remove_clan_member"),
  "Phase 20 migration must allow member removal."
);

const phaseTwentyOneMigration = readFileSync(
  path.join(root, "supabase/migrations/0018_clan_governance_audit_view.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseTwentyOneMigration.includes("create or replace view public.v_clan_governance_audit"),
  "Phase 21 migration must expose clan governance audit view."
);

const phaseTwentyTwoMigration = readFileSync(
  path.join(root, "supabase/migrations/0019_clan_invitations.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseTwentyTwoMigration.includes("create table public.clan_invitations"),
  "Phase 22 migration must create clan invitations."
);
assert(
  phaseTwentyTwoMigration.includes("create or replace function public.create_clan_invitation"),
  "Phase 22 migration must allow invitation creation."
);
assert(
  phaseTwentyTwoMigration.includes("create or replace function public.respond_to_clan_invitation"),
  "Phase 22 migration must allow invitation responses."
);

const phaseTwentyThreeMigration = readFileSync(
  path.join(root, "supabase/migrations/0020_clan_join_requests.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseTwentyThreeMigration.includes("create table public.clan_join_requests"),
  "Phase 23 migration must create clan join requests."
);
assert(
  phaseTwentyThreeMigration.includes("create or replace view public.v_clan_directory"),
  "Phase 23 migration must expose clan directory."
);
assert(
  phaseTwentyThreeMigration.includes("create or replace function public.request_to_join_clan"),
  "Phase 23 migration must allow join requests."
);
assert(
  phaseTwentyThreeMigration.includes("create or replace function public.respond_to_clan_join_request"),
  "Phase 23 migration must allow join request responses."
);

const phaseTwentyFourMigration = readFileSync(
  path.join(root, "supabase/migrations/0021_clan_creation.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseTwentyFourMigration.includes("create or replace function public.slugify_clan_name"),
  "Phase 24 migration must create clan slug helper."
);
assert(
  phaseTwentyFourMigration.includes("create or replace function public.create_clan"),
  "Phase 24 migration must allow clan creation."
);

const phaseTwentyFiveMigration = readFileSync(
  path.join(root, "supabase/migrations/0022_clan_settings.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseTwentyFiveMigration.includes("create or replace function public.update_clan_settings"),
  "Phase 25 migration must allow clan settings updates."
);

const phaseTwentySixMigration = readFileSync(
  path.join(root, "supabase/migrations/0023_clan_lifecycle.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseTwentySixMigration.includes("create or replace function public.leave_clan"),
  "Phase 26 migration must allow clan leaving."
);
assert(
  phaseTwentySixMigration.includes("create or replace function public.transfer_clan_leadership"),
  "Phase 26 migration must allow leadership transfer."
);
assert(
  phaseTwentySixMigration.includes("transfer_leadership"),
  "Phase 26 migration must audit leadership transfer."
);

const phaseTwentySevenMigration = readFileSync(
  path.join(root, "supabase/migrations/0024_clan_wars.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseTwentySevenMigration.includes("create table public.clan_wars"),
  "Phase 27 migration must create clan wars."
);
assert(
  phaseTwentySevenMigration.includes("create or replace view public.v_clan_wars"),
  "Phase 27 migration must expose clan war view."
);
assert(
  phaseTwentySevenMigration.includes("create or replace function public.declare_clan_war"),
  "Phase 27 migration must allow clan war declarations."
);
assert(
  phaseTwentySevenMigration.includes("create or replace function public.end_clan_war"),
  "Phase 27 migration must allow clan war closure."
);

const phaseTwentyEightMigration = readFileSync(
  path.join(root, "supabase/migrations/0025_events_missions.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseTwentyEightMigration.includes("refresh_player_event_progress"),
  "Phase 28 migration must refresh event progress."
);
assert(
  phaseTwentyEightMigration.includes("create or replace view public.v_player_events"),
  "Phase 28 migration must expose player events view."
);
assert(
  phaseTwentyEightMigration.includes("daily_ride_5k"),
  "Phase 28 migration must seed initial missions."
);

const phaseTwentyNineMigration = readFileSync(
  path.join(root, "supabase/migrations/0026_event_reward_claims.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseTwentyNineMigration.includes("create table if not exists public.event_reward_claims"),
  "Phase 29 migration must create event reward claims."
);
assert(
  phaseTwentyNineMigration.includes("create or replace function public.claim_player_event_reward"),
  "Phase 29 migration must claim event rewards."
);
assert(
  phaseTwentyNineMigration.includes("grant_currency"),
  "Phase 29 migration must grant claimable economy rewards."
);

const phaseThirtyMigration = readFileSync(
  path.join(root, "supabase/migrations/0027_event_leaderboards.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseThirtyMigration.includes("create or replace view public.v_event_leaderboards"),
  "Phase 30 migration must expose event leaderboards."
);
assert(
  phaseThirtyMigration.includes("row_number() over"),
  "Phase 30 migration must rank event leaderboard rows."
);

const phaseThirtyOneMigration = readFileSync(
  path.join(root, "supabase/migrations/0028_event_reward_history.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseThirtyOneMigration.includes("create or replace view public.v_player_event_reward_claims") &&
    phaseThirtyOneMigration.includes("event_reward_claims"),
  "Phase 31 migration must expose event reward history."
);

const phaseThirtyTwoMigration = readFileSync(
  path.join(root, "supabase/migrations/0029_event_schedule.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseThirtyTwoMigration.includes("create or replace view public.v_event_schedule") &&
    phaseThirtyTwoMigration.includes("order by events.starts_at"),
  "Phase 32 migration must expose event schedule."
);

const phaseThirtyThreeMigration = readFileSync(
  path.join(root, "supabase/migrations/0030_event_reminders.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseThirtyThreeMigration.includes("create table if not exists public.event_reminders") &&
    phaseThirtyThreeMigration.includes("create or replace view public.v_player_event_reminders"),
  "Phase 33 migration must expose event reminders."
);

const phaseThirtyFourMigration = readFileSync(
  path.join(root, "supabase/migrations/0031_event_reminder_dispatch.sql"),
  "utf8"
).toLowerCase();
assert(
  phaseThirtyFourMigration.includes("create or replace function public.dispatch_due_event_reminders") &&
    phaseThirtyFourMigration.includes("insert into public.notifications") &&
    phaseThirtyFourMigration.includes("status = 'sent'"),
  "Phase 34 migration must dispatch event reminder notifications."
);

console.log(
  JSON.stringify(
    {
      status: "ok",
      migrations: migrations.length,
      edgeFunctions: requiredFunctions.length,
      checks: requiredFiles.length + requiredFunctions.length + requiredMigrationSnippets.length + 2
    },
    null,
    2
  )
);
