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

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);
    const { client, user } = await requireUser(request);
    const { data, error } = await client
      .from("v_player_region_rewards")
      .select("*")
      .eq("player_id", user.id)
      .order("awarded_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return jsonResponse({ rewards: data ?? [] });
  })
);
