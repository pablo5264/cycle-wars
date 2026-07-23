import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { HttpError } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

interface NotificationActionPayload {
  action: "mark_read" | "mark_all_read";
  notificationId?: string;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    const { client, user } = await requireUser(request);

    if (request.method === "POST") {
      const payload = await readJson<NotificationActionPayload>(request);

      if (payload.action === "mark_read") {
        if (!payload.notificationId) {
          throw new HttpError(400, "notificationId is required.");
        }

        const { data, error } = await client
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", payload.notificationId)
          .eq("player_id", user.id)
          .select("*")
          .single();

        if (error) throw error;
        return jsonResponse({ notification: data });
      }

      if (payload.action === "mark_all_read") {
        const { error } = await client
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("player_id", user.id)
          .is("read_at", null);

        if (error) throw error;
        return jsonResponse({ ok: true });
      }

      throw new HttpError(400, "Unsupported notification action.");
    }

    if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);

    const { data, error } = await client
      .from("notifications")
      .select("*")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return jsonResponse({ notifications: data ?? [] });
  })
);
