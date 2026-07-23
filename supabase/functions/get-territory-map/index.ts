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
    const h3Indexes = url.searchParams
      .get("h3")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "500"), 2000);
    const client = serviceClient();
    await enforceRateLimit(client, requestSubject(request, null), rateLimits.readMap);

    let query = client
      .from("v_public_territory_map")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (h3Indexes && h3Indexes.length > 0) {
      query = query.in("h3_index", h3Indexes);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return jsonResponse({ territories: data ?? [] });
  })
);
