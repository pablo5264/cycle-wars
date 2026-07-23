import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString, optionalString } from "../_shared/validation.ts";

interface ClanJoinRequestPayload {
  action?: unknown;
  clanId?: unknown;
  requestId?: unknown;
  message?: unknown;
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

      const [directory, sent] = await Promise.all([
        client
          .from("v_clan_directory")
          .select("*")
          .order("member_count", { ascending: false })
          .limit(25),
        client
          .from("v_clan_join_requests")
          .select("*")
          .eq("requester_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)
      ]);

      if (directory.error) {
        throw directory.error;
      }

      if (sent.error) {
        throw sent.error;
      }

      let receivedData: unknown[] = [];

      if (profile?.clan_id) {
        const { data: membership, error: membershipError } = await client
          .from("clan_memberships")
          .select("role")
          .eq("clan_id", profile.clan_id)
          .eq("player_id", user.id)
          .maybeSingle();

        if (membershipError) {
          throw membershipError;
        }

        if (membership?.role === "leader" || membership?.role === "captain") {
          const { data: received, error: receivedError } = await client
            .from("v_clan_join_requests")
            .select("*")
            .eq("clan_id", profile.clan_id)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(50);

          if (receivedError) {
            throw receivedError;
          }

          receivedData = received ?? [];
        }
      }

      return jsonResponse({
        clans: directory.data ?? [],
        received: receivedData,
        sent: sent.data ?? []
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const body = await readJson<ClanJoinRequestPayload>(request);
    const action = assertString(body.action, "action");

    if (action === "request") {
      const clanId = assertString(body.clanId, "clanId");
      const message = optionalString(body.message);
      const { data, error } = await client.rpc("request_to_join_clan", {
        p_actor_id: user.id,
        p_clan_id: clanId,
        p_message: message
      });

      if (error) {
        throw error;
      }

      return jsonResponse({ request: data }, 201);
    }

    if (action === "approve" || action === "reject") {
      const requestId = assertString(body.requestId, "requestId");
      const { data, error } = await client.rpc("respond_to_clan_join_request", {
        p_actor_id: user.id,
        p_request_id: requestId,
        p_response: action === "approve" ? "approved" : "rejected"
      });

      if (error) {
        throw error;
      }

      return jsonResponse({ request: data });
    }

    return jsonResponse({ error: "Unsupported clan join request action." }, 400);
  })
);
