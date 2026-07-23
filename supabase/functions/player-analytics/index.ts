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
    const { data, error } = await client
      .from("v_player_analytics")
      .select("*")
      .eq("player_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return jsonResponse({ analytics: data ?? null });
  })
);
