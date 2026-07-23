import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { enforceRateLimit, rateLimits, requestSubject } from "../_shared/ops.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 50);
    const client = serviceClient();
    await enforceRateLimit(client, requestSubject(request, null), rateLimits.readMap);

    let query = client
      .from("v_event_leaderboards")
      .select("*")
      .order("rank", { ascending: true })
      .limit(limit);

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return jsonResponse({ leaders: data ?? [] });
  })
);
