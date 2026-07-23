import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import type { TerritoryMapItem } from "../../domain/models/AppModels";
import type { MapCenter, TerritoryFeature } from "../../domain/models/MapModels";
import { useAppContainer } from "../../application/state/AppContext";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { ProgressBar } from "../components/ProgressBar";
import { TerritoryMapView } from "../map/TerritoryMapView";
import { appStyles } from "../theme/styles";
import { colors } from "../theme/theme";

const defaultCenter: MapCenter = {
  latitude: -33.4489,
  longitude: -70.6693
};

export function MapScreen() {
  const { api, h3Map, location, territoryRealtime, conquestPresenter } = useAppContainer();
  const [territories, setTerritories] = useState<TerritoryMapItem[]>([]);
  const [center, setCenter] = useState<MapCenter>(defaultCenter);
  const [selectedFeature, setSelectedFeature] = useState<TerritoryFeature | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const h3Indexes = useMemo(
    () => h3Map.viewportCells({ center, resolution: 9, ringSize: 4 }),
    [center, h3Map]
  );
  const featureCollection = useMemo(
    () => h3Map.toFeatureCollection(h3Indexes, territories),
    [h3Indexes, h3Map, territories]
  );
  const selectedTerritory = useMemo(
    () =>
      selectedFeature
        ? territories.find((territory) => territory.h3_index === selectedFeature.properties.h3Index) ?? null
        : null,
    [selectedFeature, territories]
  );
  const selectedConquest = selectedFeature
    ? conquestPresenter.fromTerritory(selectedTerritory, selectedFeature.properties.h3Index)
    : null;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!api.isConfigured()) {
        setTerritories([]);
        return;
      }

      setTerritories(await api.getTerritoryMap(h3Indexes));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el mapa.");
    } finally {
      setIsLoading(false);
    }
  }, [api, h3Indexes]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return territoryRealtime.subscribe((changedTerritory) => {
      setTerritories((current) => {
        const existingIndex = current.findIndex(
          (territory) => territory.h3_index === changedTerritory.h3_index
        );
        if (existingIndex < 0) {
          return [changedTerritory, ...current];
        }

        const next = [...current];
        const existingTerritory = next[existingIndex];
        if (!existingTerritory) {
          return current;
        }

        next[existingIndex] = { ...existingTerritory, ...changedTerritory };
        return next;
      });
    });
  }, [territoryRealtime]);

  async function centerOnMe() {
    setError(null);
    try {
      const hasPermission = await location.requestPermission();
      if (!hasPermission) {
        setError("Activa permisos de ubicacion para centrar el mapa.");
        return;
      }

      const current = await location.currentLocation();
      setCenter({ latitude: current.latitude, longitude: current.longitude });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo obtener ubicacion.");
    }
  }

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      <View style={{ gap: 6 }}>
        <Text style={appStyles.eyebrow}>Mapa global</Text>
        <Text style={appStyles.title}>Territorios H3</Text>
        <Text style={appStyles.body}>
          Mapa MapLibre con OpenStreetMap, overlay H3 y carga por celdas visibles.
        </Text>
        <Text style={[appStyles.body, { fontSize: 13, color: colors.faint }]}>
          Realtime {territoryRealtime.isConfigured() ? "activo" : "en espera de Supabase"}.
        </Text>
      </View>

      <Panel>
        <TerritoryMapView
          center={center}
          features={featureCollection.features}
          selectedH3Index={selectedFeature?.properties.h3Index ?? null}
          onCenterChange={setCenter}
          onSelect={setSelectedFeature}
        />
      </Panel>

      {error ? <Text style={{ color: colors.red }}>{error}</Text> : null}
      {isLoading ? <ActivityIndicator color={colors.green} /> : null}

      <View style={{ gap: 10 }}>
        <ActionButton label="Centrar en mi" onPress={() => void centerOnMe()} />
        <ActionButton label="Actualizar territorios" variant="secondary" onPress={() => void load()} />
      </View>

      <Panel title="Hexagono seleccionado">
        {selectedConquest ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontWeight: "800" }}>
              {selectedConquest.h3Index}
            </Text>
            <Text style={appStyles.body}>
              {selectedConquest.clanName} - {selectedConquest.status}
            </Text>
            <View style={{ gap: 5 }}>
              <Text style={appStyles.body}>Influencia: {selectedConquest.influencePoints}</Text>
              <ProgressBar
                value={selectedConquest.influenceProgress}
                color={selectedConquest.status === "contested" ? colors.orange : colors.green}
              />
            </View>
            <View style={{ gap: 5 }}>
              <Text style={appStyles.body}>
                Nivel {selectedConquest.level}: {selectedConquest.levelName}
              </Text>
              <ProgressBar value={selectedConquest.levelProgress} color={colors.cyan} />
            </View>
            <Text style={[appStyles.body, { color: selectedConquest.isShielded ? colors.cyan : colors.faint }]}>
              Escudo: {selectedConquest.shieldLabel}
            </Text>
          </View>
        ) : (
          <Text style={appStyles.body}>Toca un hexagono para inspeccionarlo.</Text>
        )}
      </Panel>

      <View style={{ gap: 10 }}>
        {territories.slice(0, 8).map((territory) => (
          <Panel key={territory.h3_index}>
            <View style={appStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: "800" }}>{territory.h3_index}</Text>
                <Text style={appStyles.body}>
                  {territory.clan_name ?? territory.owner_name ?? "Neutral"} - {territory.status}
                </Text>
              </View>
              <Text style={{ color: colors.green, fontWeight: "800" }}>
                {territory.influence_points}
              </Text>
            </View>
          </Panel>
        ))}
      </View>
    </ScrollView>
  );
}
