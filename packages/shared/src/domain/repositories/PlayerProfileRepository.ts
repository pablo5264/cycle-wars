import type { PlayerProfile } from "../entities/PlayerProfile";

export interface PlayerProfileRepository {
  findById(id: string): Promise<PlayerProfile | null>;
}
