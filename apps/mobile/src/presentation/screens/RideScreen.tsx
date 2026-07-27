import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import type { SessionUser } from "../../domain/models/AppModels";
import type { MapCenter } from "../../domain/models/MapModels";
import type { RideLocation } from "../../infrastructure/location/LocationTracker";
import { useAppContainer } from "../../application/state/AppContext";
import { LiveRideMapView } from "../map/LiveRideMapView";

interface RideScreenProps {
  user: SessionUser;
}

export function RideScreen({ user: _user }: RideScreenProps) {
  const { location } = useAppContainer();
  const [liveLocation, setLiveLocation] = useState<RideLocation | null>(null);
  const [ridePath, setRidePath] = useState<RideLocation[]>([]);
  const lastLocationRef = useRef<RideLocation | null>(null);
  const mapCenter = useMemo<MapCenter>(
    () =>
      liveLocation
        ? { latitude: liveLocation.latitude, longitude: liveLocation.longitude }
        : { latitude: -33.4489, longitude: -70.6693 },
    [liveLocation]
  );

  const centerMapOnGps = useCallback(async () => {
    const hasPermission = await location.requestPermission();
    if (!hasPermission) {
      return;
    }

    const current = await location.currentLocation();
    lastLocationRef.current = current;
    setLiveLocation(current);
    setRidePath((currentPath) => (currentPath.length > 0 ? currentPath : [current]));
  }, [location]);

  useEffect(() => {
    void centerMapOnGps();
  }, [centerMapOnGps]);

  useEffect(() => {
    let didCancel = false;
    let stopWatching: (() => void) | null = null;

    async function watchGps() {
      const hasPermission = await location.requestPermission();
      if (!hasPermission) {
        return;
      }

      stopWatching = await location.watchRideLocation((current) => {
        if (didCancel) {
          return;
        }

        lastLocationRef.current = current;
        setLiveLocation(current);
        setRidePath((currentPath) => appendRoutePoint(currentPath, current));
      });
    }

    watchGps().catch(() => undefined);

    return () => {
      didCancel = true;
      stopWatching?.();
    };
  }, [location]);

  return (
    <View style={{ flex: 1 }}>
      <LiveRideMapView
        center={mapCenter}
        route={ridePath}
        onCenterPress={() => void centerMapOnGps()}
      />
    </View>
  );
}

function appendRoutePoint(route: RideLocation[], nextPoint: RideLocation): RideLocation[] {
  const previousPoint = route[route.length - 1];
  if (!previousPoint) {
    return [nextPoint];
  }

  if (calculatePointDistanceMeters(previousPoint, nextPoint) < 3) {
    return route;
  }

  return [...route.slice(-119), nextPoint];
}

function calculatePointDistanceMeters(from: RideLocation, to: RideLocation): number {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}