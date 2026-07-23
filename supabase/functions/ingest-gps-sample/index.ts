import { evaluateGpsSample, type DeviceIntegrity } from "../_shared/anticheat.ts";
import { h3IndexFor, haversineMeters, type GpsPoint } from "../_shared/geo.ts";
import { handleRequest, jsonResponse, optionsResponse, readJson } from "../_shared/http.ts";
import { calculateInfluence } from "../_shared/influence.ts";
import { enforceRateLimit, rateLimits, requestSubject } from "../_shared/ops.ts";
import { requireUser } from "../_shared/supabase.ts";
import { assertNumber, assertString, optionalString } from "../_shared/validation.ts";

interface IngestGpsSampleRequest {
  activityId: string;
  latitude: number;
  longitude: number;
  altitudeMeters?: number | null;
  accuracyMeters: number;
  speedKmh: number;
  headingDegrees?: number | null;
  recordedAt: string;
  deviceIntegrity?: DeviceIntegrity;
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
    await enforceRateLimit(client, requestSubject(request, user.id), rateLimits.gpsIngest);
    const body = await readJson<IngestGpsSampleRequest>(request);
    const activityId = assertString(body.activityId, "activityId");
    const latitude = assertNumber(body.latitude, "latitude", -90, 90);
    const longitude = assertNumber(body.longitude, "longitude", -180, 180);
    const accuracyMeters = assertNumber(body.accuracyMeters, "accuracyMeters", 0, 10_000);
    const speedKmh = assertNumber(body.speedKmh, "speedKmh", 0, 250);
    const recordedAt = assertString(body.recordedAt, "recordedAt");

    if (Number.isNaN(Date.parse(recordedAt))) {
      return jsonResponse({ error: "recordedAt must be an ISO date." }, 400);
    }

    const { data: activity, error: activityError } = await client
      .from("activities")
      .select("id, player_id, status")
      .eq("id", activityId)
      .eq("player_id", user.id)
      .single();

    if (activityError || !activity) {
      return jsonResponse({ error: "Activity not found." }, 404);
    }

    if (activity.status !== "recording") {
      return jsonResponse({ error: "Activity is not recording." }, 409);
    }

    const { data: previousSample } = await client
      .from("gps_samples")
      .select("latitude, longitude, accuracy_meters, speed_kmh, recorded_at")
      .eq("activity_id", activityId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentPoint: GpsPoint = {
      latitude,
      longitude,
      accuracyMeters,
      speedKmh,
      recordedAt
    };

    const previousPoint: GpsPoint | null = previousSample
      ? {
          latitude: Number(previousSample.latitude),
          longitude: Number(previousSample.longitude),
          accuracyMeters: Number(previousSample.accuracy_meters),
          speedKmh: Number(previousSample.speed_kmh),
          recordedAt: previousSample.recorded_at
        }
      : null;

    const antiCheat = evaluateGpsSample(currentPoint, previousPoint, body.deviceIntegrity ?? {});
    const distanceMeters = previousPoint ? haversineMeters(previousPoint, currentPoint) : 0;
    const h3Index = h3IndexFor(latitude, longitude);
    const influenceDelta = calculateInfluence({
      distanceMeters,
      accuracyMeters,
      speedKmh,
      trustScore: antiCheat.trustScore
    });

    const { data: profile } = await client
      .from("player_profiles")
      .select("clan_id")
      .eq("id", user.id)
      .single();

    const { data: sample, error: sampleError } = await client
      .from("gps_samples")
      .insert({
        activity_id: activityId,
        player_id: user.id,
        recorded_at: recordedAt,
        location: `SRID=4326;POINT(${longitude} ${latitude})`,
        latitude,
        longitude,
        altitude_meters:
          typeof body.altitudeMeters === "number" && Number.isFinite(body.altitudeMeters)
            ? body.altitudeMeters
            : null,
        accuracy_meters: accuracyMeters,
        speed_kmh: speedKmh,
        heading_degrees:
          typeof body.headingDegrees === "number" && Number.isFinite(body.headingDegrees)
            ? body.headingDegrees
            : null,
        h3_index: h3Index,
        status: antiCheat.status,
        trust_score: antiCheat.trustScore
      })
      .select("*")
      .single();

    if (sampleError) {
      throw sampleError;
    }

    for (const signal of antiCheat.signals) {
      await client.from("anti_cheat_signals").insert({
        player_id: user.id,
        activity_id: activityId,
        signal: signal.signal,
        severity: signal.severity,
        evidence: signal.evidence
      });
    }

    let territory = null;
    if (influenceDelta > 0 && antiCheat.status === "trusted") {
      const shieldMinutes = Number(Deno.env.get("TERRITORY_SHIELD_MINUTES") ?? "180");
      const { data, error } = await client.rpc("apply_territory_influence", {
        p_h3_index: h3Index,
        p_player_id: user.id,
        p_clan_id: optionalString(profile?.clan_id),
        p_activity_id: activityId,
        p_influence_delta: influenceDelta,
        p_distance_meters: distanceMeters,
        p_shield_minutes: shieldMinutes,
        p_now: new Date().toISOString()
      });

      if (error) {
        throw error;
      }

      territory = data;
    }

    let battle = null;
    if (antiCheat.status === "trusted") {
      const twoMinutesAgo = new Date(Date.now() - 120_000).toISOString();
      const { data: nearbyRival } = await client
        .from("gps_samples")
        .select("player_id")
        .eq("h3_index", h3Index)
        .gte("recorded_at", twoMinutesAgo)
        .neq("player_id", user.id)
        .eq("status", "trusted")
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (nearbyRival?.player_id) {
        const { data: existingBattle } = await client
          .from("battles")
          .select("id")
          .eq("territory_h3_index", h3Index)
          .in("status", ["pending", "active"])
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const battleId = existingBattle?.id;
        if (battleId) {
          await client.from("battles").update({ status: "active" }).eq("id", battleId);
          battle = { id: battleId, status: "active" };
        } else {
          const { data: createdBattle, error: battleError } = await client
            .from("battles")
            .insert({
              territory_h3_index: h3Index,
              status: "active",
              metrics: { openedBy: "gps_presence" }
            })
            .select("id, status")
            .single();

          if (battleError) {
            throw battleError;
          }

          battle = createdBattle;
        }

        if (battle?.id) {
          const pulseSeconds = previousPoint
            ? Math.max(1, Math.round((Date.parse(recordedAt) - Date.parse(previousPoint.recordedAt)) / 1000))
            : 1;

          const { data: participant, error: pulseError } = await client.rpc(
            "upsert_battle_participant_pulse",
            {
              p_battle_id: battle.id,
              p_player_id: user.id,
              p_clan_id: optionalString(profile?.clan_id),
              p_distance_meters: distanceMeters,
              p_speed_kmh: speedKmh,
              p_time_in_territory_seconds: pulseSeconds,
              p_now: new Date().toISOString()
            }
          );

          if (pulseError) {
            throw pulseError;
          }

          await client.rpc("upsert_battle_participant_pulse", {
            p_battle_id: battle.id,
            p_player_id: nearbyRival.player_id,
            p_clan_id: null,
            p_distance_meters: 0,
            p_speed_kmh: 0,
            p_time_in_territory_seconds: 1,
            p_now: new Date().toISOString()
          });

          battle = { ...battle, participant };
        }
      }
    }

    if (antiCheat.status === "rejected") {
      await client
        .from("activities")
        .update({ status: "rejected" })
        .eq("id", activityId);
    }

    return jsonResponse({
      sample,
      antiCheat,
      h3Index,
      distanceMeters,
      influenceDelta,
      territory,
      battle
    });
  })
);
