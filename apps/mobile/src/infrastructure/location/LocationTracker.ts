import * as Location from "expo-location";

export interface RideLocation {
  latitude: number;
  longitude: number;
  altitudeMeters: number | null;
  accuracyMeters: number;
  speedKmh: number;
  headingDegrees: number | null;
  recordedAt: string;
}

export class LocationTracker {
  async requestPermission(): Promise<boolean> {
    const permission = await Location.requestForegroundPermissionsAsync();
    return permission.status === Location.PermissionStatus.GRANTED;
  }

  async currentLocation(): Promise<RideLocation> {
    return this.readLocation(Location.Accuracy.BestForNavigation);
  }

  async optimizedRideLocation(previous: RideLocation | null): Promise<RideLocation> {
    const accuracy =
      previous && previous.speedKmh < 8
        ? Location.Accuracy.Balanced
        : Location.Accuracy.BestForNavigation;

    return this.readLocation(accuracy);
  }

  async watchRideLocation(onLocation: (location: RideLocation) => void): Promise<() => void> {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 2500
      },
      (location) => {
        onLocation(this.toRideLocation(location));
      }
    );

    return () => subscription.remove();
  }

  private async readLocation(accuracy: Location.Accuracy): Promise<RideLocation> {
    const location = await Location.getCurrentPositionAsync({
      accuracy
    });

    return this.toRideLocation(location);
  }

  private toRideLocation(location: Location.LocationObject): RideLocation {
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitudeMeters: location.coords.altitude,
      accuracyMeters: location.coords.accuracy ?? 999,
      speedKmh: Math.max(0, (location.coords.speed ?? 0) * 3.6),
      headingDegrees: location.coords.heading,
      recordedAt: new Date(location.timestamp).toISOString()
    };
  }
}
