import { createClient } from "npm:@supabase/supabase-js@2.47.10";
import { HttpError } from "./http.ts";

export function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new HttpError(500, "Supabase service environment is not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function requireUser(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing bearer token.");
  }

  const client = serviceClient();
  const token = authorization.slice("Bearer ".length);
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    throw new HttpError(401, "Invalid or expired bearer token.");
  }

  return { client, user: data.user };
}

export function requireServiceSecret(request: Request): void {
  const expected = Deno.env.get("CYCLE_WARS_INTERNAL_SECRET");
  const received = request.headers.get("x-cycle-wars-secret");

  if (!expected || received !== expected) {
    throw new HttpError(401, "Invalid internal service secret.");
  }
}
