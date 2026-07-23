import { cellToBoundary, gridDisk, latLngToCell } from "h3-js";
import type { TerritoryMapItem } from "../../domain/models/AppModels";
import type {
  H3Viewport,
  MapCenter,
  TerritoryFeature,
  TerritoryMapFeatureCollection
} from "../../domain/models/MapModels";

const defaultNeutralColor = "#203140";

export class H3MapService {
  viewportCells(viewport: H3Viewport): string[] {
    const centerCell = latLngToCell(viewport.center.latitude, viewport.center.longitude, viewport.resolution);
    return gridDisk(centerCell, viewport.ringSize);
  }

  toFeatureCollection(
    h3Indexes: string[],
    territories: TerritoryMapItem[]
  ): TerritoryMapFeatureCollection {
    const byH3 = new Map(territories.map((territory) => [territory.h3_index, territory]));
    const features = h3Indexes.map((h3Index) => this.toFeature(h3Index, byH3.get(h3Index) ?? null));

    return {
      type: "FeatureCollection",
      features
    };
  }

  centerFromFeature(feature: TerritoryFeature): MapCenter {
    const coordinates = feature.geometry.coordinates[0] ?? [];
    const total = coordinates.reduce(
      (sum, coordinate) => ({
        longitude: sum.longitude + (coordinate[0] ?? 0),
        latitude: sum.latitude + (coordinate[1] ?? 0)
      }),
      { latitude: 0, longitude: 0 }
    );
    const divisor = Math.max(1, coordinates.length);

    return {
      latitude: total.latitude / divisor,
      longitude: total.longitude / divisor
    };
  }

  private toFeature(h3Index: string, territory: TerritoryMapItem | null): TerritoryFeature {
    const boundary = cellToBoundary(h3Index, true);
    const ring = boundary.map(([longitude, latitude]) => [longitude, latitude]);
    const first = ring[0];
    const closedRing = first ? [...ring, first] : ring;
    const style = this.styleFor(territory);

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [closedRing]
      },
      properties: {
        h3Index,
        ownerName: territory?.owner_name ?? "Neutral",
        clanName: territory?.clan_name ?? "Sin clan",
        influence: territory?.influence_points ?? 0,
        influenceProgress: Math.min(1, Math.max(0, (territory?.influence_points ?? 0) / 1000)),
        level: territory?.level ?? 1,
        levelName: territory?.level_name ?? this.levelName(territory?.level ?? 1),
        levelProgress: this.levelProgress(territory),
        shieldSecondsRemaining: this.shieldSeconds(territory),
        status: territory?.status ?? "unknown",
        ...style
      }
    };
  }

  private levelName(level: number): string {
    if (level === 5) {
      return "Ciudadela";
    }
    if (level === 4) {
      return "Fortaleza";
    }
    if (level === 3) {
      return "Base";
    }
    if (level === 2) {
      return "Campamento";
    }
    return "Puesto";
  }

  private levelProgress(territory: TerritoryMapItem | null): number {
    if (!territory) {
      return 0;
    }

    if (territory.level >= 5) {
      return 1;
    }

    const current = territory.required_distance_meters ?? 0;
    const next = territory.next_level_distance_meters ?? current + 5000;
    const total = territory.total_distance_meters ?? 0;
    return Math.min(1, Math.max(0, (total - current) / Math.max(1, next - current)));
  }

  private shieldSeconds(territory: TerritoryMapItem | null): number {
    if (!territory) {
      return 0;
    }

    if (typeof territory.shield_seconds_remaining === "number") {
      return Math.max(0, territory.shield_seconds_remaining);
    }

    if (!territory.shield_until) {
      return 0;
    }

    return Math.max(0, Math.round((Date.parse(territory.shield_until) - Date.now()) / 1000));
  }

  private styleFor(territory: TerritoryMapItem | null) {
    if (!territory) {
      return {
        fillColor: defaultNeutralColor,
        strokeColor: "#42566A",
        fillOpacity: 0.32
      };
    }

    if (territory.status === "contested") {
      return {
        fillColor: "#FFB454",
        strokeColor: "#FFE0A8",
        fillOpacity: 0.68
      };
    }

    if (territory.status === "protected") {
      return {
        fillColor: territory.clan_color ?? "#4CC9F0",
        strokeColor: "#E6FBFF",
        fillOpacity: 0.58
      };
    }

    if (territory.status === "vulnerable") {
      return {
        fillColor: territory.clan_color ?? "#39E58C",
        strokeColor: "#D4FFE8",
        fillOpacity: 0.52
      };
    }

    return {
      fillColor: defaultNeutralColor,
      strokeColor: "#42566A",
      fillOpacity: 0.35
    };
  }
}
