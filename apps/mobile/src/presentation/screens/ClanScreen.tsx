import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type {
  ClanAnalytics,
  ClanDirectoryItem,
  ClanGovernanceAuditItem,
  ClanInvitation,
  ClanJoinRequest,
  ClanMemberContribution,
  ClanWar,
  ClanWeeklyTrend
} from "../../domain/models/AppModels";
import { useAppContainer } from "../../application/state/AppContext";
import { Panel } from "../components/Panel";
import { ProgressBar } from "../components/ProgressBar";
import { StatTile } from "../components/StatTile";
import { appStyles } from "../theme/styles";
import { colors } from "../theme/theme";

const roles = ["Lider", "Capitan", "Veterano", "Miembro", "Recluta"];

export function ClanScreen() {
  const { api } = useAppContainer();
  const [analytics, setAnalytics] = useState<ClanAnalytics | null>(null);
  const [weeklyTrends, setWeeklyTrends] = useState<ClanWeeklyTrend[]>([]);
  const [memberContributions, setMemberContributions] = useState<ClanMemberContribution[]>([]);
  const [governanceEvents, setGovernanceEvents] = useState<ClanGovernanceAuditItem[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<ClanInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<ClanInvitation[]>([]);
  const [clanDirectory, setClanDirectory] = useState<ClanDirectoryItem[]>([]);
  const [receivedJoinRequests, setReceivedJoinRequests] = useState<ClanJoinRequest[]>([]);
  const [sentJoinRequests, setSentJoinRequests] = useState<ClanJoinRequest[]>([]);
  const [clanWars, setClanWars] = useState<ClanWar[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const loadClan = useCallback(() => {
    if (!api.isConfigured()) {
      setMessage("Backend local: analytics de clan no disponibles.");
      return;
    }

    Promise.all([
      api.getClanAnalytics(),
      api.getClanWeeklyTrends(),
      api.getClanMemberContributions(),
      api.getClanGovernanceAudit(),
      api.getClanInvitations(),
      api.getClanJoinRequests(),
      api.getClanWars()
    ]).then(
      ([
        nextAnalytics,
        nextTrends,
        nextMembers,
        nextGovernanceEvents,
        nextInvitations,
        nextJoinRequests,
        nextWars
      ]) => {
        setAnalytics(nextAnalytics);
        setWeeklyTrends(nextTrends);
        setMemberContributions(nextMembers);
        setGovernanceEvents(nextGovernanceEvents);
        setReceivedInvitations(nextInvitations.received);
        setSentInvitations(nextInvitations.sent);
        setClanDirectory(nextJoinRequests.clans);
        setReceivedJoinRequests(nextJoinRequests.received);
        setSentJoinRequests(nextJoinRequests.sent);
        setClanWars(nextWars);
        setMessage(nextAnalytics ? "Analytics de clan actualizado." : "Aun no perteneces a un clan.");
      }
    )
      .catch((caught) => {
        setWeeklyTrends([]);
        setMemberContributions([]);
        setGovernanceEvents([]);
        setReceivedInvitations([]);
        setSentInvitations([]);
        setClanDirectory([]);
        setReceivedJoinRequests([]);
        setSentJoinRequests([]);
        setClanWars([]);
        setMessage(caught instanceof Error ? caught.message : "No se pudo cargar el clan.");
      });
  }, [api]);

  useEffect(() => {
    loadClan();
  }, [loadClan]);

  const respondToInvitation = (invitationId: string, action: "accept" | "decline") => {
    api
      .manageClanInvitation({ action, invitationId })
      .then(() => {
        setMessage(action === "accept" ? "Invitacion aceptada." : "Invitacion rechazada.");
        loadClan();
      })
      .catch((caught) => {
        setMessage(caught instanceof Error ? caught.message : "No se pudo responder la invitacion.");
      });
  };

  const requestJoin = (clanId: string) => {
    api
      .manageClanJoinRequest({ action: "request", clanId })
      .then((request) => {
        setMessage(request.status === "approved" ? "Te uniste al clan." : "Solicitud enviada.");
        loadClan();
      })
      .catch((caught) => {
        setMessage(caught instanceof Error ? caught.message : "No se pudo enviar la solicitud.");
      });
  };

  const respondToJoinRequest = (requestId: string, action: "approve" | "reject") => {
    api
      .manageClanJoinRequest({ action, requestId })
      .then(() => {
        setMessage(action === "approve" ? "Solicitud aprobada." : "Solicitud rechazada.");
        loadClan();
      })
      .catch((caught) => {
        setMessage(caught instanceof Error ? caught.message : "No se pudo responder la solicitud.");
      });
  };

  const createStarterClan = () => {
    api
      .createClan({
        name: "Escuadron Verde",
        description: "Nuevo clan listo para conquistar barrios en bicicleta.",
        color: colors.green,
        joinPolicy: "approval_required"
      })
      .then(() => {
        setMessage("Clan creado. Ya eres lider.");
        loadClan();
      })
      .catch((caught) => {
        setMessage(caught instanceof Error ? caught.message : "No se pudo crear el clan.");
      });
  };

  const updateJoinPolicy = (joinPolicy: ClanDirectoryItem["join_policy"]) => {
    api
      .updateClanSettings({ joinPolicy })
      .then(() => {
        setMessage("Ajustes de clan actualizados.");
        loadClan();
      })
      .catch((caught) => {
        setMessage(caught instanceof Error ? caught.message : "No se pudo actualizar el clan.");
      });
  };

  const leaveClan = () => {
    api
      .manageClanLifecycle({ action: "leave", reason: "Salida solicitada desde la app" })
      .then(() => {
        setMessage("Saliste del clan.");
        loadClan();
      })
      .catch((caught) => {
        setMessage(caught instanceof Error ? caught.message : "No se pudo salir del clan.");
      });
  };

  const transferLeadership = (targetPlayerId: string) => {
    api
      .manageClanLifecycle({
        action: "transfer_leadership",
        reason: "Transferencia solicitada desde la app",
        targetPlayerId
      })
      .then(() => {
        setMessage("Liderazgo transferido.");
        loadClan();
      })
      .catch((caught) => {
        setMessage(caught instanceof Error ? caught.message : "No se pudo transferir liderazgo.");
      });
  };

  const declareWar = (targetClanId: string) => {
    api
      .manageClanWar({
        action: "declare",
        reason: "Declaracion enviada desde la app",
        targetClanId
      })
      .then(() => {
        setMessage("Guerra de clan declarada.");
        loadClan();
      })
      .catch((caught) => {
        setMessage(caught instanceof Error ? caught.message : "No se pudo declarar guerra.");
      });
  };

  const endWar = (warId: string) => {
    api
      .manageClanWar({ action: "end", reason: "Cierre solicitado desde la app", warId })
      .then(() => {
        setMessage("Guerra de clan cerrada.");
        loadClan();
      })
      .catch((caught) => {
        setMessage(caught instanceof Error ? caught.message : "No se pudo cerrar la guerra.");
      });
  };

  const currentClan = analytics
    ? clanDirectory.find((clan) => clan.clan_id === analytics.clan_id) ?? null
    : null;
  const leadershipCandidate =
    memberContributions.find((member) => member.role !== "leader") ?? null;

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      <View style={{ gap: 6 }}>
        <Text style={appStyles.eyebrow}>Clan</Text>
        <Text style={appStyles.title}>{analytics?.name ?? "Dominio colectivo"}</Text>
        <Text style={appStyles.body}>
          Fuerza colectiva por miembros, territorios, influencia y regiones controladas.
        </Text>
      </View>

      {message ? (
        <Text style={{ color: message.includes("No ") ? colors.red : colors.green }}>
          {message}
        </Text>
      ) : null}

      {analytics ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <StatTile label="Nivel" value={String(analytics.level)} />
            <StatTile label="Miembros" value={String(analytics.member_count)} />
            <StatTile label="Territorios" value={String(analytics.territory_count)} />
            <StatTile label="Regiones" value={String(analytics.controlled_regions)} />
          </View>

          <Panel title="Preparacion de guerra">
            <View style={{ gap: 10 }}>
              <ProgressBar value={analytics.war_readiness / 100} color={analytics.color} />
              <Text style={appStyles.body}>Preparacion: {analytics.war_readiness}%</Text>
              <Text style={appStyles.body}>Influencia: {analytics.influence_delta}</Text>
              <Text style={appStyles.body}>
                Nivel promedio de territorio: {Number(analytics.average_territory_level).toFixed(1)}
              </Text>
              <Text style={appStyles.body}>
                Premios regionales: {analytics.regional_reward_count} /{" "}
                {analytics.regional_reward_coins} coins
              </Text>
            </View>
          </Panel>

          {weeklyTrends.length > 0 ? (
            <ClanWeeklyTrendsPanel trends={weeklyTrends} color={analytics.color} />
          ) : null}

          {memberContributions.length > 0 ? (
            <MemberContributionsPanel members={memberContributions} color={analytics.color} />
          ) : null}

          {governanceEvents.length > 0 ? (
            <GovernanceAuditPanel events={governanceEvents} />
          ) : null}

          <ClanSettingsPanel clan={currentClan} onUpdateJoinPolicy={updateJoinPolicy} />
          <ClanLifecyclePanel
            candidate={leadershipCandidate}
            onLeave={leaveClan}
            onTransferLeadership={transferLeadership}
          />
          <ClanWarsPanel
            currentClanId={analytics.clan_id}
            clans={clanDirectory}
            wars={clanWars}
            onDeclare={declareWar}
            onEnd={endWar}
          />
        </>
      ) : null}

      {receivedInvitations.length > 0 || sentInvitations.length > 0 ? (
        <ClanInvitationsPanel
          received={receivedInvitations}
          sent={sentInvitations}
          onRespond={respondToInvitation}
        />
      ) : null}

      {!analytics ? <ClanCreationPanel onCreate={createStarterClan} /> : null}

      <ClanJoinRequestsPanel
        currentClanId={analytics?.clan_id ?? null}
        clans={clanDirectory}
        received={receivedJoinRequests}
        sent={sentJoinRequests}
        onRequestJoin={requestJoin}
        onRespond={respondToJoinRequest}
      />

      <Panel title="Escuadron">
        <View style={{ gap: 10 }}>
          <Text style={appStyles.body}>
            Gobernanza activa: lideres y capitanes gestionan roles desde reglas del servidor.
          </Text>
          {roles.map((role, index) => (
            <View key={role} style={appStyles.row}>
              <Text style={{ color: colors.text, fontWeight: "800" }}>{role}</Text>
              <Text style={appStyles.body}>
                {index === 0 ? "Control total" : "Permisos escalables"}
              </Text>
            </View>
          ))}
        </View>
      </Panel>

      <Panel title="Objetivos de guerra">
        <View style={{ gap: 10 }}>
          <Text style={appStyles.body}>Capturar barrios conectados.</Text>
          <Text style={appStyles.body}>Defender hexagonos protegidos.</Text>
          <Text style={appStyles.body}>Subir ranking global por influencia y territorios.</Text>
        </View>
      </Panel>
    </ScrollView>
  );
}

interface ClanWeeklyTrendsPanelProps {
  trends: ClanWeeklyTrend[];
  color: string;
}

function ClanWeeklyTrendsPanel({ trends, color }: ClanWeeklyTrendsPanelProps) {
  const ordered = [...trends].reverse();
  const maxDistance = Math.max(...ordered.map((trend) => trend.distance_meters), 1);
  const maxInfluence = Math.max(...ordered.map((trend) => Math.max(0, trend.influence_delta)), 1);

  return (
    <Panel title="Ritmo semanal del clan">
      <View style={{ gap: 12 }}>
        {ordered.slice(-6).map((trend) => (
          <View key={trend.week_start} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
                {formatWeekLabel(trend.week_start)}
              </Text>
              <Text style={appStyles.body}>{(trend.distance_meters / 1000).toFixed(1)} km</Text>
            </View>
            <ProgressBar value={trend.distance_meters / maxDistance} color={color} />
            <ProgressBar
              value={Math.max(0, trend.influence_delta) / maxInfluence}
              color={colors.cyan}
            />
            <Text style={appStyles.body}>
              {trend.active_members} activos - {trend.contributing_members} aportaron influencia
            </Text>
          </View>
        ))}
      </View>
    </Panel>
  );
}

interface MemberContributionsPanelProps {
  members: ClanMemberContribution[];
  color: string;
}

function MemberContributionsPanel({ members, color }: MemberContributionsPanelProps) {
  const topMembers = members.slice(0, 5);
  const maxScore = Math.max(...topMembers.map((member) => member.squad_score), 1);

  return (
    <Panel title="Aportes del escuadron">
      <View style={{ gap: 12 }}>
        {topMembers.map((member) => (
          <View key={member.player_id} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
                {member.display_name}
              </Text>
              <Text style={appStyles.body}>{formatRole(member.role)}</Text>
            </View>
            <ProgressBar value={member.squad_score / maxScore} color={color} />
            <Text style={appStyles.body}>
              {(member.distance_meters / 1000).toFixed(1)} km - {member.influence_delta} influencia
            </Text>
            <Text style={appStyles.body}>
              {member.touched_territories} territorios - {member.valid_activity_count} rutas validas
            </Text>
          </View>
        ))}
      </View>
    </Panel>
  );
}

interface GovernanceAuditPanelProps {
  events: ClanGovernanceAuditItem[];
}

function GovernanceAuditPanel({ events }: GovernanceAuditPanelProps) {
  return (
    <Panel title="Historial de gobernanza">
      <View style={{ gap: 12 }}>
        {events.slice(0, 5).map((event) => (
          <View key={event.id} style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
                {formatGovernanceAction(event)}
              </Text>
              <Text style={appStyles.body}>{formatWeekLabel(event.created_at)}</Text>
            </View>
            <Text style={appStyles.body}>
              {event.actor_name} sobre {event.target_player_name}
            </Text>
            {event.reason ? <Text style={appStyles.body}>Motivo: {event.reason}</Text> : null}
          </View>
        ))}
      </View>
    </Panel>
  );
}

interface ClanInvitationsPanelProps {
  received: ClanInvitation[];
  sent: ClanInvitation[];
  onRespond: (invitationId: string, action: "accept" | "decline") => void;
}

function ClanInvitationsPanel({ received, sent, onRespond }: ClanInvitationsPanelProps) {
  const pendingReceived = received.filter((invitation) => invitation.status === "pending");
  const visibleSent = sent.slice(0, 3);

  return (
    <Panel title="Invitaciones de clan">
      <View style={{ gap: 12 }}>
        {pendingReceived.map((invitation) => (
          <View key={invitation.id} style={{ gap: 8 }}>
            <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
              {invitation.clan_name}
            </Text>
            <Text style={appStyles.body}>
              {invitation.actor_name} te invito - vence {formatWeekLabel(invitation.expires_at)}
            </Text>
            {invitation.message ? <Text style={appStyles.body}>{invitation.message}</Text> : null}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onRespond(invitation.id, "accept")}
                style={[appStyles.primaryButton, { flex: 1, minHeight: 40 }]}
              >
                <Text style={appStyles.buttonTextDark}>Aceptar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onRespond(invitation.id, "decline")}
                style={[appStyles.secondaryButton, { flex: 1, minHeight: 40 }]}
              >
                <Text style={appStyles.buttonTextLight}>Rechazar</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {visibleSent.map((invitation) => (
          <Text key={invitation.id} style={appStyles.body}>
            Enviada a {invitation.target_player_name}: {formatInvitationStatus(invitation.status)}
          </Text>
        ))}
      </View>
    </Panel>
  );
}

interface ClanCreationPanelProps {
  onCreate: () => void;
}

function ClanCreationPanel({ onCreate }: ClanCreationPanelProps) {
  return (
    <Panel title="Fundar clan">
      <View style={{ gap: 10 }}>
        <Text style={appStyles.body}>
          Crea un escuadron inicial, queda como lider y abre reclutamiento con aprobacion.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onCreate}
          style={[appStyles.primaryButton, { minHeight: 42 }]}
        >
          <Text style={appStyles.buttonTextDark}>Crear clan</Text>
        </Pressable>
      </View>
    </Panel>
  );
}

interface ClanSettingsPanelProps {
  clan: ClanDirectoryItem | null;
  onUpdateJoinPolicy: (joinPolicy: ClanDirectoryItem["join_policy"]) => void;
}

function ClanSettingsPanel({ clan, onUpdateJoinPolicy }: ClanSettingsPanelProps) {
  return (
    <Panel title="Ajustes de clan">
      <View style={{ gap: 10 }}>
        <Text style={appStyles.body}>
          Politica actual: {clan ? formatJoinPolicy(clan.join_policy) : "cargando"}
        </Text>
        {clan?.description ? <Text style={appStyles.body}>{clan.description}</Text> : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onUpdateJoinPolicy("open")}
            style={[appStyles.secondaryButton, { minHeight: 40 }]}
          >
            <Text style={appStyles.buttonTextLight}>Abierto</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onUpdateJoinPolicy("approval_required")}
            style={[appStyles.secondaryButton, { minHeight: 40 }]}
          >
            <Text style={appStyles.buttonTextLight}>Aprobacion</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onUpdateJoinPolicy("invite_only")}
            style={[appStyles.secondaryButton, { minHeight: 40 }]}
          >
            <Text style={appStyles.buttonTextLight}>Invitacion</Text>
          </Pressable>
        </View>
      </View>
    </Panel>
  );
}

interface ClanLifecyclePanelProps {
  candidate: ClanMemberContribution | null;
  onLeave: () => void;
  onTransferLeadership: (targetPlayerId: string) => void;
}

function ClanLifecyclePanel({
  candidate,
  onLeave,
  onTransferLeadership
}: ClanLifecyclePanelProps) {
  return (
    <Panel title="Ciclo del clan">
      <View style={{ gap: 10 }}>
        <Text style={appStyles.body}>
          Sal del clan como miembro o transfiere liderazgo antes de abandonar el mando.
        </Text>
        {candidate ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onTransferLeadership(candidate.player_id)}
            style={[appStyles.secondaryButton, { minHeight: 40 }]}
          >
            <Text style={appStyles.buttonTextLight}>Transferir a {candidate.display_name}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={onLeave}
          style={[appStyles.dangerButton, { minHeight: 40 }]}
        >
          <Text style={appStyles.buttonTextLight}>Salir del clan</Text>
        </Pressable>
      </View>
    </Panel>
  );
}

interface ClanWarsPanelProps {
  currentClanId: string;
  clans: ClanDirectoryItem[];
  wars: ClanWar[];
  onDeclare: (targetClanId: string) => void;
  onEnd: (warId: string) => void;
}

function ClanWarsPanel({ currentClanId, clans, wars, onDeclare, onEnd }: ClanWarsPanelProps) {
  const activeWars = wars.filter((war) => war.status === "active");
  const activeOpponentIds = new Set(
    activeWars.map((war) =>
      war.declarer_clan_id === currentClanId ? war.target_clan_id : war.declarer_clan_id
    )
  );
  const targetClan = clans.find(
    (clan) => clan.clan_id !== currentClanId && !activeOpponentIds.has(clan.clan_id)
  );

  return (
    <Panel title="Guerras de clan">
      <View style={{ gap: 12 }}>
        {activeWars.slice(0, 4).map((war) => {
          const opponentName =
            war.declarer_clan_id === currentClanId
              ? war.target_clan_name
              : war.declarer_clan_name;

          return (
            <View key={war.id} style={{ gap: 6 }}>
              <View style={appStyles.row}>
                <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
                  {opponentName}
                </Text>
                <Text style={appStyles.body}>Activa</Text>
              </View>
              <Text style={appStyles.body}>Fin previsto: {formatWeekLabel(war.ends_at)}</Text>
              {war.reason ? <Text style={appStyles.body}>{war.reason}</Text> : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => onEnd(war.id)}
                style={[appStyles.secondaryButton, { minHeight: 40 }]}
              >
                <Text style={appStyles.buttonTextLight}>Cerrar guerra</Text>
              </Pressable>
            </View>
          );
        })}

        {targetClan ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onDeclare(targetClan.clan_id)}
            style={[appStyles.dangerButton, { minHeight: 40 }]}
          >
            <Text style={appStyles.buttonTextLight}>Declarar guerra a {targetClan.name}</Text>
          </Pressable>
        ) : null}

        {activeWars.length === 0 && !targetClan ? (
          <Text style={appStyles.body}>Sin rivales disponibles por ahora.</Text>
        ) : null}
      </View>
    </Panel>
  );
}

interface ClanJoinRequestsPanelProps {
  currentClanId: string | null;
  clans: ClanDirectoryItem[];
  received: ClanJoinRequest[];
  sent: ClanJoinRequest[];
  onRequestJoin: (clanId: string) => void;
  onRespond: (requestId: string, action: "approve" | "reject") => void;
}

function ClanJoinRequestsPanel({
  currentClanId,
  clans,
  received,
  sent,
  onRequestJoin,
  onRespond
}: ClanJoinRequestsPanelProps) {
  const pendingSentClanIds = new Set(
    sent.filter((request) => request.status === "pending").map((request) => request.clan_id)
  );
  const visibleClans = clans
    .filter((clan) => clan.clan_id !== currentClanId)
    .filter((clan) => clan.join_policy !== "invite_only")
    .slice(0, 4);

  return (
    <Panel title={currentClanId ? "Solicitudes de ingreso" : "Explorar clanes"}>
      <View style={{ gap: 12 }}>
        {received.slice(0, 4).map((request) => (
          <View key={request.id} style={{ gap: 8 }}>
            <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
              {request.requester_name}
            </Text>
            {request.message ? <Text style={appStyles.body}>{request.message}</Text> : null}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onRespond(request.id, "approve")}
                style={[appStyles.primaryButton, { flex: 1, minHeight: 40 }]}
              >
                <Text style={appStyles.buttonTextDark}>Aprobar</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onRespond(request.id, "reject")}
                style={[appStyles.secondaryButton, { flex: 1, minHeight: 40 }]}
              >
                <Text style={appStyles.buttonTextLight}>Rechazar</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {!currentClanId
          ? visibleClans.map((clan) => (
              <View key={clan.clan_id} style={{ gap: 8 }}>
                <View style={appStyles.row}>
                  <Text style={[appStyles.body, { color: colors.text, fontWeight: "800" }]}>
                    {clan.name}
                  </Text>
                  <Text style={appStyles.body}>
                    {clan.member_count}/{clan.max_members}
                  </Text>
                </View>
                <Text style={appStyles.body}>
                  Nivel {clan.level} - {formatJoinPolicy(clan.join_policy)}
                </Text>
                {clan.description ? <Text style={appStyles.body}>{clan.description}</Text> : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={pendingSentClanIds.has(clan.clan_id)}
                  onPress={() => onRequestJoin(clan.clan_id)}
                  style={[
                    pendingSentClanIds.has(clan.clan_id)
                      ? appStyles.secondaryButton
                      : appStyles.primaryButton,
                    { minHeight: 40 }
                  ]}
                >
                  <Text
                    style={
                      pendingSentClanIds.has(clan.clan_id)
                        ? appStyles.buttonTextLight
                        : appStyles.buttonTextDark
                    }
                  >
                    {pendingSentClanIds.has(clan.clan_id) ? "Pendiente" : "Solicitar ingreso"}
                  </Text>
                </Pressable>
              </View>
            ))
          : null}

        {sent.slice(0, 3).map((request) => (
          <Text key={request.id} style={appStyles.body}>
            Solicitud a {request.clan_name}: {formatJoinRequestStatus(request.status)}
          </Text>
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

function formatRole(role: ClanMemberContribution["role"]): string {
  return role.replace("_", " ");
}

function formatGovernanceAction(event: ClanGovernanceAuditItem): string {
  if (event.action === "remove_member") {
    return "Miembro removido";
  }

  if (event.action === "leave_clan") {
    return "Salida del clan";
  }

  if (event.action === "transfer_leadership") {
    return "Transferencia de liderazgo";
  }

  const previousRole = event.previous_role ? formatRole(event.previous_role) : "sin rol";
  const nextRole = event.next_role ? formatRole(event.next_role) : "sin rol";
  return `Cambio de rol: ${previousRole} -> ${nextRole}`;
}

function formatInvitationStatus(status: ClanInvitation["status"]): string {
  if (status === "accepted") {
    return "aceptada";
  }

  if (status === "declined") {
    return "rechazada";
  }

  if (status === "expired") {
    return "expirada";
  }

  return "pendiente";
}

function formatJoinPolicy(policy: ClanDirectoryItem["join_policy"]): string {
  if (policy === "open") {
    return "ingreso abierto";
  }

  if (policy === "approval_required") {
    return "requiere aprobacion";
  }

  return "solo invitacion";
}

function formatJoinRequestStatus(status: ClanJoinRequest["status"]): string {
  if (status === "approved") {
    return "aprobada";
  }

  if (status === "rejected") {
    return "rechazada";
  }

  if (status === "cancelled") {
    return "cancelada";
  }

  return "pendiente";
}
