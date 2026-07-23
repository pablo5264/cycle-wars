import { assertNumber, assertString } from "../_shared/validation.ts";
import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

interface RecordPerformancePayload {
  eventName?: unknown;
  durationMs?: unknown;
  metadata?: unknown;
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
    const payload = await readJson<RecordPerformancePayload>(request);
    const eventName = assertString(payload.eventName, "eventName").slice(0, 80);
    const durationMs =
      payload.durationMs === null || payload.durationMs === undefined
        ? null
        : assertNumber(payload.durationMs, "durationMs", 0, 300_000);
    const metadata = payload.metadata === undefined ? {} : payload.metadata;
    if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
      return jsonResponse({ error: "metadata must be an object." }, 400);
    }

    await client.rpc("record_mobile_performance_event", {
      p_duration_ms: durationMs,
      p_event_name: eventName,
      p_metadata: metadata,
      p_player_id: user.id
    });

    return jsonResponse({ recorded: true });
  })
);
