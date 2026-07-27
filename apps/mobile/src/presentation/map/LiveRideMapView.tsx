import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View } from "react-native";
import type { MapCenter } from "../../domain/models/MapModels";
import type { RideLocation } from "../../infrastructure/location/LocationTracker";
import { colors } from "../theme/theme";

interface LiveRideMapViewProps {
  center: MapCenter;
  route: RideLocation[];
  onCenterPress: () => void;
}

interface MapLibreModule {
  MapView: ComponentType<Record<string, unknown>>;
  Camera: ComponentType<Record<string, unknown>>;
  ShapeSource: ComponentType<Record<string, unknown>>;
  LineLayer: ComponentType<Record<string, unknown>>;
  RasterSource: ComponentType<Record<string, unknown>>;
  RasterLayer: ComponentType<Record<string, unknown>>;
  UserLocation?: ComponentType<Record<string, unknown>>;
  setAccessToken?: (token: string | null) => void;
}

export function LiveRideMapView({ center, route, onCenterPress }: LiveRideMapViewProps) {
  const [mapLibre] = useState<MapLibreModule | null>(() => loadMapLibre());
  const tileUrl =
    process.env.EXPO_PUBLIC_MAP_TILE_URL ??
    "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";
  const routeShape = useMemo(
    () => ({
      type: "FeatureCollection",
      features:
        route.length > 1
          ? [
              {
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: route.map((point) => [point.longitude, point.latitude])
                },
                properties: {}
              }
            ]
          : []
    }),
    [route]
  );

  if (!mapLibre) {
    return (
      <View style={styles.mapShell}>
        <FallbackLiveMap />
        <CenterMapButton onPress={onCenterPress} />
      </View>
    );
  }

  const { MapView, Camera, ShapeSource, LineLayer, RasterSource, RasterLayer, UserLocation } = mapLibre;

  return (
    <View style={styles.mapShell}>
      <MapView
        style={{ flex: 1 }}
        mapStyle={{ version: 8, sources: {}, layers: [] }}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
        rotateEnabled
        pitchEnabled
      >
        <Camera
          centerCoordinate={[center.longitude, center.latitude]}
          zoomLevel={17}
          pitch={0}
          animationDuration={650}
        />
        <RasterSource
          id="live-raster-map"
          tileUrlTemplates={[tileUrl]}
          tileSize={256}
          minZoomLevel={0}
          maxZoomLevel={20}
          attribution="OpenStreetMap contributors"
        >
          <RasterLayer id="live-raster-map-layer" sourceID="live-raster-map" />
        </RasterSource>
        {UserLocation ? <UserLocation visible showsUserHeadingIndicator /> : null}
        <ShapeSource id="live-ride-route" shape={routeShape}>
          <LineLayer
            id="live-ride-route-line"
            style={{
              lineColor: colors.green,
              lineOpacity: 0.78,
              lineWidth: 5
            }}
          />
        </ShapeSource>
      </MapView>
      <CenterMapButton onPress={onCenterPress} />
    </View>
  );
}

function CenterMapButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Centrar mapa en mi ubicacion"
      onPress={onPress}
      style={styles.centerButton}
    >
      <Ionicons name="locate" color="#1A73E8" size={25} />
    </TouchableOpacity>
  );
}

function FallbackLiveMap() {
  return (
    <View style={styles.fallbackMap}>
      {Array.from({ length: 10 }).map((_, index) => (
        <View key={`h-${index}`} style={[styles.gridLineHorizontal, { top: `${index * 11}%` }]} />
      ))}
      {Array.from({ length: 8 }).map((_, index) => (
        <View key={`v-${index}`} style={[styles.gridLineVertical, { left: `${index * 14}%` }]} />
      ))}
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

const styles = {
  mapShell: {
    flex: 1,
    backgroundColor: "#E7EEF2",
    overflow: "hidden" as const
  },
  centerButton: {
    position: "absolute" as const,
    right: 18,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  fallbackMap: {
    flex: 1,
    backgroundColor: "#E7EEF2"
  },
  gridLineHorizontal: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(96,125,139,0.16)"
  },
  gridLineVertical: {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(96,125,139,0.16)"
  }
};
