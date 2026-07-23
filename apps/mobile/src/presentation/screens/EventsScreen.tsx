import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type {
  EventLeaderboardEntry,
  EventScheduleItem,
  EventReminderItem,
  PlayerEvent,
  PlayerEventRewardClaim,
  PlayerEventObjectiveProgress
} from "../../domain/models/AppModels";
import { useAppContainer } from "../../application/state/AppContext";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { ProgressBar } from "../components/ProgressBar";
import { appStyles } from "../theme/styles";
import { colors } from "../theme/theme";

export function EventsScreen() {
  const { api } = useAppContainer();
  const [events, setEvents] = useState<PlayerEvent[]>([]);
  const [leaders, setLeaders] = useState<EventLeaderboardEntry[]>([]);
  const [rewardHistory, setRewardHistory] = useState<PlayerEventRewardClaim[]>([]);
  const [schedule, setSchedule] = useState<EventScheduleItem[]>([]);
  const [reminders, setReminders] = useState<EventReminderItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [claimingEventId, setClaimingEventId] = useState<string | null>(null);
  const [remindingEventId, setRemindingEventId] = useState<string | null>(null);

  useEffect(() => {
    void loadEvents();
  }, [api]);

  async function loadEvents() {
    if (!api.isConfigured()) {
      setMessage("Backend local: misiones no disponibles.");
      return;
    }

    try {
      const nextEvents = await api.getPlayerEvents();
      setEvents(nextEvents);
      const featuredEventId = nextEvents[0]?.id;
      const [nextLeaders, nextRewardHistory, nextSchedule, nextReminders] = await Promise.all([
        featuredEventId ? api.getEventLeaderboard(featuredEventId, 5) : Promise.resolve([]),
        api.getPlayerEventRewardHistory(5),
        api.getEventSchedule(5),
        api.getEventReminders(10)
      ]);
      setLeaders(nextLeaders);
      setRewardHistory(nextRewardHistory);
      setSchedule(nextSchedule);
      setReminders(nextReminders);
      setMessage("Misiones actualizadas.");
    } catch (caught) {
      setEvents([]);
      setLeaders([]);
      setRewardHistory([]);
      setSchedule([]);
      setReminders([]);
      setMessage(caught instanceof Error ? caught.message : "No se pudieron cargar misiones.");
    }
  }

  async function claimReward(event: PlayerEvent) {
    setClaimingEventId(event.id);
    setMessage(null);

    try {
      await api.claimEventReward(event.id);
      setMessage(`Recompensa reclamada: ${formatRewards(event.rewards)}.`);
      await loadEvents();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo reclamar la recompensa.");
    } finally {
      setClaimingEventId(null);
    }
  }

  async function setReminder(event: EventScheduleItem) {
    setRemindingEventId(event.id);
    setMessage(null);

    try {
      await api.setEventReminder(event.id);
      setMessage(`Recordatorio activado para ${event.name}.`);
      await loadEvents();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "No se pudo activar el recordatorio.");
    } finally {
      setRemindingEventId(null);
    }
  }

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      <View style={{ gap: 6 }}>
        <Text style={appStyles.eyebrow}>Eventos</Text>
        <Text style={appStyles.title}>Misiones activas</Text>
        <Text style={appStyles.body}>
          Objetivos diarios, semanales y globales para convertir cada ruta en progreso.
        </Text>
      </View>

      {message ? <Text style={{ color: colors.green }}>{message}</Text> : null}

      <EventLeaderboard leaders={leaders} />
      <EventRewardHistory claims={rewardHistory} />
      <EventSchedule
        events={schedule}
        reminders={reminders}
        remindingEventId={remindingEventId}
        onSetReminder={(event) => void setReminder(event)}
      />

      {events.map((event) => (
        <EventMissionCard
          key={event.id}
          event={event}
          isClaiming={claimingEventId === event.id}
          isClaimDisabled={claimingEventId !== null}
          onClaim={() => void claimReward(event)}
        />
      ))}

      {events.length === 0 ? (
        <Panel title="Sin misiones">
          <Text style={appStyles.body}>No hay eventos activos en este momento.</Text>
        </Panel>
      ) : null}
    </ScrollView>
  );
}

function EventLeaderboard({ leaders }: { leaders: EventLeaderboardEntry[] }) {
  return (
    <Panel title="Ranking de mision">
      <View style={{ gap: 10 }}>
        {leaders.length > 0 ? (
          leaders.map((leader) => (
            <View key={`${leader.event_id}-${leader.player_id}`} style={appStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
                  #{leader.rank} {leader.display_name}
                </Text>
                <Text style={appStyles.body}>{leader.event_name}</Text>
              </View>
              <Text style={[appStyles.body, { color: colors.orange, fontWeight: "800" }]}>
                {Math.round(leader.progress_percent)}%
              </Text>
            </View>
          ))
        ) : (
          <Text style={appStyles.body}>El ranking aparecera cuando haya progreso de jugadores.</Text>
        )}
      </View>
    </Panel>
  );
}

function EventRewardHistory({ claims }: { claims: PlayerEventRewardClaim[] }) {
  return (
    <Panel title="Historial de recompensas">
      <View style={{ gap: 10 }}>
        {claims.length > 0 ? (
          claims.map((claim) => (
            <View key={claim.id} style={appStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
                  {claim.event_name}
                </Text>
                <Text style={appStyles.body}>
                  {formatScope(claim.scope)} - {formatDate(claim.claimed_at)}
                </Text>
              </View>
              <Text style={[appStyles.body, { color: colors.green, fontWeight: "800" }]}>
                {formatRewards(claim.rewards)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={appStyles.body}>Las recompensas reclamadas apareceran aqui.</Text>
        )}
      </View>
    </Panel>
  );
}

function EventSchedule({
  events,
  reminders,
  remindingEventId,
  onSetReminder
}: {
  events: EventScheduleItem[];
  reminders: EventReminderItem[];
  remindingEventId: string | null;
  onSetReminder: (event: EventScheduleItem) => void;
}) {
  return (
    <Panel title="Proximas misiones">
      <View style={{ gap: 10 }}>
        {events.length > 0 ? (
          events.map((event) => {
            const hasReminder = reminders.some(
              (reminder) => reminder.event_id === event.id && reminder.status === "active"
            );

            return (
              <View key={event.id} style={{ gap: 8 }}>
                <View style={appStyles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
                      {event.name}
                    </Text>
                    <Text style={appStyles.body}>
                      {formatScope(event.scope)} - inicia {formatDate(event.starts_at)}
                    </Text>
                  </View>
                  <Text style={[appStyles.body, { color: colors.orange, fontWeight: "800" }]}>
                    {formatRewards(event.rewards)}
                  </Text>
                </View>
                <ActionButton
                  label={
                    hasReminder
                      ? "Recordatorio listo"
                      : remindingEventId === event.id
                        ? "Activando..."
                        : "Recordarme"
                  }
                  disabled={remindingEventId !== null || hasReminder}
                  onPress={() => onSetReminder(event)}
                />
              </View>
            );
          })
        ) : (
          <Text style={appStyles.body}>Las proximas misiones apareceran cuando se publiquen.</Text>
        )}
      </View>
    </Panel>
  );
}

function EventMissionCard({
  event,
  isClaiming,
  isClaimDisabled,
  onClaim
}: {
  event: PlayerEvent;
  isClaiming: boolean;
  isClaimDisabled: boolean;
  onClaim: () => void;
}) {
  const isComplete = event.completed_at !== null;
  const isClaimed = event.claimed_at !== null;

  return (
    <Panel title={event.name}>
      <View style={{ gap: 10 }}>
        <View style={appStyles.row}>
          <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
            {formatScope(event.scope)}
          </Text>
          <Text style={appStyles.body}>{formatEventStatus(event)}</Text>
        </View>
        {event.description ? <Text style={appStyles.body}>{event.description}</Text> : null}
        {(event.progress.objectives ?? []).map((objective) => (
          <ObjectiveProgress key={objective.kind} objective={objective} />
        ))}
        <Text style={appStyles.body}>Recompensa: {formatRewards(event.rewards)}</Text>
        {isClaimed ? (
          <Text style={[appStyles.body, { color: colors.green }]}>
            Reclamada: {formatRewards(event.claimed_rewards)}
          </Text>
        ) : null}
        <Text style={appStyles.body}>Termina: {formatDate(event.ends_at)}</Text>
        {isComplete && !isClaimed ? (
          <ActionButton
            label={isClaiming ? "Reclamando..." : "Reclamar recompensa"}
            disabled={isClaimDisabled}
            onPress={onClaim}
          />
        ) : null}
      </View>
    </Panel>
  );
}

function ObjectiveProgress({ objective }: { objective: PlayerEventObjectiveProgress }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={appStyles.row}>
        <Text style={appStyles.body}>{formatObjective(objective.kind)}</Text>
        <Text style={appStyles.body}>
          {formatValue(objective.kind, objective.current)} /{" "}
          {formatValue(objective.kind, objective.target)}
        </Text>
      </View>
      <ProgressBar value={objective.percent / 100} color={colors.orange} />
    </View>
  );
}

function formatScope(scope: PlayerEvent["scope"]): string {
  if (scope === "daily") {
    return "Diaria";
  }

  if (scope === "weekly") {
    return "Semanal";
  }

  if (scope === "monthly") {
    return "Mensual";
  }

  return "Global";
}

function formatEventStatus(event: PlayerEvent): string {
  if (event.claimed_at) {
    return "Reclamada";
  }

  if (event.completed_at) {
    return "Lista para cobrar";
  }

  return "Activa";
}

function formatObjective(kind: PlayerEventObjectiveProgress["kind"]): string {
  if (kind === "distance_meters") {
    return "Distancia";
  }

  if (kind === "influence_delta") {
    return "Influencia";
  }

  return "Territorios";
}

function formatValue(kind: PlayerEventObjectiveProgress["kind"], value: number): string {
  if (kind === "distance_meters") {
    return `${(value / 1000).toFixed(1)} km`;
  }

  return String(Math.round(value));
}

function formatRewards(rewards: Record<string, number>): string {
  const entries = Object.entries(rewards);
  if (entries.length === 0) {
    return "prestigio";
  }

  return entries.map(([currency, amount]) => `${amount} ${currency}`).join(" / ");
}

function formatDate(value: string): string {
  const date = new Date(value);
  return `${date.getUTCDate().toString().padStart(2, "0")}/${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
}
