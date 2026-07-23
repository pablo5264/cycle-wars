import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { requireServiceSecret, serviceClient } from "../_shared/supabase.ts";

interface DispatchEventRemindersPayload {
  now?: string | null;
  limit?: number;
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
      body.trim().length > 0 ? (JSON.parse(body) as DispatchEventRemindersPayload) : {};
    const client = serviceClient();
    const { data, error } = await client.rpc("dispatch_due_event_reminders", {
      p_limit: payload.limit ?? 100,
      p_now: payload.now ?? null
    });

    if (error) {
      throw error;
    }

    return jsonResponse({ dispatched: Number(data ?? 0) });
  })
);
