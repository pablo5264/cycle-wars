import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GpsSamplePayload } from "../api/CycleWarsApi";

export interface StoredGpsSample {
  id: string;
  payload: GpsSamplePayload;
  queuedAt: string;
  attempts: number;
}

export interface OfflineRideQueueStore {
  load(): Promise<StoredGpsSample[]>;
  save(samples: StoredGpsSample[]): Promise<void>;
}

export class MemoryOfflineRideQueueStore implements OfflineRideQueueStore {
  private samples: StoredGpsSample[] = [];

  async load(): Promise<StoredGpsSample[]> {
    return [...this.samples];
  }

  async save(samples: StoredGpsSample[]): Promise<void> {
    this.samples = [...samples];
  }
}

export class AsyncStorageOfflineRideQueueStore implements OfflineRideQueueStore {
  constructor(private readonly key = "cycle-wars:offline-gps-samples") {}

  async load(): Promise<StoredGpsSample[]> {
    const raw = await AsyncStorage.getItem(this.key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as StoredGpsSample[];
    return Array.isArray(parsed) ? parsed : [];
  }

  async save(samples: StoredGpsSample[]): Promise<void> {
    if (samples.length === 0) {
      await AsyncStorage.removeItem(this.key);
      return;
    }

    await AsyncStorage.setItem(this.key, JSON.stringify(samples));
  }
}
