import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { requireServiceSecret, serviceClient } from "../_shared/supabase.ts";

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    requireServiceSecret(request);
    const client = serviceClient();
    const decayPointsPerHour = Number(Deno.env.get("TERRITORY_DECAY_POINTS_PER_HOUR") ?? "60");
    const { data, error } = await client.rpc("decay_territory_influence", {
      p_decay_points_per_hour: decayPointsPerHour,
      p_now: new Date().toISOString()
    });

    if (error) {
      throw error;
    }

    return jsonResponse({
      status: "ok",
      changedTerritories: data,
      decayPointsPerHour,
      decayedAt: new Date().toISOString()
    });
  })
);
