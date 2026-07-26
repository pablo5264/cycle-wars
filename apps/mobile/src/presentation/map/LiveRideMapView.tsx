import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Text, View } from "react-native";
import type { MapCenter } from "../../domain/models/MapModels";
import { openStreetMapRasterStyle } from "../../infrastructure/map/mapStyle";
import type { RideLocation } from "../../infrastructure/location/LocationTracker";
import { colors } from "../theme/theme";

interface LiveRideMapViewProps {
  center: MapCenter;
  riderLocation: RideLocation | null;
  route: RideLocation[];
  isRecording: boolean;
}

interface MapLibreModule {
  MapView: ComponentType<Record<string, unknown>>;
  Camera: ComponentType<Record<string, unknown>>;
  ShapeSource: ComponentType<Record<string, unknown>>;
  LineLayer: ComponentType<Record<string, unknown>>;
  UserLocation?: ComponentType<Record<string, unknown>>;
  setAccessToken?: (token: string | null) => void;
}

export function LiveRideMapView({
  center,
  riderLocation,
  route,
  isRecording
}: LiveRideMapViewProps) {
  const [mapLibre] = useState<MapLibreModule | null>(() => loadMapLibre());
  const tileUrl =
    process.env.EXPO_PUBLIC_MAP_TILE_URL ??
    "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";
  const style = useMemo(() => openStreetMapRasterStyle(tileUrl), [tileUrl]);
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
  const statusLabel = isRecording ? "En movimiento" : "Listo para iniciar";
  const speedLabel = riderLocation ? `${Math.round(riderLocation.speedKmh)} km/h` : "-- km/h";
  const accuracyLabel = riderLocation ? `${Math.round(riderLocation.accuracyMeters)} m GPS` : "GPS pendiente";

  if (!mapLibre) {
    return (
      <View style={styles.mapShell}>
        <FallbackLiveMap route={route} />
        <LiveRiderMarker statusLabel={statusLabel} speedLabel={speedLabel} />
        <MapStatusPill accuracyLabel={accuracyLabel} />
      </View>
    );
  }

  const { MapView, Camera, ShapeSource, LineLayer, UserLocation } = mapLibre;

  return (
    <View style={styles.mapShell}>
      <MapView
        style={{ flex: 1 }}
        styleJSON={JSON.stringify(style)}
        logoEnabled={false}
        attributionEnabled
        compassEnabled
        rotateEnabled
        pitchEnabled
      >
        <Camera
          centerCoordinate={[center.longitude, center.latitude]}
          zoomLevel={17}
          pitch={42}
          animationDuration={900}
        />
        {UserLocation ? <UserLocation visible showsUserHeadingIndicator /> : null}
        <ShapeSource id="live-ride-route" shape={routeShape}>
          <LineLayer
            id="live-ride-route-line"
            style={{
              lineColor: colors.green,
              lineOpacity: 0.95,
              lineWidth: 6
            }}
          />
          <LineLayer
            id="live-ride-route-glow"
            style={{
              lineColor: colors.cyan,
              lineOpacity: 0.25,
              lineWidth: 12
            }}
          />
        </ShapeSource>
      </MapView>
      <LiveRiderMarker statusLabel={statusLabel} speedLabel={speedLabel} />
      <MapStatusPill accuracyLabel={accuracyLabel} />
    </View>
  );
}

function LiveRiderMarker({ statusLabel, speedLabel }: { statusLabel: string; speedLabel: string }) {
  return (
    <View style={styles.riderAnchor} pointerEvents="none">
      <View style={styles.riderMarker}>
        <View style={styles.riderHead} />
        <View style={styles.riderBody} />
        <View style={styles.bikeFrame}>
          <View style={styles.bikeWheel} />
          <View style={styles.bikeWheel} />
        </View>
      </View>
      <View style={styles.riderCard}>
        <Text style={styles.riderStatus}>{statusLabel}</Text>
        <Text style={styles.riderSpeed}>{speedLabel}</Text>
      </View>
    </View>
  );
}

function MapStatusPill({ accuracyLabel }: { accuracyLabel: string }) {
  return (
    <View style={styles.statusPill} pointerEvents="none">
      <View style={styles.statusDot} />
      <Text style={styles.statusText}>Mapa real CARTO - {accuracyLabel}</Text>
    </View>
  );
}

function FallbackLiveMap({ route }: { route: RideLocation[] }) {
  return (
    <View style={styles.fallbackMap}>
      {Array.from({ length: 9 }).map((_, index) => (
        <View key={`h-${index}`} style={[styles.gridLineHorizontal, { top: `${index * 12.5}%` }]} />
      ))}
      {Array.from({ length: 7 }).map((_, index) => (
        <View key={`v-${index}`} style={[styles.gridLineVertical, { left: `${index * 16.6}%` }]} />
      ))}
      <View style={styles.fallbackRoutePrimary} />
      <View style={styles.fallbackRouteSecondary} />
      <Text style={styles.fallbackText}>Vista local de ruta - {route.length} puntos GPS</Text>
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
    height: 500,
    marginHorizontal: -18,
    marginTop: -58,
    backgroundColor: "#0D1A22",
    overflow: "hidden" as const
  },
  riderAnchor: {
    position: "absolute" as const,
    left: "50%" as const,
    top: "48%" as const,
    alignItems: "center" as const,
    transform: [{ translateX: -52 }, { translateY: -50 }]
  },
  riderMarker: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "rgba(57,229,140,0.16)",
    borderColor: "rgba(57,229,140,0.85)",
    borderWidth: 2,
    alignItems: "center" as const,
    justifyContent: "center" as const
  },
  riderHead: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.text,
    marginBottom: 2
  },
  riderBody: {
    width: 9,
    height: 18,
    borderRadius: 6,
    backgroundColor: colors.green,
    marginBottom: -1
  },
  bikeFrame: {
    width: 43,
    height: 16,
    borderTopColor: colors.cyan,
    borderTopWidth: 3,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-end" as const
  },
  bikeWheel: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderColor: colors.text,
    borderWidth: 3,
    backgroundColor: "rgba(7,16,24,0.45)"
  },
  riderCard: {
    marginTop: 8,
    minWidth: 104,
    borderRadius: 8,
    backgroundColor: "rgba(7,16,24,0.82)",
    borderColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "center" as const
  },
  riderStatus: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "800" as const
  },
  riderSpeed: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900" as const
  },
  statusPill: {
    position: "absolute" as const,
    left: 18,
    right: 18,
    top: 54,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: "rgba(7,16,24,0.78)",
    borderColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.green
  },
  statusText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800" as const
  },
  fallbackMap: {
    flex: 1,
    backgroundColor: "#0B1D26"
  },
  gridLineHorizontal: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  gridLineVertical: {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  fallbackRoutePrimary: {
    position: "absolute" as const,
    left: "18%" as const,
    top: "62%" as const,
    width: "66%" as const,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.green,
    transform: [{ rotate: "-18deg" }]
  },
  fallbackRouteSecondary: {
    position: "absolute" as const,
    left: "46%" as const,
    top: "42%" as const,
    width: "38%" as const,
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.cyan,
    transform: [{ rotate: "38deg" }]
  },
  fallbackText: {
    position: "absolute" as const,
    left: 18,
    bottom: 18,
    color: colors.text,
    fontSize: 12,
    fontWeight: "800" as const,
    backgroundColor: "rgba(7,16,24,0.72)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8
  }
};
