import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { requireServiceSecret, serviceClient } from "../_shared/supabase.ts";

interface SettleRegionRewardsPayload {
  seasonId?: string | null;
  minControlPercent?: number;
  baseAmount?: number;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    requireServiceSecret(request);
    const body = await request.text();
    const payload =
      body.trim().length > 0 ? (JSON.parse(body) as SettleRegionRewardsPayload) : {};
    const client = serviceClient();
    const { data, error } = await client.rpc("settle_region_season_rewards", {
      p_base_amount: payload.baseAmount ?? 250,
      p_min_control_percent: payload.minControlPercent ?? 50,
      p_season_id: payload.seasonId ?? null
    });

    if (error) {
      throw error;
    }

    return jsonResponse({ awarded: Number(data ?? 0) });
  })
);
