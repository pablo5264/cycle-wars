import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString, optionalString } from "../_shared/validation.ts";

interface ClanLifecyclePayload {
  action?: unknown;
  targetPlayerId?: unknown;
  reason?: unknown;
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
    const body = await readJson<ClanLifecyclePayload>(request);
    const action = assertString(body.action, "action");
    const reason = optionalString(body.reason);

    if (action === "leave") {
      const { error } = await client.rpc("leave_clan", {
        p_actor_id: user.id,
        p_reason: reason
      });

      if (error) {
        throw error;
      }

      return jsonResponse({ left: true });
    }

    if (action === "transfer_leadership") {
      const targetPlayerId = assertString(body.targetPlayerId, "targetPlayerId");
      const { data, error } = await client.rpc("transfer_clan_leadership", {
        p_actor_id: user.id,
        p_reason: reason,
        p_target_player_id: targetPlayerId
      });

      if (error) {
        throw error;
      }

      return jsonResponse({ membership: data });
    }

    return jsonResponse({ error: "Unsupported clan lifecycle action." }, 400);
  })
);
