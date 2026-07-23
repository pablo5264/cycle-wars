import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString, optionalString } from "../_shared/validation.ts";

interface ClanInvitationPayload {
  action?: unknown;
  targetPlayerId?: unknown;
  invitationId?: unknown;
  message?: unknown;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    const { client, user } = await requireUser(request);

    if (request.method === "GET") {
      const [received, sent] = await Promise.all([
        client
          .from("v_clan_invitations")
          .select("*")
          .eq("target_player_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        client
          .from("v_clan_invitations")
          .select("*")
          .eq("actor_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)
      ]);

      if (received.error) {
        throw received.error;
      }

      if (sent.error) {
        throw sent.error;
      }

      return jsonResponse({
        received: received.data ?? [],
        sent: sent.data ?? []
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const body = await readJson<ClanInvitationPayload>(request);
    const action = assertString(body.action, "action");

    if (action === "send") {
      const targetPlayerId = assertString(body.targetPlayerId, "targetPlayerId");
      const message = optionalString(body.message);
      const { data, error } = await client.rpc("create_clan_invitation", {
        p_actor_id: user.id,
        p_message: message,
        p_target_player_id: targetPlayerId
      });

      if (error) {
        throw error;
      }

      return jsonResponse({ invitation: data }, 201);
    }

    if (action === "accept" || action === "decline") {
      const invitationId = assertString(body.invitationId, "invitationId");
      const { data, error } = await client.rpc("respond_to_clan_invitation", {
        p_actor_id: user.id,
        p_invitation_id: invitationId,
        p_response: action === "accept" ? "accepted" : "declined"
      });

      if (error) {
        throw error;
      }

      return jsonResponse({ invitation: data });
    }

    return jsonResponse({ error: "Unsupported clan invitation action." }, 400);
  })
);
