import type { TerritoryLevel } from "../../domain/entities/Territory";

export interface TerritoryLevelRule {
  level: TerritoryLevel;
  name: "Puesto" | "Campamento" | "Base" | "Fortaleza" | "Ciudadela";
  requiredDistanceMeters: number;
}

export const territoryLevelRules: TerritoryLevelRule[] = [
  { level: 1, name: "Puesto", requiredDistanceMeters: 0 },
  { level: 2, name: "Campamento", requiredDistanceMeters: 5000 },
  { level: 3, name: "Base", requiredDistanceMeters: 15000 },
  { level: 4, name: "Fortaleza", requiredDistanceMeters: 35000 },
  { level: 5, name: "Ciudadela", requiredDistanceMeters: 75000 }
];

export class TerritoryLevelingService {
  levelForDistance(distanceMeters: number): TerritoryLevelRule {
    const distance = Math.max(0, distanceMeters);
    const rule = [...territoryLevelRules]
      .reverse()
      .find((candidate) => candidate.requiredDistanceMeters <= distance);

    return rule ?? territoryLevelRules[0]!;
  }

  progressWithinLevel(distanceMeters: number): number {
    const current = this.levelForDistance(distanceMeters);
    const next = territoryLevelRules.find((rule) => rule.level === current.level + 1);

    if (!next) {
      return 1;
    }

    const span = next.requiredDistanceMeters - current.requiredDistanceMeters;
    return Math.min(1, Math.max(0, (distanceMeters - current.requiredDistanceMeters) / span));
  }
}
