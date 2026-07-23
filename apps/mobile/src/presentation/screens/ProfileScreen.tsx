import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import type { PlayerProfileProps } from "@cycle-wars/shared";
import type { SessionState } from "../../application/hooks/useSession";
import type { PlayerAnalytics, PlayerWeeklyTrend } from "../../domain/models/AppModels";
import { useAppContainer } from "../../application/state/AppContext";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { ProgressBar } from "../components/ProgressBar";
import { StatTile } from "../components/StatTile";
import { appStyles } from "../theme/styles";
import { colors } from "../theme/theme";

interface ProfileScreenProps {
  session: SessionState;
}

export function ProfileScreen({ session }: ProfileScreenProps) {
  const { getPlayerProfile, api, auth } = useAppContainer();
  const [profile, setProfile] = useState<PlayerProfileProps | null>(null);
  const [analytics, setAnalytics] = useState<PlayerAnalytics | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<PlayerWeeklyTrend[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlayerProfile
      .execute("local-rider")
      .then((player) => setProfile(player.snapshot()))
      .catch((caught: unknown) =>
        setError(caught instanceof Error ? caught.message : "No se pudo cargar el perfil.")
      );
  }, [getPlayerProfile]);

  useEffect(() => {
    if (!api.isConfigured()) {
      return;
    }

    Promise.all([api.getPlayerAnalytics(), api.getPlayerWeeklyTrends()])
      .then(([nextAnalytics, nextTrends]) => {
        setAnalytics(nextAnalytics);
        setWeeklyTrends(nextTrends);
      })
      .catch(() => {
        setAnalytics(null);
        setWeeklyTrends([]);
      });
  }, [api]);

  if (!profile && !error) {
    return (
      <View style={appStyles.screen}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      <View style={{ gap: 6 }}>
        <Text style={appStyles.eyebrow}>Rider</Text>
        <Text style={appStyles.title}>{profile?.displayName ?? "Perfil"}</Text>
        <Text style={appStyles.body}>
          {session.user?.email ?? "Sesion de prueba"} - Backend{" "}
          {api.isConfigured() ? "conectado" : "local"}
        </Text>
      </View>

      {error ? <Text style={{ color: colors.red }}>{error}</Text> : null}

      {profile ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <StatTile label="Nivel" value={String(profile.level)} />
            <StatTile label="Liga" value={profile.league.replace("_", " ")} />
            <StatTile label="Territorios" value={String(profile.stats.territories)} />
            <StatTile label="Conquistas" value={String(profile.stats.conquests)} />
          </View>

          <Panel title="Rendimiento">
            <View style={{ gap: 10 }}>
              <Text style={appStyles.body}>
                Km: {(profile.stats.distanceMeters / 1000).toFixed(1)}
              </Text>
              <Text style={appStyles.body}>
                Velocidad media: {profile.stats.averageSpeedKmh.toFixed(1)} km/h
              </Text>
              <Text style={appStyles.body}>Desnivel: {profile.stats.elevationGainMeters} m</Text>
              <Text style={appStyles.body}>Calorias: {profile.stats.calories}</Text>
            </View>
          </Panel>

          {analytics ? (
            <Panel title="Analytics">
              <View style={{ gap: 10 }}>
                <Text style={appStyles.body}>ELO: {analytics.elo}</Text>
                <Text style={appStyles.body}>
                  Actividades validas: {analytics.valid_activity_count} de{" "}
                  {analytics.activity_count}
                </Text>
                <Text style={appStyles.body}>
                  Territorios actuales: {analytics.territory_count}
                </Text>
                <Text style={appStyles.body}>
                  Influencia total: {analytics.influence_delta}
                </Text>
                <Text style={appStyles.body}>
                  Premios regionales: {analytics.regional_reward_count} premios /{" "}
                  {analytics.regional_reward_coins} coins
                </Text>
                <Text style={appStyles.body}>
                  Progreso de temporada: {analytics.season_progress}%
                </Text>
              </View>
            </Panel>
          ) : null}

          {weeklyTrends.length > 0 ? <WeeklyTrendsPanel trends={weeklyTrends} /> : null}
        </>
      ) : null}

      <Panel title="Cuenta">
        <View style={{ gap: 10 }}>
          <Text style={appStyles.body}>
            Auth configurado: {auth.isConfigured() ? "si" : "modo local sin variables Supabase"}
          </Text>
          <ActionButton
            label="Cerrar sesion"
            variant="secondary"
            onPress={() => void session.signOut()}
          />
        </View>
      </Panel>
    </ScrollView>
  );
}

interface WeeklyTrendsPanelProps {
  trends: PlayerWeeklyTrend[];
}

function WeeklyTrendsPanel({ trends }: WeeklyTrendsPanelProps) {
  const ordered = [...trends].reverse();
  const maxDistance = Math.max(...ordered.map((trend) => trend.distance_meters), 1);
  const maxInfluence = Math.max(...ordered.map((trend) => Math.max(0, trend.influence_delta)), 1);

  return (
    <Panel title="Tendencia semanal">
      <View style={{ gap: 12 }}>
        {ordered.slice(-6).map((trend) => (
          <View key={trend.week_start} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
                {formatWeekLabel(trend.week_start)}
              </Text>
              <Text style={appStyles.body}>{(trend.distance_meters / 1000).toFixed(1)} km</Text>
            </View>
            <ProgressBar value={trend.distance_meters / maxDistance} color={colors.green} />
            <ProgressBar
              value={Math.max(0, trend.influence_delta) / maxInfluence}
              color={colors.cyan}
            />
            <Text style={appStyles.body}>
              {trend.valid_activity_count} rutas validas - {trend.touched_territories} territorios
            </Text>
          </View>
        ))}
      </View>
    </Panel>
  );
}

function formatWeekLabel(value: string): string {
  const date = new Date(value);
  return `${date.getUTCDate().toString().padStart(2, "0")}/${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
}
