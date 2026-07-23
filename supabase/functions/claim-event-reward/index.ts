import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString } from "../_shared/validation.ts";

interface ClaimEventRewardRequest {
  eventId: string;
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
    const body = await readJson<ClaimEventRewardRequest>(request);
    const { data, error } = await client.rpc("claim_player_event_reward", {
      p_player_id: user.id,
      p_event_id: assertString(body.eventId, "eventId")
    });

    if (error) {
      throw error;
    }

    return jsonResponse({ claim: data });
  })
);
