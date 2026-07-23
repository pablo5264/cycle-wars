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
    const weeks = Math.min(Number(url.searchParams.get("weeks") ?? "12"), 26);
    const { client, user } = await requireUser(request);
    const { data, error } = await client
      .from("v_player_weekly_trends")
      .select("*")
      .eq("player_id", user.id)
      .order("week_start", { ascending: false })
      .limit(weeks);

    if (error) {
      throw error;
    }

    return jsonResponse({ trends: data ?? [] });
  })
);
