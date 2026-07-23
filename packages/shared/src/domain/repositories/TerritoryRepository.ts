import type { H3Index } from "../value-objects/H3Index";
import type { Territory } from "../entities/Territory";

export interface TerritoryRepository {
  findById(id: H3Index): Promise<Territory | null>;
  save(territory: Territory): Promise<void>;
}
