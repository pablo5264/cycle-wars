import { PlayerProfile, type PlayerProfileRepository } from "@cycle-wars/shared";

export class InMemoryPlayerProfileRepository implements PlayerProfileRepository {
  private readonly profiles = new Map<string, PlayerProfile>([
    [
      "local-rider",
      new PlayerProfile({
        id: "local-rider",
        displayName: "Founder Rider",
        avatarUrl: null,
        biography: "First rider on the Cycle Wars grid.",
        city: "Santiago",
        level: 1,
        experience: 0,
        clanId: null,
        league: "bronze",
        stats: {
          territories: 0,
          totalSeconds: 0,
          distanceMeters: 0,
          averageSpeedKmh: 0,
          elevationGainMeters: 0,
          calories: 0,
          conquests: 0,
          defenses: 0,
          wins: 0,
          losses: 0
        }
      })
    ]
  ]);

  async findById(id: string): Promise<PlayerProfile | null> {
    return this.profiles.get(id) ?? null;
  }
}
