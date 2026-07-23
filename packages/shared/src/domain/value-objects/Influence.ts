export class Influence {
  private constructor(public readonly points: number) {}

  static from(points: number): Influence {
    if (!Number.isFinite(points) || points < 0) {
      throw new Error("Influence must be a finite positive number.");
    }

    return new Influence(Math.round(points));
  }

  add(points: number): Influence {
    return Influence.from(this.points + Math.max(0, points));
  }

  decay(decayPoints: number): Influence {
    return Influence.from(Math.max(0, this.points - Math.max(0, decayPoints)));
  }

  exceeds(other: Influence): boolean {
    return this.points > other.points;
  }
}
