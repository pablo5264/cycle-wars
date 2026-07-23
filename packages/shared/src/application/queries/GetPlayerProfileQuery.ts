import type { PlayerProfile } from "../../domain/entities/PlayerProfile";
import type { PlayerProfileRepository } from "../../domain/repositories/PlayerProfileRepository";

export class GetPlayerProfileQuery {
  constructor(private readonly players: PlayerProfileRepository) {}

  async execute(playerId: string): Promise<PlayerProfile> {
    const profile = await this.players.findById(playerId);
    if (profile === null) {
      throw new Error(`Player profile not found: ${playerId}`);
    }

    return profile;
  }
}
