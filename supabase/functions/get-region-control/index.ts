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
    const regionId = url.searchParams.get("regionId");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "25"), 100);
    const client = serviceClient();
    await enforceRateLimit(client, requestSubject(request, null), rateLimits.readMap);

    let query = client
      .from("v_region_control")
      .select("*")
      .order("control_percent", { ascending: false })
      .limit(limit);

    if (regionId) {
      query = query.eq("region_id", regionId);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return jsonResponse({ regions: data ?? [] });
  })
);
