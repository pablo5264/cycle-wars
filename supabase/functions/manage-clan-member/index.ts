import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString, optionalString } from "../_shared/validation.ts";

type ClanRole = "captain" | "veteran" | "member" | "recruit";

interface ManageClanMemberPayload {
  action?: unknown;
  targetPlayerId?: unknown;
  nextRole?: unknown;
  reason?: unknown;
}

const allowedRoles = new Set<ClanRole>(["captain", "veteran", "member", "recruit"]);

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const { client, user } = await requireUser(request);
    const body = await readJson<ManageClanMemberPayload>(request);
    const action = assertString(body.action, "action");
    const targetPlayerId = assertString(body.targetPlayerId, "targetPlayerId");
    const reason = optionalString(body.reason);

    if (action === "set_role") {
      const nextRole = assertString(body.nextRole, "nextRole") as ClanRole;
      if (!allowedRoles.has(nextRole)) {
        return jsonResponse({ error: "Unsupported clan role." }, 400);
      }

      const { data, error } = await client.rpc("set_clan_member_role", {
        p_actor_id: user.id,
        p_next_role: nextRole,
        p_reason: reason,
        p_target_player_id: targetPlayerId
      });

      if (error) {
        throw error;
      }

      return jsonResponse({ membership: data });
    }

    if (action === "remove_member") {
      const { error } = await client.rpc("remove_clan_member", {
        p_actor_id: user.id,
        p_reason: reason,
        p_target_player_id: targetPlayerId
      });

      if (error) {
        throw error;
      }

      return jsonResponse({ removed: true });
    }

    return jsonResponse({ error: "Unsupported clan member action." }, 400);
  })
);
