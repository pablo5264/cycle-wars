import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString } from "../_shared/validation.ts";

interface ToggleFeedLikeRequest {
  postId: string;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

    const { client, user } = await requireUser(request);
    const body = await readJson<ToggleFeedLikeRequest>(request);
    const { data, error } = await client.rpc("toggle_feed_like", {
      p_post_id: assertString(body.postId, "postId"),
      p_player_id: user.id
    });

    if (error) throw error;
    return jsonResponse({ liked: data });
  })
);
