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
    const { data: profile, error: profileError } = await client
      .from("player_profiles")
      .select("clan_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile?.clan_id) {
      return jsonResponse({ analytics: null });
    }

    const { data, error } = await client
      .from("v_clan_analytics")
      .select("*")
      .eq("clan_id", profile.clan_id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return jsonResponse({ analytics: data ?? null });
  })
);
