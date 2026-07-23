import type { SupabaseClient } from "npm:@supabase/supabase-js@2.47.10";
import { HttpError } from "./http.ts";

export interface RateLimitPolicy {
  bucket: string;
  limit: number;
  windowSeconds: number;
}

export const rateLimits = {
  gpsIngest: { bucket: "gps_ingest", limit: 90, windowSeconds: 300 },
  writeSocial: { bucket: "write_social", limit: 60, windowSeconds: 300 },
  readMap: { bucket: "read_map", limit: 240, windowSeconds: 300 },
  shopWrite: { bucket: "shop_write", limit: 30, windowSeconds: 300 },
  chatWrite: { bucket: "chat_write", limit: 80, windowSeconds: 300 }
} satisfies Record<string, RateLimitPolicy>;

export async function enforceRateLimit(
  client: SupabaseClient,
  subject: string,
  policy: RateLimitPolicy
): Promise<void> {
  const { data, error } = await client.rpc("check_rate_limit", {
    p_bucket: policy.bucket,
    p_subject: subject,
    p_limit: policy.limit,
    p_window_seconds: policy.windowSeconds
  });

  if (error) {
    throw error;
  }

  if (data !== true) {
    throw new HttpError(429, "Rate limit exceeded.", {
      bucket: policy.bucket,
      windowSeconds: policy.windowSeconds
    });
  }
}

export async function recordFunctionLog(
  client: SupabaseClient,
  input: {
    functionName: string;
    userId: string | null;
    statusCode: number;
    durationMs: number;
    errorMessage?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await client.rpc("record_edge_function_log", {
    p_function_name: input.functionName,
    p_user_id: input.userId,
    p_status_code: input.statusCode,
    p_duration_ms: input.durationMs,
    p_error_message: input.errorMessage ?? null,
    p_metadata: input.metadata ?? {}
  });
}

export function requestSubject(request: Request, userId: string | null): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${forwardedFor || "unknown"}`;
}
