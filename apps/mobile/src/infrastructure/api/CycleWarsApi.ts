import type {
  BattleSummary,
  AppNotification,
  ChatMessage,
  ChatThread,
  ClanAnalytics,
  ClanDirectoryItem,
  ClanGovernanceAuditItem,
  ClanInvitation,
  ClanJoinRequest,
  ClanMemberContribution,
  ClanWar,
  ClanWeeklyTrend,
  FeedComment,
  FeedPost,
  Follow,
  Friendship,
  GpsSampleResult,
  EconomyLedgerEntry,
  EventLeaderboardEntry,
  EventScheduleItem,
  EventReminderItem,
  InventoryItem,
  PlayerEvent,
  PlayerAnalytics,
  PlayerEventRewardClaim,
  PlayerWeeklyTrend,
  RegionControlItem,
  RegionRewardItem,
  RideActivity,
  ShopItem,
  TerritoryMapItem,
  WalletBalance
} from "../../domain/models/AppModels";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export interface StartActivityPayload {
  startedAt: string;
  source: "mobile";
  metadata: Record<string, unknown>;
}

export interface GpsSamplePayload {
  activityId: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number | null;
  accuracyMeters: number;
  speedKmh: number;
  headingDegrees: number | null;
  recordedAt: string;
  deviceIntegrity: {
    isMocked: boolean;
    isRooted: boolean;
    isJailbroken: boolean;
    clockOffsetMs: number;
  };
}

export interface CreateFeedPostPayload {
  body: string;
  visibility: "public" | "friends" | "clan" | "private";
  activityId?: string | null;
  territoryH3Index?: string | null;
  mediaPaths?: string[];
}

export interface ManageClanMemberPayload {
  action: "set_role" | "remove_member";
  targetPlayerId: string;
  nextRole?: "captain" | "veteran" | "member" | "recruit";
  reason?: string;
}

export interface ManageClanInvitationPayload {
  action: "send" | "accept" | "decline";
  targetPlayerId?: string;
  invitationId?: string;
  message?: string;
}

export interface ManageClanJoinRequestPayload {
  action: "request" | "approve" | "reject";
  clanId?: string;
  requestId?: string;
  message?: string;
}

export interface CreateClanPayload {
  name: string;
  description?: string;
  color?: string;
  city?: string;
  countryCode?: string;
  joinPolicy?: "open" | "approval_required" | "invite_only";
}

export interface UpdateClanSettingsPayload {
  description?: string;
  color?: string;
  city?: string;
  countryCode?: string;
  joinPolicy?: "open" | "approval_required" | "invite_only";
}

export interface ClanLifecyclePayload {
  action: "leave" | "transfer_leadership";
  targetPlayerId?: string;
  reason?: string;
}

export interface ClanWarPayload {
  action: "declare" | "end";
  targetClanId?: string;
  warId?: string;
  reason?: string;
}

export class CycleWarsApi {
  constructor(
    private readonly functionsUrl: string | null,
    private readonly getAccessToken: () => Promise<string | null>
  ) {}

  isConfigured(): boolean {
    return this.functionsUrl !== null;
  }

  async startActivity(payload: StartActivityPayload): Promise<RideActivity> {
    const response = await this.post<{ activity: RideActivity }>("start-activity", payload);
    return response.activity;
  }

  async ingestGpsSample(payload: GpsSamplePayload): Promise<GpsSampleResult> {
    return this.post<GpsSampleResult>("ingest-gps-sample", payload);
  }

  isRecoverableError(error: unknown): boolean {
    if (error instanceof ApiError) {
      return error.status === 429 || error.status >= 500;
    }

    return error instanceof TypeError;
  }

  async finishActivity(activityId: string, endedAt: string): Promise<RideActivity> {
    const response = await this.post<{ activity: RideActivity }>("finish-activity", {
      activityId,
      endedAt
    });
    return response.activity;
  }

  async getTerritoryMap(h3Indexes: string[] = []): Promise<TerritoryMapItem[]> {
    const query = h3Indexes.length > 0 ? `?h3=${encodeURIComponent(h3Indexes.join(","))}` : "";
    const response = await this.request<{ territories: TerritoryMapItem[] }>(
      `get-territory-map${query}`,
      "GET"
    );
    return response.territories;
  }

  async getRegionControl(limit = 25): Promise<RegionControlItem[]> {
    const response = await this.request<{ regions: RegionControlItem[] }>(
      `get-region-control?limit=${limit}`,
      "GET"
    );
    return response.regions;
  }

  async getPlayerRegionRewards(limit = 20): Promise<RegionRewardItem[]> {
    const response = await this.request<{ rewards: RegionRewardItem[] }>(
      `player-region-rewards?limit=${limit}`,
      "GET"
    );
    return response.rewards;
  }

  async getPlayerAnalytics(): Promise<PlayerAnalytics | null> {
    const response = await this.request<{ analytics: PlayerAnalytics | null }>(
      "player-analytics",
      "GET"
    );
    return response.analytics;
  }

  async getPlayerWeeklyTrends(weeks = 12): Promise<PlayerWeeklyTrend[]> {
    const response = await this.request<{ trends: PlayerWeeklyTrend[] }>(
      `player-weekly-trends?weeks=${weeks}`,
      "GET"
    );
    return response.trends;
  }

  async getClanAnalytics(): Promise<ClanAnalytics | null> {
    const response = await this.request<{ analytics: ClanAnalytics | null }>(
      "clan-analytics",
      "GET"
    );
    return response.analytics;
  }

  async getClanWeeklyTrends(weeks = 12): Promise<ClanWeeklyTrend[]> {
    const response = await this.request<{ trends: ClanWeeklyTrend[] }>(
      `clan-weekly-trends?weeks=${weeks}`,
      "GET"
    );
    return response.trends;
  }

  async getClanMemberContributions(limit = 10): Promise<ClanMemberContribution[]> {
    const response = await this.request<{ members: ClanMemberContribution[] }>(
      `clan-member-contributions?limit=${limit}`,
      "GET"
    );
    return response.members;
  }

  async getClanGovernanceAudit(limit = 20): Promise<ClanGovernanceAuditItem[]> {
    const response = await this.request<{ events: ClanGovernanceAuditItem[] }>(
      `clan-governance-audit?limit=${limit}`,
      "GET"
    );
    return response.events;
  }

  async getClanInvitations(): Promise<{
    received: ClanInvitation[];
    sent: ClanInvitation[];
  }> {
    return this.request("clan-invitations", "GET");
  }

  async manageClanInvitation(payload: ManageClanInvitationPayload): Promise<ClanInvitation> {
    const response = await this.post<{ invitation: ClanInvitation }>("clan-invitations", payload);
    return response.invitation;
  }

  async getClanJoinRequests(): Promise<{
    clans: ClanDirectoryItem[];
    received: ClanJoinRequest[];
    sent: ClanJoinRequest[];
  }> {
    return this.request("clan-join-requests", "GET");
  }

  async manageClanJoinRequest(payload: ManageClanJoinRequestPayload): Promise<ClanJoinRequest> {
    const response = await this.post<{ request: ClanJoinRequest }>("clan-join-requests", payload);
    return response.request;
  }

  async createClan(payload: CreateClanPayload): Promise<void> {
    await this.post("create-clan", payload);
  }

  async updateClanSettings(payload: UpdateClanSettingsPayload): Promise<void> {
    await this.post("update-clan-settings", payload);
  }

  async manageClanLifecycle(payload: ClanLifecyclePayload): Promise<void> {
    await this.post("clan-lifecycle", payload);
  }

  async getClanWars(): Promise<ClanWar[]> {
    const response = await this.request<{ wars: ClanWar[] }>("clan-wars", "GET");
    return response.wars;
  }

  async manageClanWar(payload: ClanWarPayload): Promise<ClanWar> {
    const response = await this.post<{ war: ClanWar }>("clan-wars", payload);
    return response.war;
  }

  async getPlayerEvents(): Promise<PlayerEvent[]> {
    const response = await this.request<{ events: PlayerEvent[] }>("player-events", "GET");
    return response.events;
  }

  async claimEventReward(eventId: string): Promise<void> {
    await this.post("claim-event-reward", { eventId });
  }

  async getEventLeaderboard(eventId?: string, limit = 10): Promise<EventLeaderboardEntry[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (eventId) {
      params.set("eventId", eventId);
    }

    const response = await this.request<{ leaders: EventLeaderboardEntry[] }>(
      `event-leaderboard?${params.toString()}`,
      "GET"
    );
    return response.leaders;
  }

  async getPlayerEventRewardHistory(limit = 10): Promise<PlayerEventRewardClaim[]> {
    const response = await this.request<{ claims: PlayerEventRewardClaim[] }>(
      `player-event-reward-history?limit=${limit}`,
      "GET"
    );
    return response.claims;
  }

  async getEventSchedule(limit = 5, includeActive = false): Promise<EventScheduleItem[]> {
    const params = new URLSearchParams({
      limit: String(limit),
      includeActive: String(includeActive)
    });
    const response = await this.request<{ events: EventScheduleItem[] }>(
      `event-schedule?${params.toString()}`,
      "GET"
    );
    return response.events;
  }

  async getEventReminders(limit = 10): Promise<EventReminderItem[]> {
    const response = await this.request<{ reminders: EventReminderItem[] }>(
      `event-reminders?limit=${limit}`,
      "GET"
    );
    return response.reminders;
  }

  async setEventReminder(eventId: string): Promise<EventReminderItem> {
    const response = await this.post<{ reminder: EventReminderItem }>("event-reminders", { eventId });
    return response.reminder;
  }

  async cancelEventReminder(eventId: string): Promise<void> {
    await this.post("event-reminders", { eventId, action: "cancel" });
  }

  async manageClanMember(payload: ManageClanMemberPayload): Promise<void> {
    await this.post("manage-clan-member", payload);
  }

  async purchaseShopItem(itemId: string): Promise<void> {
    await this.post("purchase-shop-item", { itemId });
  }

  async recordPerformanceEvent(
    eventName: string,
    durationMs: number | null,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    await this.post("record-performance", { eventName, durationMs, metadata });
  }

  async getActiveBattle(): Promise<BattleSummary | null> {
    const response = await this.request<{ battle: BattleSummary | null }>("get-active-battle", "GET");
    return response.battle;
  }

  async resolveBattle(battleId: string): Promise<BattleSummary> {
    const response = await this.post<{ battle: BattleSummary }>("resolve-battle", { battleId });
    return response.battle;
  }

  async listShopItems(): Promise<ShopItem[]> {
    const response = await this.request<{ items: ShopItem[] }>("shop-catalog", "GET");
    return response.items;
  }

  async getInventory(): Promise<{
    wallets: WalletBalance[];
    inventory: InventoryItem[];
    ledger: EconomyLedgerEntry[];
  }> {
    return this.request("player-inventory", "GET");
  }

  async equipItem(itemId: string): Promise<InventoryItem> {
    const response = await this.post<{ inventory: InventoryItem }>("equip-item", { itemId });
    return response.inventory;
  }

  async getFeed(limit = 30): Promise<FeedPost[]> {
    const response = await this.request<{ posts: FeedPost[] }>(`social-feed?limit=${limit}`, "GET");
    return response.posts;
  }

  async createFeedPost(payload: CreateFeedPostPayload): Promise<FeedPost> {
    const response = await this.post<{ post: FeedPost }>("create-feed-post", payload);
    return response.post;
  }

  async toggleFeedLike(postId: string): Promise<boolean> {
    const response = await this.post<{ liked: boolean }>("toggle-feed-like", { postId });
    return response.liked;
  }

  async addFeedComment(postId: string, body: string): Promise<FeedComment> {
    const response = await this.post<{ comment: FeedComment }>("add-feed-comment", {
      postId,
      body
    });
    return response.comment;
  }

  async getSocialGraph(): Promise<{
    friendships: Friendship[];
    following: Follow[];
    notifications: AppNotification[];
  }> {
    return this.request("social-graph", "GET");
  }

  async requestFriend(targetPlayerId: string): Promise<Friendship> {
    const response = await this.post<{ friendship: Friendship }>("social-graph", {
      action: "request_friend",
      targetPlayerId
    });
    return response.friendship;
  }

  async setFollow(targetPlayerId: string, shouldFollow: boolean): Promise<boolean> {
    const response = await this.post<{ following: boolean }>("social-graph", {
      action: shouldFollow ? "follow" : "unfollow",
      targetPlayerId
    });
    return response.following;
  }

  async ensurePrivateChat(targetPlayerId: string): Promise<ChatThread> {
    const response = await this.post<{ thread: ChatThread }>("ensure-private-chat", {
      targetPlayerId
    });
    return response.thread;
  }

  async ensureClanChat(): Promise<ChatThread> {
    const response = await this.post<{ thread: ChatThread }>("ensure-clan-chat", {});
    return response.thread;
  }

  async getChatMessages(threadId: string): Promise<ChatMessage[]> {
    const response = await this.request<{ messages: ChatMessage[] }>(
      `get-chat-messages?threadId=${encodeURIComponent(threadId)}`,
      "GET"
    );
    return response.messages;
  }

  async sendChatMessage(threadId: string, body: string): Promise<ChatMessage> {
    const response = await this.post<{ message: ChatMessage }>("send-chat-message", {
      threadId,
      body
    });
    return response.message;
  }

  async getNotifications(): Promise<AppNotification[]> {
    const response = await this.request<{ notifications: AppNotification[] }>("notifications", "GET");
    return response.notifications;
  }

  async markNotificationRead(notificationId: string): Promise<AppNotification> {
    const response = await this.post<{ notification: AppNotification }>("notifications", {
      action: "mark_read",
      notificationId
    });
    return response.notification;
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.post("notifications", { action: "mark_all_read" });
  }

  async shareActivity(activityId: string, body: string): Promise<FeedPost> {
    const response = await this.post<{ post: FeedPost }>("share-activity", { activityId, body });
    return response.post;
  }

  async shareConquest(h3Index: string, body: string): Promise<FeedPost> {
    const response = await this.post<{ post: FeedPost }>("share-conquest", { h3Index, body });
    return response.post;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, "POST", body);
  }

  private async request<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
    if (!this.functionsUrl) {
      throw new ApiError("Backend is not configured.", 503);
    }

    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestInit: RequestInit = {
      method,
      headers
    };

    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.functionsUrl}/${path}`, requestInit);

    const text = await response.text();
    const parsed = text.length > 0 ? (JSON.parse(text) as T | { error?: string }) : ({} as T);

    if (!response.ok) {
      const message =
        typeof parsed === "object" && parsed !== null && "error" in parsed && parsed.error
          ? parsed.error
          : "Backend request failed.";
      throw new ApiError(String(message), response.status);
    }

    return parsed as T;
  }
}
