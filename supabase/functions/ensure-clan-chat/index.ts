import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

    const { client, user } = await requireUser(request);
    const { data, error } = await client.rpc("ensure_clan_chat", {
      p_player_id: user.id
    });

    if (error) throw error;
    return jsonResponse({ thread: data }, 201);
  })
);
