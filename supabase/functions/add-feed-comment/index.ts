import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString } from "../_shared/validation.ts";

interface AddFeedCommentRequest {
  postId: string;
  body: string;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

    const { client, user } = await requireUser(request);
    const body = await readJson<AddFeedCommentRequest>(request);
    const { data, error } = await client.rpc("add_feed_comment", {
      p_post_id: assertString(body.postId, "postId"),
      p_author_id: user.id,
      p_body: assertString(body.body, "body")
    });

    if (error) throw error;
    return jsonResponse({ comment: data }, 201);
  })
);
