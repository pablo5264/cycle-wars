import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireServiceSecret, serviceClient } from "../_shared/supabase.ts";
import { assertNumber, assertString, optionalString } from "../_shared/validation.ts";

interface GrantCurrencyRequest {
  playerId: string;
  currency: "coins" | "crystals";
  amount: number;
  reason: string;
  referenceType?: string | null;
  referenceId?: string | null;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

    requireServiceSecret(request);
    const client = serviceClient();
    const body = await readJson<GrantCurrencyRequest>(request);
    const { data, error } = await client.rpc("grant_currency", {
      p_player_id: assertString(body.playerId, "playerId"),
      p_currency: body.currency,
      p_amount: assertNumber(body.amount, "amount", 1, 1000000),
      p_reason: assertString(body.reason, "reason"),
      p_reference_type: optionalString(body.referenceType),
      p_reference_id: optionalString(body.referenceId)
    });

    if (error) throw error;
    return jsonResponse({ wallet: data });
  })
);
