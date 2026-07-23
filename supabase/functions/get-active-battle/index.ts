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
    const { data: participant } = await client
      .from("battle_participants")
      .select("battle_id")
      .eq("player_id", user.id)
      .order("last_pulse_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (!participant?.battle_id) {
      return jsonResponse({ battle: null });
    }

    const { data, error } = await client
      .from("v_active_battles")
      .select("*")
      .eq("id", participant.battle_id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return jsonResponse({ battle: data ?? null });
  })
);
