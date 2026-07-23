import { handleRequest, jsonResponse, optionsResponse } from "../_shared/http.ts";
import { serviceClient } from "../_shared/supabase.ts";

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);

    const client = serviceClient();
    const { data, error } = await client
      .from("v_shop_catalog")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return jsonResponse({ items: data ?? [] });
  })
);
