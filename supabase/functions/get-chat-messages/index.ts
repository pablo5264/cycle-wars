import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);
    const { client } = await requireUser(request);
    const url = new URL(request.url);
    const threadId = url.searchParams.get("threadId");
    if (!threadId) return jsonResponse({ error: "threadId is required." }, 400);
    const { data, error } = await client
      .from("chat_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw error;
    return jsonResponse({ messages: data ?? [] });
  })
);
