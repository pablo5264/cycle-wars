import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { enforceRateLimit, rateLimits, requestSubject } from "../_shared/ops.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString } from "../_shared/validation.ts";

interface PurchaseShopItemRequest {
  itemId: string;
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
    await enforceRateLimit(client, requestSubject(request, user.id), rateLimits.shopWrite);
    const body = await readJson<PurchaseShopItemRequest>(request);
    const itemId = assertString(body.itemId, "itemId");

    const { data, error } = await client.rpc("purchase_shop_item", {
      p_player_id: user.id,
      p_item_id: itemId
    });

    if (error) {
      throw error;
    }

    return jsonResponse({ inventory: data }, 201);
  })
);
