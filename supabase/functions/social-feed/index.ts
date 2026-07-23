import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "30"), 100);
    const client = serviceClient();
    const { data, error } = await client
      .from("v_feed_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return jsonResponse({ posts: data ?? [] });
  })
);
