import type { CycleWarsApi, GpsSamplePayload } from "../api/CycleWarsApi";
import {
  MemoryOfflineRideQueueStore,
  type OfflineRideQueueStore,
  type StoredGpsSample
} from "./OfflineRideQueueStore";

export interface QueueFlushResult {
  flushed: number;
  remaining: number;
}

export class OfflineRideQueue {
  private samples: StoredGpsSample[] = [];
  private isHydrated = false;

  constructor(
    private readonly maxSamples = 50,
    private readonly store: OfflineRideQueueStore = new MemoryOfflineRideQueueStore()
  ) {}

  size(): number {
    return this.samples.length;
  }

  async hydrate(): Promise<number> {
    if (this.isHydrated) {
      return this.samples.length;
    }

    this.samples = (await this.store.load()).slice(-this.maxSamples);
    this.isHydrated = true;
    return this.samples.length;
  }

  enqueue(payload: GpsSamplePayload): number {
    this.samples.push({
      id: `${payload.activityId}:${payload.recordedAt}`,
      payload,
      queuedAt: new Date().toISOString(),
      attempts: 0
    });

    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    void this.persist();
    return this.samples.length;
  }

  async flush(api: CycleWarsApi): Promise<QueueFlushResult> {
    await this.hydrate();
    let flushed = 0;

    while (this.samples.length > 0) {
      const next = this.samples.at(0);
      if (!next) {
        break;
      }

      next.attempts += 1;

      try {
        await api.ingestGpsSample(next.payload);
        this.samples.shift();
        await this.persist();
        flushed += 1;
      } catch (caught) {
        if (!api.isRecoverableError(caught)) {
          this.samples.shift();
          await this.persist();
          continue;
        }

        return { flushed, remaining: this.samples.length };
      }
    }

    return { flushed, remaining: 0 };
  }

  private async persist(): Promise<void> {
    await this.store.save(this.samples);
  }
}
