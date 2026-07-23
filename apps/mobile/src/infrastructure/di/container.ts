import { GetPlayerProfileQuery } from "@cycle-wars/shared";
import { CycleWarsApi } from "../api/CycleWarsApi";
import { ConquestPresenter } from "../../application/services/ConquestPresenter";
import { BattlePresenter } from "../../application/services/BattlePresenter";
import { AuthService } from "../auth/AuthService";
import { LocationTracker } from "../location/LocationTracker";
import { H3MapService } from "../map/H3MapService";
import { TerritoryRealtimeService } from "../map/TerritoryRealtimeService";
import { OfflineRideQueue } from "../offline/OfflineRideQueue";
import { AsyncStorageOfflineRideQueueStore } from "../offline/OfflineRideQueueStore";
import { InMemoryPlayerProfileRepository } from "../repositories/InMemoryPlayerProfileRepository";
import { edgeFunctionsUrl, supabase } from "../services/supabaseClient";

export interface AppContainer {
  getPlayerProfile: GetPlayerProfileQuery;
  auth: AuthService;
  api: CycleWarsApi;
  location: LocationTracker;
  offlineRideQueue: OfflineRideQueue;
  h3Map: H3MapService;
  territoryRealtime: TerritoryRealtimeService;
  conquestPresenter: ConquestPresenter;
  battlePresenter: BattlePresenter;
}

export function buildContainer(): AppContainer {
  const playerProfiles = new InMemoryPlayerProfileRepository();
  const auth = new AuthService(supabase);

  return {
    getPlayerProfile: new GetPlayerProfileQuery(playerProfiles),
    auth,
    api: new CycleWarsApi(edgeFunctionsUrl, () => auth.accessToken()),
    location: new LocationTracker(),
    offlineRideQueue: new OfflineRideQueue(100, new AsyncStorageOfflineRideQueueStore()),
    h3Map: new H3MapService(),
    territoryRealtime: new TerritoryRealtimeService(supabase),
    conquestPresenter: new ConquestPresenter(),
    battlePresenter: new BattlePresenter()
  };
}
