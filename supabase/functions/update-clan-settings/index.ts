import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { optionalString } from "../_shared/validation.ts";

type ClanJoinPolicy = "open" | "approval_required" | "invite_only";

interface UpdateClanSettingsPayload {
  description?: unknown;
  color?: unknown;
  city?: unknown;
  countryCode?: unknown;
  joinPolicy?: unknown;
}

const allowedJoinPolicies = new Set<ClanJoinPolicy>([
  "open",
  "approval_required",
  "invite_only"
]);

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") {
      return optionsResponse();
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    const { client, user } = await requireUser(request);
    const body = await readJson<UpdateClanSettingsPayload>(request);
    const description = optionalString(body.description);
    const color = optionalString(body.color);
    const city = optionalString(body.city);
    const countryCode = optionalString(body.countryCode);
    const joinPolicy = optionalString(body.joinPolicy) as ClanJoinPolicy | null;

    if (joinPolicy && !allowedJoinPolicies.has(joinPolicy)) {
      return jsonResponse({ error: "Unsupported join policy." }, 400);
    }

    const { data, error } = await client.rpc("update_clan_settings", {
      p_actor_id: user.id,
      p_city: city,
      p_color: color,
      p_country_code: countryCode,
      p_description: description,
      p_join_policy: joinPolicy
    });

    if (error) {
      throw error;
    }

    return jsonResponse({ clan: data });
  })
);
