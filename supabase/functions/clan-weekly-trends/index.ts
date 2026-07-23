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
    const { data: profile, error: profileError } = await client
      .from("player_profiles")
      .select("clan_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile?.clan_id) {
      return jsonResponse({ trends: [] });
    }

    const { data, error } = await client
      .from("v_clan_weekly_trends")
      .select("*")
      .eq("clan_id", profile.clan_id)
      .order("week_start", { ascending: false })
      .limit(weeks);

    if (error) {
      throw error;
    }

    return jsonResponse({ trends: data ?? [] });
  })
);
