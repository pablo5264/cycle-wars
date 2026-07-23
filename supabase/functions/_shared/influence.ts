export interface InfluenceInput {
  distanceMeters: number;
  accuracyMeters: number;
  speedKmh: number;
  trustScore: number;
}

export function calculateInfluence(input: InfluenceInput): number {
  if (input.distanceMeters <= 0 || input.trustScore < 70 || input.accuracyMeters > 80) {
    return 0;
  }

  const accuracyMultiplier = input.accuracyMeters <= 10 ? 1 : input.accuracyMeters <= 30 ? 0.75 : 0.45;
  const speedMultiplier = input.speedKmh <= 45 ? 1 : input.speedKmh <= 60 ? 0.55 : 0.2;
  const trustMultiplier = input.trustScore / 100;

  return Math.round(input.distanceMeters * accuracyMultiplier * speedMultiplier * trustMultiplier);
}
