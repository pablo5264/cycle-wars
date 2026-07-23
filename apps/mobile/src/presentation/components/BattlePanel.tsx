import { Text, View } from "react-native";
import type { BattleView } from "../../application/services/BattlePresenter";
import { ActionButton } from "./ActionButton";
import { Panel } from "./Panel";
import { ProgressBar } from "./ProgressBar";
import { appStyles } from "../theme/styles";
import { colors } from "../theme/theme";

interface BattlePanelProps {
  battle: BattleView | null;
  isBusy: boolean;
  onRefresh: () => void;
  onResolve: (battleId: string) => void;
}

export function BattlePanel({ battle, isBusy, onRefresh, onResolve }: BattlePanelProps) {
  if (!battle) {
    return (
      <Panel title="Batalla">
        <View style={{ gap: 10 }}>
          <Text style={appStyles.body}>Sin combate activo en este momento.</Text>
          <ActionButton label="Buscar batalla" variant="secondary" onPress={onRefresh} disabled={isBusy} />
        </View>
      </Panel>
    );
  }

  return (
    <Panel title="Batalla activa">
      <View style={{ gap: 12 }}>
        <View style={appStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: "800" }}>{battle.territoryH3Index}</Text>
            <Text style={appStyles.body}>
              {battle.participantCount} riders - {battle.status}
            </Text>
          </View>
          <Text style={{ color: colors.orange, fontWeight: "800" }}>
            {battle.leader ? Math.round(battle.leader.score) : 0}
          </Text>
        </View>

        <View style={{ gap: 5 }}>
          <Text style={appStyles.body}>Intensidad</Text>
          <ProgressBar value={battle.intensity} color={colors.orange} />
        </View>

        {battle.participants.slice(0, 4).map((participant, index) => (
          <View key={participant.playerId} style={appStyles.row}>
            <Text style={{ color: index === 0 ? colors.green : colors.text, fontWeight: "800" }}>
              #{index + 1}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={appStyles.body}>{participant.playerId.slice(0, 8)}</Text>
              <Text style={[appStyles.body, { fontSize: 12 }]}>
                L{participant.level} - {participant.speedKmh.toFixed(1)} km/h - {participant.timeInTerritorySeconds}s
              </Text>
            </View>
            <Text style={{ color: colors.text, fontWeight: "800" }}>
              {Math.round(participant.score)}
            </Text>
          </View>
        ))}

        <View style={{ gap: 10 }}>
          <ActionButton label="Actualizar batalla" variant="secondary" onPress={onRefresh} disabled={isBusy} />
          <ActionButton
            label="Resolver batalla"
            variant="danger"
            onPress={() => onResolve(battle.id)}
            disabled={isBusy || battle.status === "resolved"}
          />
        </View>
      </View>
    </Panel>
  );
}
