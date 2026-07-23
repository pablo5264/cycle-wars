import type { GpsPoint } from "./geo.ts";
import { haversineMeters } from "./geo.ts";

export interface AntiCheatResult {
  status: "trusted" | "suspicious" | "rejected";
  trustScore: number;
  signals: Array<{
    signal:
      | "fake_gps"
      | "teleport"
      | "root"
      | "jailbreak"
      | "impossible_speed"
      | "vehicle_profile"
      | "route_duplication"
      | "clock_tampering"
      | "spoofing";
    severity: number;
    evidence: Record<string, unknown>;
  }>;
}

export interface DeviceIntegrity {
  isMocked?: boolean;
  isRooted?: boolean;
  isJailbroken?: boolean;
  clockOffsetMs?: number;
}

export function evaluateGpsSample(
  current: GpsPoint,
  previous: GpsPoint | null,
  integrity: DeviceIntegrity
): AntiCheatResult {
  const signals: AntiCheatResult["signals"] = [];
  const maxCyclingSpeedKmh = Number(Deno.env.get("ANTICHEAT_MAX_CYCLING_SPEED_KMH") ?? "75");

  if (integrity.isMocked) {
    signals.push({ signal: "fake_gps", severity: 5, evidence: { source: "device" } });
  }

  if (integrity.isRooted) {
    signals.push({ signal: "root", severity: 3, evidence: { source: "device" } });
  }

  if (integrity.isJailbroken) {
    signals.push({ signal: "jailbreak", severity: 3, evidence: { source: "device" } });
  }

  if (Math.abs(integrity.clockOffsetMs ?? 0) > 120_000) {
    signals.push({
      signal: "clock_tampering",
      severity: 4,
      evidence: { clockOffsetMs: integrity.clockOffsetMs }
    });
  }

  if (current.accuracyMeters > 80) {
    signals.push({
      signal: "spoofing",
      severity: 2,
      evidence: { accuracyMeters: current.accuracyMeters }
    });
  }

  if (current.speedKmh > maxCyclingSpeedKmh) {
    signals.push({
      signal: current.speedKmh > 110 ? "vehicle_profile" : "impossible_speed",
      severity: current.speedKmh > 110 ? 5 : 4,
      evidence: { speedKmh: current.speedKmh, maxCyclingSpeedKmh }
    });
  }

  if (previous) {
    const seconds = Math.max(
      1,
      (Date.parse(current.recordedAt) - Date.parse(previous.recordedAt)) / 1000
    );
    const distanceMeters = haversineMeters(previous, current);
    const derivedSpeedKmh = (distanceMeters / seconds) * 3.6;

    if (distanceMeters > 1500 && seconds < 60) {
      signals.push({
        signal: "teleport",
        severity: 5,
        evidence: { distanceMeters, seconds, derivedSpeedKmh }
      });
    }

    if (derivedSpeedKmh > maxCyclingSpeedKmh) {
      signals.push({
        signal: "impossible_speed",
        severity: 4,
        evidence: { distanceMeters, seconds, derivedSpeedKmh }
      });
    }
  }

  const penalty = signals.reduce((total, signal) => total + signal.severity * 14, 0);
  const trustScore = Math.max(0, 100 - penalty);
  const worstSeverity = Math.max(0, ...signals.map((signal) => signal.severity));

  return {
    status: worstSeverity >= 5 ? "rejected" : trustScore < 70 ? "suspicious" : "trusted",
    trustScore,
    signals
  };
}
