import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString, optionalString } from "../_shared/validation.ts";

interface ClanWarsPayload {
  action?: unknown;
  targetClanId?: unknown;
  warId?: unknown;
  reason?: unknown;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    const { client, user } = await requireUser(request);

    if (request.method === "GET") {
      const { data: profile, error: profileError } = await client
        .from("player_profiles")
        .select("clan_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.clan_id) {
        return jsonResponse({ wars: [] });
      }

      const { data, error } = await client
        .from("v_clan_wars")
        .select("*")
        .or(`declarer_clan_id.eq.${profile.clan_id},target_clan_id.eq.${profile.clan_id}`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return jsonResponse({ wars: data ?? [] });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const body = await readJson<ClanWarsPayload>(request);
    const action = assertString(body.action, "action");
    const reason = optionalString(body.reason);

    if (action === "declare") {
      const targetClanId = assertString(body.targetClanId, "targetClanId");
      const { data, error } = await client.rpc("declare_clan_war", {
        p_actor_id: user.id,
        p_reason: reason,
        p_target_clan_id: targetClanId
      });

      if (error) {
        throw error;
      }

      return jsonResponse({ war: data }, 201);
    }

    if (action === "end") {
      const warId = assertString(body.warId, "warId");
      const { data, error } = await client.rpc("end_clan_war", {
        p_actor_id: user.id,
        p_reason: reason,
        p_war_id: warId
      });

      if (error) {
        throw error;
      }

      return jsonResponse({ war: data });
    }

    return jsonResponse({ error: "Unsupported clan war action." }, 400);
  })
);
