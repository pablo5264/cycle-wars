import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertDate } from "../_shared/validation.ts";

interface StartActivityRequest {
  startedAt: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const { client, user } = await requireUser(request);
    const body = await readJson<StartActivityRequest>(request);
    const startedAt = assertDate(body.startedAt, "startedAt");

    const { data: season } = await client
      .from("seasons")
      .select("id")
      .eq("status", "active")
      .lte("starts_at", new Date().toISOString())
      .gt("ends_at", new Date().toISOString())
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await client
      .from("activities")
      .insert({
        player_id: user.id,
        season_id: season?.id ?? null,
        status: "recording",
        started_at: startedAt,
        source: body.source ?? "mobile",
        metadata: body.metadata ?? {}
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse({ activity: data }, 201);
  })
);
