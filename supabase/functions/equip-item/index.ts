import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString } from "../_shared/validation.ts";

interface EquipItemRequest {
  itemId: string;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

    const { client, user } = await requireUser(request);
    const body = await readJson<EquipItemRequest>(request);
    const { data, error } = await client.rpc("equip_inventory_item", {
      p_player_id: user.id,
      p_item_id: assertString(body.itemId, "itemId")
    });

    if (error) throw error;
    return jsonResponse({ inventory: data });
  })
);
