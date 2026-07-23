import { H3Index } from "../value-objects/H3Index";
import { Influence } from "../value-objects/Influence";

export type TerritoryStatus = "neutral" | "protected" | "vulnerable" | "contested";
export type TerritoryLevel = 1 | 2 | 3 | 4 | 5;

export interface TerritoryProps {
  id: H3Index;
  ownerId: string | null;
  clanId: string | null;
  capturedAt: Date | null;
  influence: Influence;
  level: TerritoryLevel;
  shieldUntil: Date | null;
  color: string;
  status: TerritoryStatus;
}

export interface ConquestAttempt {
  challengerId: string;
  challengerClanId: string | null;
  gainedInfluence: Influence;
  shieldMinutes: number;
  now: Date;
}

export class Territory {
  constructor(private readonly props: TerritoryProps) {}

  snapshot(): TerritoryProps {
    return { ...this.props };
  }

  isProtected(now: Date): boolean {
    return this.props.shieldUntil !== null && this.props.shieldUntil.getTime() > now.getTime();
  }

  applyConquestAttempt(attempt: ConquestAttempt): Territory {
    if (this.isProtected(attempt.now)) {
      return new Territory({ ...this.props, status: "protected" });
    }

    const challengerBeatsOwner = attempt.gainedInfluence.exceeds(this.props.influence);
    if (!challengerBeatsOwner) {
      return new Territory({ ...this.props, status: "contested" });
    }

    const shieldUntil = new Date(attempt.now.getTime() + attempt.shieldMinutes * 60_000);

    return new Territory({
      ...this.props,
      ownerId: attempt.challengerId,
      clanId: attempt.challengerClanId,
      capturedAt: attempt.now,
      influence: attempt.gainedInfluence,
      shieldUntil,
      status: "protected"
    });
  }

  decay(decayPoints: number): Territory {
    const influence = this.props.influence.decay(decayPoints);
    const status: TerritoryStatus = this.props.ownerId === null ? "neutral" : "vulnerable";

    return new Territory({ ...this.props, influence, status });
  }
}
