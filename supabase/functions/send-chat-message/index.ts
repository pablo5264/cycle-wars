import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { enforceRateLimit, rateLimits, requestSubject } from "../_shared/ops.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString } from "../_shared/validation.ts";

interface SendChatMessageRequest {
  threadId: string;
  body: string;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
    const { client, user } = await requireUser(request);
    await enforceRateLimit(client, requestSubject(request, user.id), rateLimits.chatWrite);
    const body = await readJson<SendChatMessageRequest>(request);
    const { data, error } = await client.rpc("send_chat_message", {
      p_thread_id: assertString(body.threadId, "threadId"),
      p_sender_id: user.id,
      p_body: assertString(body.body, "body")
    });
    if (error) throw error;
    return jsonResponse({ message: data }, 201);
  })
);
