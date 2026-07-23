export interface InfluenceCalculatorInput {
  distanceMeters: number;
  accuracyMeters: number;
  speedKmh: number;
}

export class InfluenceCalculator {
  calculate(input: InfluenceCalculatorInput): number {
    if (input.distanceMeters <= 0 || input.accuracyMeters > 50 || input.speedKmh > 75) {
      return 0;
    }

    const accuracyMultiplier = input.accuracyMeters <= 10 ? 1 : 0.65;
    const speedMultiplier = input.speedKmh <= 45 ? 1 : 0.45;

    return Math.round(input.distanceMeters * accuracyMultiplier * speedMultiplier);
  }
}
