import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "GET" && request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const { client, user } = await requireUser(request);
    const { error: refreshError } = await client.rpc("refresh_player_event_progress", {
      p_player_id: user.id
    });

    if (refreshError) {
      throw refreshError;
    }

    const { data, error } = await client
      .from("v_player_events")
      .select("*")
      .or(`player_id.eq.${user.id},player_id.is.null`)
      .lte("starts_at", new Date().toISOString())
      .gt("ends_at", new Date().toISOString())
      .order("ends_at", { ascending: true });

    if (error) {
      throw error;
    }

    return jsonResponse({ events: data ?? [] });
  })
);
