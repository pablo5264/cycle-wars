import { latLngToCell } from "npm:h3-js@4.1.0";

export interface GpsPoint {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  speedKmh: number;
  recordedAt: string;
}

export function h3IndexFor(latitude: number, longitude: number): string {
  const resolution = Number(Deno.env.get("H3_DEFAULT_RESOLUTION") ?? "9");
  return latLngToCell(latitude, longitude, resolution);
}

export function haversineMeters(a: GpsPoint, b: GpsPoint): number {
  const earthRadiusMeters = 6_371_000;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const sinLat = Math.sin(deltaLat / 2);
  const sinLon = Math.sin(deltaLon / 2);
  const centralAngle =
    2 *
    Math.atan2(
      Math.sqrt(sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon),
      Math.sqrt(1 - (sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon))
    );

  return earthRadiusMeters * centralAngle;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
