export type LeagueTier =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "master"
  | "grand_master"
  | "legend";

export interface PlayerStats {
  territories: number;
  totalSeconds: number;
  distanceMeters: number;
  averageSpeedKmh: number;
  elevationGainMeters: number;
  calories: number;
  conquests: number;
  defenses: number;
  wins: number;
  losses: number;
}

export interface PlayerProfileProps {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  biography: string | null;
  city: string | null;
  level: number;
  experience: number;
  clanId: string | null;
  league: LeagueTier;
  stats: PlayerStats;
}

export class PlayerProfile {
  constructor(private readonly props: PlayerProfileProps) {
    if (props.level < 1) {
      throw new Error("Player level must be at least 1.");
    }
    if (props.experience < 0) {
      throw new Error("Player experience cannot be negative.");
    }
  }

  snapshot(): PlayerProfileProps {
    return { ...this.props, stats: { ...this.props.stats } };
  }
}
