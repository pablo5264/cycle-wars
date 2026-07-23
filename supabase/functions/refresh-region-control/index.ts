import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { requireServiceSecret, serviceClient } from "../_shared/supabase.ts";

interface RefreshRegionControlPayload {
  regionId?: string | null;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    requireServiceSecret(request);
    const body = await request.text();
    const payload =
      body.trim().length > 0 ? (JSON.parse(body) as RefreshRegionControlPayload) : {};
    const client = serviceClient();
    const { data, error } = await client.rpc("refresh_region_control", {
      p_region_id: payload.regionId ?? null
    });

    if (error) {
      throw error;
    }

    return jsonResponse({ refreshed: Number(data ?? 0) });
  })
);
