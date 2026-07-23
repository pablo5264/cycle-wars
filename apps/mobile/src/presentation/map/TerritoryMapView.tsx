import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Text, View } from "react-native";
import type { MapCenter, TerritoryFeature } from "../../domain/models/MapModels";
import { openStreetMapRasterStyle } from "../../infrastructure/map/mapStyle";
import { FallbackHexGrid } from "./FallbackHexGrid";
import { colors } from "../theme/theme";

interface TerritoryMapViewProps {
  center: MapCenter;
  features: TerritoryFeature[];
  selectedH3Index: string | null;
  onSelect: (feature: TerritoryFeature) => void;
  onCenterChange: (center: MapCenter) => void;
}

interface MapLibreModule {
  MapView: ComponentType<Record<string, unknown>>;
  Camera: ComponentType<Record<string, unknown>>;
  ShapeSource: ComponentType<Record<string, unknown>>;
  FillLayer: ComponentType<Record<string, unknown>>;
  LineLayer: ComponentType<Record<string, unknown>>;
  UserLocation?: ComponentType<Record<string, unknown>>;
  setAccessToken?: (token: string | null) => void;
}

export function TerritoryMapView({
  center,
  features,
  selectedH3Index,
  onSelect,
  onCenterChange
}: TerritoryMapViewProps) {
  const [mapLibre] = useState<MapLibreModule | null>(() => loadMapLibre());
  const tileUrl = process.env.EXPO_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const style = useMemo(() => openStreetMapRasterStyle(tileUrl), [tileUrl]);
  const featureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features
    }),
    [features]
  );

  if (!mapLibre) {
    return (
      <FallbackHexGrid
        features={features}
        selectedH3Index={selectedH3Index}
        onSelect={onSelect}
      />
    );
  }

  const { MapView, Camera, ShapeSource, FillLayer, LineLayer, UserLocation } = mapLibre;

  return (
    <View
      style={{
        height: 390,
        borderRadius: 8,
        overflow: "hidden",
        borderColor: colors.border,
        borderWidth: 1,
        backgroundColor: "#0E1A24"
      }}
    >
      <MapView
        style={{ flex: 1 }}
        styleJSON={JSON.stringify(style)}
        compassEnabled
        logoEnabled={false}
        attributionEnabled
        onPress={(event: { features?: TerritoryFeature[] }) => {
          const feature = event.features?.[0];
          if (feature?.properties?.h3Index) {
            onSelect(feature);
          }
        }}
        onRegionDidChange={(event: { geometry?: { coordinates?: [number, number] } }) => {
          const coordinates = event.geometry?.coordinates;
          if (coordinates) {
            onCenterChange({ longitude: coordinates[0], latitude: coordinates[1] });
          }
        }}
      >
        <Camera
          centerCoordinate={[center.longitude, center.latitude]}
          zoomLevel={13}
          animationDuration={600}
        />
        {UserLocation ? <UserLocation visible /> : null}
        <ShapeSource id="territory-hexes" shape={featureCollection}>
          <FillLayer
            id="territory-fill"
            style={{
              fillColor: ["get", "fillColor"],
              fillOpacity: ["get", "fillOpacity"]
            }}
          />
          <LineLayer
            id="territory-outline"
            style={{
              lineColor: ["get", "strokeColor"],
              lineWidth: ["+", 1, ["*", ["get", "levelProgress"], 3]],
              lineOpacity: 0.9
            }}
          />
        </ShapeSource>
      </MapView>

      <Text
        style={{
          position: "absolute",
          left: 12,
          bottom: 10,
          color: colors.text,
          fontSize: 11,
          fontWeight: "800",
          backgroundColor: "rgba(7,16,24,0.74)",
          paddingHorizontal: 8,
          paddingVertical: 5,
          borderRadius: 8
        }}
      >
        OpenStreetMap - MapLibre - H3
      </Text>
    </View>
  );
}

function loadMapLibre(): MapLibreModule | null {
  try {
    const loaded = require("@maplibre/maplibre-react-native") as MapLibreModule | { default: MapLibreModule };
    const mapLibre = "default" in loaded ? loaded.default : loaded;
    mapLibre.setAccessToken?.(null);
    return mapLibre;
  } catch {
    return null;
  }
}
