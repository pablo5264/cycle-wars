import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { HttpError } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

type ReminderAction = "set" | "cancel";

interface ReminderRequest {
  eventId: string;
  action?: ReminderAction;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    const { client, user } = await requireUser(request);

    if (request.method === "GET") {
      const url = new URL(request.url);
      const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 50);
      const { data, error } = await client
        .from("v_player_event_reminders")
        .select("*")
        .eq("player_id", user.id)
        .order("remind_at", { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return jsonResponse({ reminders: data ?? [] });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const payload = await readJson<ReminderRequest>(request);
    if (!payload.eventId) {
      throw new HttpError(400, "eventId is required.");
    }

    if (payload.action === "cancel") {
      const { data, error } = await client
        .from("event_reminders")
        .update({ status: "cancelled" })
        .eq("event_id", payload.eventId)
        .eq("player_id", user.id)
        .select("*")
        .maybeSingle();

      if (error) {
        throw error;
      }

      return jsonResponse({ reminder: data });
    }

    const { data: event, error: eventError } = await client
      .from("events")
      .select("id, starts_at")
      .eq("id", payload.eventId)
      .single();

    if (eventError || !event) {
      throw new HttpError(404, "Event not found.");
    }

    const startsAt = new Date(event.starts_at);
    if (startsAt.getTime() <= Date.now()) {
      throw new HttpError(409, "Only upcoming events can be reminded.");
    }

    const remindAt = new Date(startsAt.getTime() - 60 * 60 * 1000).toISOString();
    const { data, error } = await client
      .from("event_reminders")
      .upsert(
        {
          event_id: payload.eventId,
          player_id: user.id,
          remind_at: remindAt,
          status: "active"
        },
        { onConflict: "event_id,player_id" }
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse({ reminder: data });
  })
);
