export interface SessionUser {
  id: string;
  email: string | null;
  isAnonymous: boolean;
}

export interface TerritoryMapItem {
  h3_index: string;
  owner_id: string | null;
  owner_name: string | null;
  clan_id: string | null;
  clan_name: string | null;
  clan_color: string | null;
  influence_points: number;
  level: number;
  level_name?: string | null;
  total_distance_meters?: number;
  required_distance_meters?: number;
  next_level_distance_meters?: number | null;
  shield_until: string | null;
  shield_seconds_remaining?: number;
  status: "neutral" | "protected" | "vulnerable" | "contested";
  updated_at: string;
}

export interface RegionControlItem {
  region_id: string;
  parent_id: string | null;
  kind: "neighborhood" | "commune" | "city" | "province" | "region" | "country";
  name: string;
  country_code: string | null;
  season_id: string | null;
  controller_player_id: string | null;
  controller_player_name: string | null;
  controller_clan_id: string | null;
  controller_clan_name: string | null;
  controller_clan_color: string | null;
  controlled_hexes: number;
  total_hexes: number;
  control_percent: number;
  captured_at: string;
}

export interface RegionRewardItem {
  id: string;
  season_id: string;
  season_name: string;
  region_id: string;
  region_name: string;
  region_kind: string;
  player_id: string;
  clan_id: string | null;
  clan_name: string | null;
  clan_color: string | null;
  currency: "coins" | "crystals";
  amount: number;
  controlled_hexes: number;
  total_hexes: number;
  control_percent: number;
  awarded_at: string;
}

export interface RideActivity {
  id: string;
  player_id: string;
  status: "recording" | "processing" | "valid" | "quarantined" | "rejected";
  started_at: string;
  ended_at: string | null;
  distance_meters: number;
  moving_seconds: number;
  average_speed_kmh: number;
  max_speed_kmh: number;
  calories: number;
}

export interface GpsSampleResult {
  h3Index: string;
  distanceMeters: number;
  influenceDelta: number;
  antiCheat: {
    status: "trusted" | "suspicious" | "rejected";
    trustScore: number;
  };
  territory: TerritoryMapItem | null;
  battle: BattleSummary | null;
}

export interface BattleParticipant {
  playerId: string;
  clanId: string | null;
  score: number;
  distanceMeters: number;
  level: number;
  speedKmh: number;
  timeInTerritorySeconds: number;
}

export interface BattleSummary {
  id: string;
  territory_h3_index?: string;
  territoryH3Index?: string;
  status: "pending" | "active" | "resolved" | "cancelled";
  participant_count?: number;
  participantCount?: number;
  participants?: BattleParticipant[];
  winner_id?: string | null;
  winnerId?: string | null;
}

export interface ShopItem {
  id: string;
  code: string;
  kind: string;
  name: string;
  description: string | null;
  price_currency: "coins" | "crystals";
  price_amount: number;
  asset_path: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
  metadata?: Record<string, unknown>;
}

export interface WalletBalance {
  player_id: string;
  currency: "coins" | "crystals";
  balance: number;
  updated_at: string;
}

export interface InventoryItem {
  player_id: string;
  item_id: string;
  code: string;
  kind: string;
  name: string;
  description: string | null;
  asset_path: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  acquired_at: string;
  equipped_at: string | null;
  is_equipped: boolean;
}

export interface EconomyLedgerEntry {
  id: number;
  player_id: string;
  currency: "coins" | "crystals";
  amount: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface FeedPost {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  activity_id: string | null;
  territory_h3_index: string | null;
  visibility: "public" | "friends" | "clan" | "private";
  body: string | null;
  media_paths: string[];
  created_at: string;
  like_count: number;
  comment_count: number;
}

export interface FeedComment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface Friendship {
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
}

export interface Follow {
  follower_id: string;
  followed_id: string;
  created_at: string;
}

export interface ChatThread {
  id: string;
  clan_id: string | null;
  is_group: boolean;
  title: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  player_id: string;
  kind: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface RiderSnapshot {
  level: number;
  league: string;
  territories: number;
  conquests: number;
  distanceMeters: number;
  totalSeconds: number;
  averageSpeedKmh: number;
  elevationGainMeters: number;
  calories: number;
}

export interface PlayerAnalytics {
  player_id: string;
  display_name: string;
  avatar_url: string | null;
  league: string;
  elo: number;
  activity_count: number;
  valid_activity_count: number;
  total_distance_meters: number;
  total_moving_seconds: number;
  average_speed_kmh: number;
  max_speed_kmh: number;
  total_calories: number;
  territory_count: number;
  total_influence: number;
  influence_events: number;
  influence_delta: number;
  regional_reward_count: number;
  regional_reward_coins: number;
  season_progress: number;
  calculated_at: string;
}

export interface PlayerWeeklyTrend {
  player_id: string;
  week_start: string;
  week_end: string;
  activity_count: number;
  valid_activity_count: number;
  distance_meters: number;
  moving_seconds: number;
  calories: number;
  touched_territories: number;
  influence_delta: number;
  regional_reward_count: number;
  regional_reward_coins: number;
}

export interface ClanAnalytics {
  clan_id: string;
  name: string;
  slug: string;
  color: string;
  level: number;
  experience: number;
  member_count: number;
  total_contribution_points: number;
  territory_count: number;
  total_influence: number;
  average_territory_level: number;
  influence_events: number;
  influence_delta: number;
  controlled_regions: number;
  regional_reward_count: number;
  regional_reward_coins: number;
  war_readiness: number;
  calculated_at: string;
}

export interface ClanWeeklyTrend {
  clan_id: string;
  week_start: string;
  week_end: string;
  activity_count: number;
  valid_activity_count: number;
  active_members: number;
  contributing_members: number;
  distance_meters: number;
  moving_seconds: number;
  calories: number;
  touched_territories: number;
  influence_delta: number;
  regional_reward_count: number;
  regional_reward_coins: number;
}

export interface ClanMemberContribution {
  clan_id: string;
  player_id: string;
  display_name: string;
  avatar_url: string | null;
  role: "leader" | "captain" | "veteran" | "member" | "recruit";
  joined_at: string;
  contribution_points: number;
  activity_count: number;
  valid_activity_count: number;
  distance_meters: number;
  moving_seconds: number;
  touched_territories: number;
  influence_delta: number;
  regional_reward_count: number;
  regional_reward_coins: number;
  squad_score: number;
  calculated_at: string;
}

export interface ClanGovernanceAuditItem {
  id: number;
  clan_id: string;
  clan_name: string;
  actor_id: string;
  actor_name: string;
  target_player_id: string;
  target_player_name: string;
  action: "set_role" | "remove_member" | "leave_clan" | "transfer_leadership";
  previous_role: "leader" | "captain" | "veteran" | "member" | "recruit" | null;
  next_role: "leader" | "captain" | "veteran" | "member" | "recruit" | null;
  reason: string | null;
  created_at: string;
}

export interface ClanInvitation {
  id: string;
  clan_id: string;
  clan_name: string;
  clan_color: string;
  actor_id: string;
  actor_name: string;
  target_player_id: string;
  target_player_name: string;
  status: "pending" | "accepted" | "declined" | "expired";
  message: string | null;
  expires_at: string;
  responded_at: string | null;
  created_at: string;
}

export interface ClanDirectoryItem {
  clan_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  city: string | null;
  country_code: string | null;
  join_policy: "open" | "approval_required" | "invite_only";
  max_members: number;
  level: number;
  experience: number;
  member_count: number;
  total_contribution_points: number;
}

export interface ClanJoinRequest {
  id: string;
  clan_id: string;
  clan_name: string;
  clan_color: string;
  requester_id: string;
  requester_name: string;
  responder_id: string | null;
  responder_name: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  message: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface ClanWar {
  id: string;
  declarer_clan_id: string;
  declarer_clan_name: string;
  declarer_clan_color: string;
  target_clan_id: string;
  target_clan_name: string;
  target_clan_color: string;
  declared_by: string;
  declared_by_name: string;
  status: "active" | "ended" | "cancelled";
  reason: string | null;
  starts_at: string;
  ends_at: string;
  ended_at: string | null;
  created_at: string;
}

export interface PlayerEventObjectiveProgress {
  kind: "distance_meters" | "influence_delta" | "touched_territories";
  target: number;
  current: number;
  percent: number;
}

export interface PlayerEvent {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  scope: "daily" | "weekly" | "monthly" | "global";
  objectives: Array<{ kind: string; target: number }>;
  rewards: Record<string, number>;
  player_id: string | null;
  progress: {
    objectives?: PlayerEventObjectiveProgress[];
  };
  completed_at: string | null;
  claimed_at: string | null;
  claimed_rewards: Record<string, number>;
  updated_at: string | null;
}

export interface PlayerEventRewardClaim {
  id: string;
  event_id: string;
  event_code: string | null;
  event_name: string;
  scope: "daily" | "weekly" | "monthly" | "global";
  player_id: string;
  rewards: Record<string, number>;
  claimed_at: string;
}

export interface EventScheduleItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  scope: "daily" | "weekly" | "monthly" | "global";
  objectives: Array<{ kind: string; target: number }>;
  rewards: Record<string, number>;
}

export interface EventReminderItem {
  id: string;
  event_id: string;
  event_code: string | null;
  event_name: string;
  scope: "daily" | "weekly" | "monthly" | "global";
  player_id: string;
  remind_at: string;
  status: "active" | "cancelled" | "sent";
  created_at: string;
  updated_at: string;
}

export interface EventLeaderboardEntry {
  event_id: string;
  event_code: string | null;
  event_name: string;
  scope: "daily" | "weekly" | "monthly" | "global";
  ends_at: string;
  player_id: string;
  display_name: string;
  avatar_url: string | null;
  progress_percent: number;
  score: number;
  target_score: number;
  completed_at: string | null;
  rank: number;
}
