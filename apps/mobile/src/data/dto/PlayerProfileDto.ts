import type { LeagueTier, PlayerStats } from "@cycle-wars/shared";

export interface PlayerProfileDto {
  id: string;
  display_name: string;
  avatar_url: string | null;
  biography: string | null;
  city: string | null;
  level: number;
  experience: number;
  clan_id: string | null;
  league: LeagueTier;
  stats: PlayerStats;
}
