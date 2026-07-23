import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const { client, user } = await requireUser(request);
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 50);

    const { data, error } = await client
      .from("v_player_event_reward_claims")
      .select("*")
      .eq("player_id", user.id)
      .order("claimed_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return jsonResponse({ claims: data ?? [] });
  })
);
