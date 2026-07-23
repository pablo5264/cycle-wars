import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString } from "../_shared/validation.ts";

interface ResolveBattleRequest {
  battleId: string;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const { client, user } = await requireUser(request);
    const body = await readJson<ResolveBattleRequest>(request);
    const battleId = assertString(body.battleId, "battleId");

    const { data: participant } = await client
      .from("battle_participants")
      .select("battle_id")
      .eq("battle_id", battleId)
      .eq("player_id", user.id)
      .maybeSingle();

    if (!participant) {
      return jsonResponse({ error: "Only battle participants can request resolution." }, 403);
    }

    const { data, error } = await client.rpc("resolve_battle", {
      p_battle_id: battleId,
      p_now: new Date().toISOString()
    });

    if (error) {
      throw error;
    }

    return jsonResponse({ battle: data });
  })
);
