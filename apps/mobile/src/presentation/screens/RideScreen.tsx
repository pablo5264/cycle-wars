import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { BattleSummary, SessionUser, GpsSampleResult, RideActivity } from "../../domain/models/AppModels";
import type { TerritoryConquestView } from "../../domain/models/ConquestModels";
import type { MapCenter } from "../../domain/models/MapModels";
import type { GpsSamplePayload } from "../../infrastructure/api/CycleWarsApi";
import type { RideLocation } from "../../infrastructure/location/LocationTracker";
import { useAppContainer } from "../../application/state/AppContext";
import { ActionButton } from "../components/ActionButton";
import { BattlePanel } from "../components/BattlePanel";
import { Panel } from "../components/Panel";
import { ProgressBar } from "../components/ProgressBar";
import { LiveRideMapView } from "../map/LiveRideMapView";
import { appStyles } from "../theme/styles";
import { colors } from "../theme/theme";

interface RideScreenProps {
  user: SessionUser;
}

export function RideScreen({ user }: RideScreenProps) {
  const { api, location, offlineRideQueue, conquestPresenter, battlePresenter } = useAppContainer();
  const [activity, setActivity] = useState<RideActivity | null>(null);
  const [lastSample, setLastSample] = useState<GpsSampleResult | null>(null);
  const [battle, setBattle] = useState<BattleSummary | null>(null);
  const [queuedSamples, setQueuedSamples] = useState(offlineRideQueue.size());
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [liveLocation, setLiveLocation] = useState<RideLocation | null>(null);
  const [ridePath, setRidePath] = useState<RideLocation[]>([]);
  const startedAtRef = useRef<string | null>(null);
  const lastLocationRef = useRef<RideLocation | null>(null);
  const mapCenter = useMemo<MapCenter>(
    () =>
      liveLocation
        ? { latitude: liveLocation.latitude, longitude: liveLocation.longitude }
        : { latitude: -33.4489, longitude: -70.6693 },
    [liveLocation]
  );
  const distanceMeters = useMemo(() => calculateDistanceMeters(ridePath), [ridePath]);

  useEffect(() => {
    let isMounted = true;

    offlineRideQueue
      .hydrate()
      .then((size) => {
        if (isMounted) {
          setQueuedSamples(size);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMessage("No se pudo leer la cola offline guardada.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [offlineRideQueue]);

  useEffect(() => {
    if (!activity || activity.status !== "recording") {
      return undefined;
    }

    let didCancel = false;
    let stopWatching: (() => void) | null = null;

    location
      .watchRideLocation((current) => {
        if (didCancel) {
          return;
        }

        lastLocationRef.current = current;
        setLiveLocation(current);
        setRidePath((currentPath) => appendRoutePoint(currentPath, current));
      })
      .then((stop) => {
        if (didCancel) {
          stop();
        } else {
          stopWatching = stop;
        }
      })
      .catch(() => {
        if (!didCancel) {
          setMessage("No se pudo activar el seguimiento continuo del mapa.");
        }
      });

    return () => {
      didCancel = true;
      stopWatching?.();
    };
  }, [activity, location]);

  async function startRide() {
    setIsBusy(true);
    setMessage(null);
    try {
      const hasPermission = await location.requestPermission();
      if (!hasPermission) {
        setMessage("Activa permisos de ubicacion para grabar la ruta.");
        return;
      }

      const startedAt = new Date().toISOString();
      const current = await location.currentLocation();
      lastLocationRef.current = current;
      setLiveLocation(current);
      setRidePath([current]);
      startedAtRef.current = startedAt;
      setActivity(
        await api.startActivity({
          startedAt,
          source: "mobile",
          metadata: { riderId: user.id }
        })
      );
      setMessage("Ruta iniciada. Ya puedes enviar muestras GPS.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo iniciar la ruta.");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendSample() {
    if (!activity) {
      return;
    }

    setIsBusy(true);
    setMessage(null);
    let payload: GpsSamplePayload | null = null;
    try {
      const sampleStartedAt = Date.now();
      const current = await location.optimizedRideLocation(lastLocationRef.current);
      lastLocationRef.current = current;
      setLiveLocation(current);
      setRidePath((currentPath) => appendRoutePoint(currentPath, current));
      payload = {
        activityId: activity.id,
        ...current,
        deviceIntegrity: {
          isMocked: false,
          isRooted: false,
          isJailbroken: false,
          clockOffsetMs: 0
        }
      };

      if (offlineRideQueue.size() > 0) {
        const flushed = await offlineRideQueue.flush(api);
        setQueuedSamples(flushed.remaining);
        if (flushed.remaining > 0) {
          offlineRideQueue.enqueue(payload);
          setQueuedSamples(offlineRideQueue.size());
          setMessage("Sin conexion estable. Guardamos esta muestra para reenviarla.");
          return;
        }
      }

      const result = await api.ingestGpsSample(payload);
      setLastSample(result);
      setBattle(result.battle);
      setQueuedSamples(offlineRideQueue.size());
      if (api.isConfigured()) {
        await api.recordPerformanceEvent("gps_sample_roundtrip", Date.now() - sampleStartedAt, {
          antiCheat: result.antiCheat.status,
          influenceDelta: result.influenceDelta
        });
      }
      setMessage(
        result.influenceDelta > 0
          ? `Influencia enviada: ${result.influenceDelta}`
          : "Muestra registrada sin influencia."
      );
    } catch (caught) {
      if (payload && api.isRecoverableError(caught)) {
        offlineRideQueue.enqueue(payload);
        setQueuedSamples(offlineRideQueue.size());
        setMessage("Sin conexion estable. Guardamos esta muestra para reenviarla.");
      } else {
        setMessage(caught instanceof Error ? caught.message : "No se pudo enviar GPS.");
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function finishRide() {
    if (!activity) {
      return;
    }

    setIsBusy(true);
    setMessage(null);
    try {
      const updated = await api.finishActivity(activity.id, new Date().toISOString());
      setActivity(updated);
      setMessage(`Ruta cerrada: ${updated.status}`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo cerrar la ruta.");
    } finally {
      setIsBusy(false);
    }
  }

  async function refreshBattle() {
    setIsBusy(true);
    setMessage(null);
    try {
      setBattle(await api.getActiveBattle());
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo cargar la batalla.");
    } finally {
      setIsBusy(false);
    }
  }

  async function resolveBattle(battleId: string) {
    setIsBusy(true);
    setMessage(null);
    try {
      setBattle(await api.resolveBattle(battleId));
      setMessage("Batalla resuelta por el servidor.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo resolver la batalla.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      <LiveRideMapView
        center={mapCenter}
        riderLocation={liveLocation}
        route={ridePath}
        isRecording={activity?.status === "recording"}
      />

      <Panel title="Ruta en vivo">
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
            {activity ? activity.status : "Sin ruta activa"}
          </Text>
          <Text style={appStyles.body}>
            {activity?.id ?? startedAtRef.current ?? "Inicia una ruta para ver tu avance sobre el mapa real."}
          </Text>
          <View style={appStyles.row}>
            <Text style={appStyles.body}>Distancia: {formatDistance(distanceMeters)}</Text>
            <Text style={appStyles.body}>Velocidad: {Math.round(liveLocation?.speedKmh ?? 0)} km/h</Text>
          </View>
          <View style={appStyles.row}>
            <Text style={appStyles.body}>Puntos GPS: {ridePath.length}</Text>
            <Text style={appStyles.body}>Pendientes: {queuedSamples}</Text>
          </View>
        </View>
      </Panel>

      <View style={{ gap: 10 }}>
        <ActionButton
          label="Iniciar ruta"
          onPress={() => void startRide()}
          disabled={isBusy || !!activity}
        />
        <ActionButton
          label="Sincronizar avance"
          variant="secondary"
          onPress={() => void sendSample()}
          disabled={isBusy || !activity || activity.status !== "recording"}
        />
        <ActionButton
          label="Finalizar ruta"
          variant="danger"
          onPress={() => void finishRide()}
          disabled={isBusy || !activity || activity.status !== "recording"}
        />
      </View>

      {message ? (
        <Text style={{ color: message.includes("No ") ? colors.red : colors.green }}>
          {message}
        </Text>
      ) : null}

      {lastSample ? (
        <ConquestSamplePanel
          result={lastSample}
          view={conquestPresenter.fromTerritory(lastSample.territory, lastSample.h3Index)}
        />
      ) : null}

      <BattlePanel
        battle={battlePresenter.fromBattle(battle)}
        isBusy={isBusy}
        onRefresh={() => void refreshBattle()}
        onResolve={(battleId) => void resolveBattle(battleId)}
      />
    </ScrollView>
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

function calculateDistanceMeters(route: RideLocation[]): number {
  return route.reduce((total, point, index) => {
    const previousPoint = route[index - 1];
    return previousPoint ? total + calculatePointDistanceMeters(previousPoint, point) : total;
  }, 0);
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

function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(2)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}

interface ConquestSamplePanelProps {
  result: GpsSampleResult;
  view: TerritoryConquestView;
}

function ConquestSamplePanel({ result, view }: ConquestSamplePanelProps) {
  return (
    <Panel title="Ultima muestra">
      <View style={{ gap: 10 }}>
        <Text style={appStyles.body}>H3: {result.h3Index}</Text>
        <Text style={appStyles.body}>Influencia enviada: {result.influenceDelta}</Text>
        <ProgressBar
          value={view.influenceProgress}
          color={view.status === "contested" ? colors.orange : colors.green}
        />
        <Text style={appStyles.body}>Confianza: {result.antiCheat.trustScore}</Text>
        <Text style={appStyles.body}>
          Territorio: {view.clanName} - nivel {view.level} {view.levelName}
        </Text>
        <ProgressBar value={view.levelProgress} color={colors.cyan} />
        <Text style={[appStyles.body, { color: view.isShielded ? colors.cyan : colors.faint }]}>
          Escudo: {view.shieldLabel}
        </Text>
        <Text style={appStyles.body}>Batalla: {result.battle ? "activa" : "sin rival"}</Text>
      </View>
    </Panel>
  );
}
