import type { TerritoryMapItem } from "../../domain/models/AppModels";
import type { TerritoryConquestView } from "../../domain/models/ConquestModels";

const baseInfluence = 1000;
const levelNames: Record<number, string> = {
  1: "Puesto",
  2: "Campamento",
  3: "Base",
  4: "Fortaleza",
  5: "Ciudadela"
};

export class ConquestPresenter {
  fromTerritory(territory: TerritoryMapItem | null, h3Index: string): TerritoryConquestView {
    const influencePoints = territory?.influence_points ?? 0;
    const shieldSecondsRemaining = this.shieldSeconds(territory);
    const level = territory?.level ?? 1;
    const totalDistance = territory?.total_distance_meters ?? 0;
    const requiredDistance = territory?.required_distance_meters ?? this.requiredDistanceFor(level);
    const nextDistance = territory?.next_level_distance_meters ?? this.requiredDistanceFor(level + 1);
    const levelSpan = Math.max(1, nextDistance - requiredDistance);
    const levelProgress =
      level >= 5 ? 1 : clamp((totalDistance - requiredDistance) / levelSpan, 0, 1);

    return {
      h3Index,
      status: territory?.status ?? "unknown",
      ownerName: territory?.owner_name ?? "Neutral",
      clanName: territory?.clan_name ?? "Sin clan",
      influencePoints,
      influenceProgress: clamp(influencePoints / baseInfluence, 0, 1),
      level,
      levelName: territory?.level_name ?? levelNames[level] ?? "Puesto",
      levelProgress,
      shieldSecondsRemaining,
      shieldLabel: this.formatShield(shieldSecondsRemaining),
      isShielded: shieldSecondsRemaining > 0
    };
  }

  private shieldSeconds(territory: TerritoryMapItem | null): number {
    if (!territory) {
      return 0;
    }

    if (typeof territory.shield_seconds_remaining === "number") {
      return Math.max(0, territory.shield_seconds_remaining);
    }

    if (!territory.shield_until) {
      return 0;
    }

    return Math.max(0, Math.round((Date.parse(territory.shield_until) - Date.now()) / 1000));
  }

  private formatShield(seconds: number): string {
    if (seconds <= 0) {
      return "Sin escudo";
    }

    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} h ${remainingMinutes} min`;
  }

  private requiredDistanceFor(level: number): number {
    if (level <= 1) {
      return 0;
    }

    if (level === 2) {
      return 5000;
    }

    if (level === 3) {
      return 15000;
    }

    if (level === 4) {
      return 35000;
    }

    return 75000;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
