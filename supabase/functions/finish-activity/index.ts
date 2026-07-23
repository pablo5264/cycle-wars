import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertDate, assertString } from "../_shared/validation.ts";

interface FinishActivityRequest {
  activityId: string;
  endedAt: string;
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
    const body = await readJson<FinishActivityRequest>(request);
    const activityId = assertString(body.activityId, "activityId");
    const endedAt = assertDate(body.endedAt, "endedAt");

    const { data: activity, error: activityError } = await client
      .from("activities")
      .select("id, player_id, started_at, status")
      .eq("id", activityId)
      .eq("player_id", user.id)
      .single();

    if (activityError || !activity) {
      return jsonResponse({ error: "Activity not found." }, 404);
    }

    const { data: samples, error: sampleError } = await client
      .from("gps_samples")
      .select("recorded_at, speed_kmh, altitude_meters, status")
      .eq("activity_id", activityId)
      .order("recorded_at", { ascending: true });

    if (sampleError) {
      throw sampleError;
    }

    const { data: influenceEvents } = await client
      .from("territory_influence_events")
      .select("distance_meters")
      .eq("activity_id", activityId);

    const distanceMeters =
      influenceEvents?.reduce((total, event) => total + Number(event.distance_meters), 0) ?? 0;
    const movingSeconds = Math.max(
      0,
      Math.round((Date.parse(endedAt) - Date.parse(activity.started_at)) / 1000)
    );
    const trustedSamples = samples?.filter((sample) => sample.status === "trusted") ?? [];
    const averageSpeedKmh =
      trustedSamples.length > 0
        ? trustedSamples.reduce((total, sample) => total + Number(sample.speed_kmh), 0) /
          trustedSamples.length
        : 0;
    const maxSpeedKmh = Math.max(0, ...trustedSamples.map((sample) => Number(sample.speed_kmh)));
    const elevations = trustedSamples
      .map((sample) => Number(sample.altitude_meters))
      .filter((altitude) => Number.isFinite(altitude));
    const elevationGainMeters = elevations.reduce((gain, altitude, index) => {
      if (index === 0) {
        return gain;
      }

      const previousAltitude = elevations[index - 1] ?? altitude;
      return gain + Math.max(0, altitude - previousAltitude);
    }, 0);
    const calories = Math.round(distanceMeters * 0.035);
    const hasRejectedSamples = samples?.some((sample) => sample.status === "rejected") ?? false;
    const hasSuspiciousSamples = samples?.some((sample) => sample.status === "suspicious") ?? false;
    const finalStatus =
      activity.status === "recording"
        ? hasRejectedSamples
          ? "rejected"
          : hasSuspiciousSamples
            ? "quarantined"
            : "valid"
        : activity.status;

    const { data: updated, error: updateError } = await client
      .from("activities")
      .update({
        status: finalStatus,
        ended_at: endedAt,
        distance_meters: distanceMeters,
        moving_seconds: movingSeconds,
        elevation_gain_meters: elevationGainMeters,
        average_speed_kmh: averageSpeedKmh,
        max_speed_kmh: maxSpeedKmh,
        calories
      })
      .eq("id", activityId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    const { data: profile } = await client
      .from("player_profiles")
      .select("stats")
      .eq("id", user.id)
      .single();

    const currentStats = (profile?.stats ?? {}) as Record<string, number>;
    const previousDistance = Number(currentStats.distanceMeters ?? 0);
    const previousSeconds = Number(currentStats.totalSeconds ?? 0);
    const nextDistance = previousDistance + distanceMeters;
    const nextSeconds = previousSeconds + movingSeconds;
    const nextAverageSpeedKmh = nextSeconds > 0 ? (nextDistance / nextSeconds) * 3.6 : 0;

    await client
      .from("player_profiles")
      .update({
        stats: {
          ...currentStats,
          distanceMeters: nextDistance,
          totalSeconds: nextSeconds,
          averageSpeedKmh: nextAverageSpeedKmh,
          elevationGainMeters: Number(currentStats.elevationGainMeters ?? 0) + elevationGainMeters,
          calories: Number(currentStats.calories ?? 0) + calories
        }
      })
      .eq("id", user.id);

    return jsonResponse({ activity: updated });
  })
);
