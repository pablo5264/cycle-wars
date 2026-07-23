export interface BattleScoringInput {
  distanceMeters: number;
  level: number;
  resistanceScore: number;
  historyScore: number;
  speedKmh: number;
  timeInTerritorySeconds: number;
}

export class BattleScoringService {
  calculate(input: BattleScoringInput): number {
    const score =
      Math.max(0, input.distanceMeters) * 1 +
      Math.max(1, input.level) * 35 +
      Math.max(0, input.resistanceScore) * 0.85 +
      Math.max(0, input.historyScore) * 0.65 +
      Math.min(Math.max(0, input.speedKmh), 65) * 7 +
      Math.max(0, input.timeInTerritorySeconds) * 0.45;

    return Math.round(score * 100) / 100;
  }
}
