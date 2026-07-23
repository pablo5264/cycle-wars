import type { SupabaseClient } from "@supabase/supabase-js";
import type { TerritoryMapItem } from "../../domain/models/AppModels";

export type TerritoryChangeHandler = (territory: TerritoryMapItem) => void;

export class TerritoryRealtimeService {
  constructor(private readonly client: SupabaseClient | null) {}

  isConfigured(): boolean {
    return this.client !== null;
  }

  subscribe(onChange: TerritoryChangeHandler): () => void {
    if (!this.client) {
      return () => undefined;
    }

    const channel = this.client
      .channel("cycle-wars-territories")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "territories"
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (!row.h3_index) {
            return;
          }

          onChange({
            h3_index: String(row.h3_index),
            owner_id: nullableString(row.owner_id),
            owner_name: null,
            clan_id: nullableString(row.clan_id),
            clan_name: null,
            clan_color: nullableString(row.color),
            influence_points: Number(row.influence_points ?? 0),
            level: Number(row.level ?? 1),
            total_distance_meters: Number(row.total_distance_meters ?? 0),
            shield_until: nullableString(row.shield_until),
            status: normalizeStatus(row.status),
            updated_at: String(row.updated_at ?? new Date().toISOString())
          });
        }
      )
      .subscribe();

    return () => {
      void this.client?.removeChannel(channel);
    };
  }
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function normalizeStatus(value: unknown): TerritoryMapItem["status"] {
  return value === "protected" || value === "vulnerable" || value === "contested"
    ? value
    : "neutral";
}
