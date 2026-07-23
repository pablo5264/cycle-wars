import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { enforceRateLimit, rateLimits, requestSubject } from "../_shared/ops.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString, optionalString } from "../_shared/validation.ts";

interface CreateFeedPostRequest {
  body: string;
  visibility?: "public" | "friends" | "clan" | "private";
  activityId?: string | null;
  territoryH3Index?: string | null;
  mediaPaths?: string[];
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

    const { client, user } = await requireUser(request);
    await enforceRateLimit(client, requestSubject(request, user.id), rateLimits.writeSocial);
    const body = await readJson<CreateFeedPostRequest>(request);
    const text = assertString(body.body, "body");
    const { data, error } = await client.rpc("create_feed_post", {
      p_author_id: user.id,
      p_body: text,
      p_visibility: body.visibility ?? "public",
      p_activity_id: optionalString(body.activityId),
      p_territory_h3_index: optionalString(body.territoryH3Index),
      p_media_paths: body.mediaPaths ?? []
    });

    if (error) throw error;
    return jsonResponse({ post: data }, 201);
  })
);
