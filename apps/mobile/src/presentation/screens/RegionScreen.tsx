import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { RegionControlItem, RegionRewardItem } from "../../domain/models/AppModels";
import { useAppContainer } from "../../application/state/AppContext";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { ProgressBar } from "../components/ProgressBar";
import { appStyles } from "../theme/styles";
import { colors } from "../theme/theme";

export function RegionScreen() {
  const { api } = useAppContainer();
  const [regions, setRegions] = useState<RegionControlItem[]>([]);
  const [rewards, setRewards] = useState<RegionRewardItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function loadRegions() {
    setIsBusy(true);
    setMessage(null);
    try {
      const [nextRegions, nextRewards] = await Promise.all([
        api.getRegionControl(),
        api.getPlayerRegionRewards()
      ]);
      setRegions(nextRegions);
      setRewards(nextRewards);
      setMessage(
        nextRegions.length > 0
          ? "Control regional actualizado."
          : "Aun no hay regiones con territorios asociados."
      );
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo cargar regiones.");
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    void loadRegions();
  }, []);

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      <View style={{ gap: 6 }}>
        <Text style={appStyles.eyebrow}>Regiones</Text>
        <Text style={appStyles.title}>Control regional</Text>
        <Text style={appStyles.body}>
          Agrupa territorios H3 por zonas y muestra que clan o rider domina cada region.
        </Text>
      </View>

      <ActionButton
        label="Actualizar regiones"
        onPress={() => void loadRegions()}
        disabled={isBusy}
      />

      {message ? (
        <Text style={{ color: message.includes("No ") ? colors.red : colors.green }}>
          {message}
        </Text>
      ) : null}

      <Panel title="Mis premios regionales">
        <View style={{ gap: 10 }}>
          {rewards.length === 0 ? (
            <Text style={appStyles.body}>Aun no tienes premios regionales liquidados.</Text>
          ) : null}
          {rewards.slice(0, 3).map((reward) => (
            <View key={reward.id} style={{ gap: 4 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
                {reward.amount} {reward.currency}
              </Text>
              <Text style={appStyles.body}>
                {reward.region_name} - {reward.control_percent}% en {reward.season_name}
              </Text>
            </View>
          ))}
        </View>
      </Panel>

      {regions.map((region) => (
        <Panel key={region.region_id} title={region.name}>
          <View style={{ gap: 10 }}>
            <Text style={appStyles.body}>
              {region.kind} {region.country_code ? `- ${region.country_code}` : ""}
            </Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
              {region.controller_clan_name ??
                region.controller_player_name ??
                "Sin controlador"}
            </Text>
            <ProgressBar
              value={Math.min(1, Math.max(0, region.control_percent / 100))}
              color={region.controller_clan_color ?? colors.green}
            />
            <Text style={appStyles.body}>
              {region.controlled_hexes} de {region.total_hexes} territorios -{" "}
              {region.control_percent}%
            </Text>
          </View>
        </Panel>
      ))}
    </ScrollView>
  );
}
