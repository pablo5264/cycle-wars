import type { TerritoryMapItem } from "./AppModels";

export interface MapCenter {
  latitude: number;
  longitude: number;
}

export interface H3Viewport {
  center: MapCenter;
  resolution: number;
  ringSize: number;
}

export type TerritoryFeatureProperties = {
  h3Index: string;
  ownerName: string;
  clanName: string;
  influence: number;
  influenceProgress: number;
  level: number;
  levelName: string;
  levelProgress: number;
  shieldSecondsRemaining: number;
  status: TerritoryMapItem["status"] | "unknown";
  fillColor: string;
  strokeColor: string;
  fillOpacity: number;
};

export type TerritoryFeature = {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: TerritoryFeatureProperties;
};

export interface TerritoryMapFeatureCollection {
  type: "FeatureCollection";
  features: TerritoryFeature[];
}
