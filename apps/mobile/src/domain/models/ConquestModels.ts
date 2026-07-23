import type { TerritoryMapItem } from "./AppModels";

export interface TerritoryConquestView {
  h3Index: string;
  status: TerritoryMapItem["status"] | "unknown";
  ownerName: string;
  clanName: string;
  influencePoints: number;
  influenceProgress: number;
  level: number;
  levelName: string;
  levelProgress: number;
  shieldSecondsRemaining: number;
  shieldLabel: string;
  isShielded: boolean;
}
