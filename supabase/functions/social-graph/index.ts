import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertString } from "../_shared/validation.ts";

interface SocialGraphRequest {
  action: "request_friend" | "follow" | "unfollow";
  targetPlayerId: string;
}

Deno.serve((request) =>
  handleRequest(async () => {
    if (request.method === "OPTIONS") return optionsResponse();
    const { client, user } = await requireUser(request);

    if (request.method === "GET") {
      const [friendships, following, notifications] = await Promise.all([
        client.from("friendships").select("*").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
        client.from("follows").select("*").eq("follower_id", user.id),
        client.from("notifications").select("*").eq("player_id", user.id).order("created_at", { ascending: false }).limit(20)
      ]);
      if (friendships.error) throw friendships.error;
      if (following.error) throw following.error;
      if (notifications.error) throw notifications.error;
      return jsonResponse({
        friendships: friendships.data ?? [],
        following: following.data ?? [],
        notifications: notifications.data ?? []
      });
    }

    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

    const body = await readJson<SocialGraphRequest>(request);
    const targetPlayerId = assertString(body.targetPlayerId, "targetPlayerId");
    if (body.action === "request_friend") {
      const { data, error } = await client.rpc("request_friendship", {
        p_requester_id: user.id,
        p_addressee_id: targetPlayerId
      });
      if (error) throw error;
      return jsonResponse({ friendship: data }, 201);
    }

    const { data, error } = await client.rpc("set_follow", {
      p_follower_id: user.id,
      p_followed_id: targetPlayerId,
      p_should_follow: body.action === "follow"
    });
    if (error) throw error;
    return jsonResponse({ following: data });
  })
);
