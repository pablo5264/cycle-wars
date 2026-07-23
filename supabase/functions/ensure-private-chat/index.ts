import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString } from "../_shared/validation.ts";

interface EnsurePrivateChatRequest {
  targetPlayerId: string;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
    const { client, user } = await requireUser(request);
    const body = await readJson<EnsurePrivateChatRequest>(request);
    const { data, error } = await client.rpc("ensure_private_chat", {
      p_player_a: user.id,
      p_player_b: assertString(body.targetPlayerId, "targetPlayerId")
    });
    if (error) throw error;
    return jsonResponse({ thread: data }, 201);
  })
);
