import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { requireServiceSecret, serviceClient } from "../_shared/supabase.ts";

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    requireServiceSecret(request);
    const client = serviceClient();
    const { error } = await client.rpc("refresh_rankings");

    if (error) {
      throw error;
    }

    return jsonResponse({ status: "ok", refreshedAt: new Date().toISOString() });
  })
);
