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
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 50);
    const includeActive = url.searchParams.get("includeActive") === "true";
    const client = serviceClient();
    await enforceRateLimit(client, requestSubject(request, null), rateLimits.readMap);

    let query = client
      .from("v_event_schedule")
      .select("*")
      .order("starts_at", { ascending: true })
      .limit(limit);

    if (!includeActive) {
      query = query.gt("starts_at", new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return jsonResponse({ events: data ?? [] });
  })
);
