import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);

    const { client, user } = await requireUser(request);
    const [wallets, inventory, ledger] = await Promise.all([
      client.from("wallets").select("*").eq("player_id", user.id),
      client.from("v_player_inventory").select("*").eq("player_id", user.id).order("acquired_at", { ascending: false }),
      client.from("economy_ledger").select("*").eq("player_id", user.id).order("created_at", { ascending: false }).limit(25)
    ]);

    if (wallets.error) throw wallets.error;
    if (inventory.error) throw inventory.error;
    if (ledger.error) throw ledger.error;

    return jsonResponse({
      wallets: wallets.data ?? [],
      inventory: inventory.data ?? [],
      ledger: ledger.data ?? []
    });
  })
);
