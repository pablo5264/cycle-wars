import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString, optionalString } from "../_shared/validation.ts";

type ClanJoinPolicy = "open" | "approval_required" | "invite_only";

interface CreateClanPayload {
  name?: unknown;
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
    const body = await readJson<CreateClanPayload>(request);
    const name = assertString(body.name, "name");
    const description = optionalString(body.description);
    const color = optionalString(body.color) ?? "#39E58C";
    const city = optionalString(body.city);
    const countryCode = optionalString(body.countryCode);
    const joinPolicy = (optionalString(body.joinPolicy) ?? "approval_required") as ClanJoinPolicy;

    if (!allowedJoinPolicies.has(joinPolicy)) {
      return jsonResponse({ error: "Unsupported join policy." }, 400);
    }

    const { data, error } = await client.rpc("create_clan", {
      p_actor_id: user.id,
      p_city: city,
      p_color: color,
      p_country_code: countryCode,
      p_description: description,
      p_join_policy: joinPolicy,
      p_name: name
    });

    if (error) {
      throw error;
    }

    return jsonResponse({ clan: data }, 201);
  })
);
