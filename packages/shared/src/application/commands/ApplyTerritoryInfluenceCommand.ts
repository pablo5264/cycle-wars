import { Territory } from "../../domain/entities/Territory";
import type { TerritoryRepository } from "../../domain/repositories/TerritoryRepository";
import { H3Index } from "../../domain/value-objects/H3Index";
import { Influence } from "../../domain/value-objects/Influence";

export interface ApplyTerritoryInfluenceInput {
  h3Index: string;
  challengerId: string;
  challengerClanId: string | null;
  influencePoints: number;
  shieldMinutes: number;
  now: Date;
}

export class ApplyTerritoryInfluenceCommand {
  constructor(private readonly territories: TerritoryRepository) {}

  async execute(input: ApplyTerritoryInfluenceInput): Promise<Territory> {
    const h3Index = H3Index.from(input.h3Index);
    const existing = await this.territories.findById(h3Index);
    const territory =
      existing ??
      new Territory({
        id: h3Index,
        ownerId: null,
        clanId: null,
        capturedAt: null,
        influence: Influence.from(0),
        level: 1,
        shieldUntil: null,
        color: "#7A8794",
        status: "neutral"
      });

    const updated = territory.applyConquestAttempt({
      challengerId: input.challengerId,
      challengerClanId: input.challengerClanId,
      gainedInfluence: Influence.from(input.influencePoints),
      shieldMinutes: input.shieldMinutes,
      now: input.now
    });

    await this.territories.save(updated);
    return updated;
  }
}
