import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import type { AppNotification, ChatMessage, ChatThread, FeedPost } from "../../domain/models/AppModels";
import { useAppContainer } from "../../application/state/AppContext";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { appStyles } from "../theme/styles";
import { colors } from "../theme/theme";

export function SocialScreen() {
  const { api } = useAppContainer();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [postBody, setPostBody] = useState("");
  const [targetPlayerId, setTargetPlayerId] = useState("");
  const [shareActivityId, setShareActivityId] = useState("");
  const [shareH3Index, setShareH3Index] = useState("");
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageBody, setMessageBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedNotificationKind, setSelectedNotificationKind] = useState<string | null>(null);
  const [lastSocialRefreshAt, setLastSocialRefreshAt] = useState<string | null>(null);
  const [notificationVisibleLimit, setNotificationVisibleLimit] = useState(5);

  function resetNotificationVisibleLimit() {
    setNotificationVisibleLimit(5);
  }

  function clearNotificationFilters() {
    resetNotificationVisibleLimit();
    setShowUnreadOnly(false);
    setSelectedNotificationKind(null);
  }

  async function load() {
    resetNotificationVisibleLimit();
    setIsBusy(true);
    setStatus(null);
    try {
      if (!api.isConfigured()) {
        setPosts(localPosts);
        setNotifications([]);
        setLastSocialRefreshAt(new Date().toISOString());
        return;
      }

      const [feed, social] = await Promise.all([api.getFeed(), api.getSocialGraph()]);
      setPosts(feed);
      setNotifications(social.notifications);
      setLastSocialRefreshAt(new Date().toISOString());
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudo cargar social.");
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function publish() {
    if (!postBody.trim()) {
      setStatus("Escribe algo para publicar.");
      return;
    }

    setIsBusy(true);
    setStatus(null);
    try {
      if (!api.isConfigured()) {
        setPosts([
          {
            id: String(Date.now()),
            author_id: "local-rider",
            author_name: "Founder Rider",
            author_avatar_url: null,
            activity_id: null,
            territory_h3_index: null,
            visibility: "public",
            body: postBody.trim(),
            media_paths: [],
            created_at: new Date().toISOString(),
            like_count: 0,
            comment_count: 0
          },
          ...posts
        ]);
      } else {
        const created = await api.createFeedPost({
          body: postBody.trim(),
          visibility: "public"
        });
        setPosts([created, ...posts]);
      }
      setPostBody("");
      setStatus("Publicado.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudo publicar.");
    } finally {
      setIsBusy(false);
    }
  }

  async function like(postId: string) {
    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus(null);

    try {
      if (api.isConfigured()) {
        await api.toggleFeedLike(postId);
      }
      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, like_count: Number(post.like_count) + 1 } : post
        )
      );
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudo marcar like.");
    } finally {
      setIsBusy(false);
    }
  }

  async function comment(postId: string) {
    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus(null);

    try {
      if (api.isConfigured()) {
        await api.addFeedComment(postId, "Gran conquista.");
      }
      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? { ...post, comment_count: Number(post.comment_count) + 1 } : post
        )
      );
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudo comentar.");
    } finally {
      setIsBusy(false);
    }
  }

  async function openChat() {
    if (!targetPlayerId.trim()) {
      setStatus("Ingresa el ID del rider.");
      return;
    }

    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus(null);
    try {
      if (!api.isConfigured()) {
        setThread({ id: "local-thread", clan_id: null, is_group: false, title: null, created_at: new Date().toISOString() });
        setMessages([]);
        return;
      }
      const nextThread = await api.ensurePrivateChat(targetPlayerId.trim());
      setThread(nextThread);
      setMessages(await api.getChatMessages(nextThread.id));
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudo abrir chat.");
    } finally {
      setIsBusy(false);
    }
  }

  async function openClanChat() {
    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus(null);
    try {
      if (!api.isConfigured()) {
        setThread({
          id: "local-clan-thread",
          clan_id: "local-clan",
          is_group: true,
          title: "Clan local",
          created_at: new Date().toISOString()
        });
        setMessages([]);
        return;
      }

      const nextThread = await api.ensureClanChat();
      setThread(nextThread);
      setMessages(await api.getChatMessages(nextThread.id));
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudo abrir chat de clan.");
    } finally {
      setIsBusy(false);
    }
  }

  async function shareActivity() {
    if (!shareActivityId.trim()) {
      setStatus("Ingresa el ID de actividad.");
      return;
    }

    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus(null);

    try {
      const text = "Ruta compartida desde Cycle Wars.";
      const post = api.isConfigured()
        ? await api.shareActivity(shareActivityId.trim(), text)
        : makeLocalPost(text, null);
      setPosts([post, ...posts]);
      setShareActivityId("");
      setStatus("Ruta compartida.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudo compartir ruta.");
    } finally {
      setIsBusy(false);
    }
  }

  async function shareConquest() {
    if (!shareH3Index.trim()) {
      setStatus("Ingresa el H3 conquistado.");
      return;
    }

    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus(null);

    try {
      const text = "Conquista compartida desde Cycle Wars.";
      const post = api.isConfigured()
        ? await api.shareConquest(shareH3Index.trim(), text)
        : makeLocalPost(text, shareH3Index.trim());
      setPosts([post, ...posts]);
      setShareH3Index("");
      setStatus("Conquista compartida.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudo compartir conquista.");
    } finally {
      setIsBusy(false);
    }
  }

  async function sendMessage() {
    if (!thread || !messageBody.trim()) {
      return;
    }

    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus(null);

    try {
      if (!api.isConfigured()) {
        setMessages([
          ...messages,
          {
            id: String(Date.now()),
            thread_id: thread.id,
            sender_id: "local-rider",
            body: messageBody.trim(),
            created_at: new Date().toISOString()
          }
        ]);
      } else {
        const sent = await api.sendChatMessage(thread.id, messageBody.trim());
        setMessages([...messages, sent]);
      }
      setMessageBody("");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudo enviar mensaje.");
    } finally {
      setIsBusy(false);
    }
  }

  async function markNotificationRead(notificationId: string) {
    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus(null);
    try {
      if (api.isConfigured()) {
        await api.markNotificationRead(notificationId);
      }
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read_at: new Date().toISOString() }
            : notification
        )
      );
      setStatus("Notificacion leida.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudo marcar la notificacion.");
    } finally {
      setIsBusy(false);
    }
  }

  async function markAllNotificationsRead() {
    if (isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus(null);
    try {
      if (api.isConfigured()) {
        await api.markAllNotificationsRead();
      }
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read_at: notification.read_at ?? readAt }))
      );
      setSelectedNotificationKind(null);
      setShowUnreadOnly(false);
      resetNotificationVisibleLimit();
      setStatus("Notificaciones leidas.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudieron marcar notificaciones.");
    } finally {
      setIsBusy(false);
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    const matchesUnread = !showUnreadOnly || !notification.read_at;
    const matchesKind = !selectedNotificationKind || notification.kind === selectedNotificationKind;
    return matchesUnread && matchesKind;
  });
  const sortedFilteredNotifications = sortNotificationsForInbox(filteredNotifications);
  const displayedNotifications = sortedFilteredNotifications.slice(0, notificationVisibleLimit);
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;
  const readCount = notifications.length - unreadCount;
  const notificationInboxSummary = formatNotificationInboxSummary(notifications.length, unreadCount, readCount);
  const latestNotificationSummary = formatLatestNotificationSummary(sortedFilteredNotifications[0]);
  const oldestPendingNotificationSummary = formatOldestPendingNotificationSummary(sortedFilteredNotifications);
  const newestPendingNotification = getNewestPendingNotification(sortedFilteredNotifications);
  const oldestPendingNotification = getOldestPendingNotification(sortedFilteredNotifications);
  const canShowOldestPendingQuickRead =
    Boolean(oldestPendingNotification) && oldestPendingNotification?.id !== newestPendingNotification?.id;
  const notificationVisibleCountLabel = `Mostrando ${displayedNotifications.length} de ${filteredNotifications.length}`;
  const canShowMoreNotifications = displayedNotifications.length < filteredNotifications.length;
  const canShowFewerNotifications = notificationVisibleLimit > 5 && filteredNotifications.length > 0;
  const unreadSummary = summarizeUnreadNotifications(notifications);
  const selectedNotificationKindLabel = selectedNotificationKind
    ? formatNotificationKind(selectedNotificationKind)
    : null;
  const lastSocialRefreshLabel = lastSocialRefreshAt ? formatRefreshTime(lastSocialRefreshAt) : "Pendiente";
  const publishActionLabel = isBusy ? "Procesando" : postBody.trim() ? "Publicar" : "Escribe para publicar";
  const shareActivityActionLabel = isBusy
    ? "Compartiendo ruta"
    : shareActivityId.trim()
      ? "Compartir ruta"
      : "Ingresa actividad";
  const shareConquestActionLabel = isBusy
    ? "Compartiendo conquista"
    : shareH3Index.trim()
      ? "Compartir conquista"
      : "Ingresa H3";
  const sendMessageActionLabel = isBusy ? "Enviando" : messageBody.trim() ? "Enviar" : "Escribe mensaje";
  const openChatActionLabel = isBusy ? "Abriendo chat" : targetPlayerId.trim() ? "Abrir chat" : "Ingresa ID";
  const openClanChatActionLabel = isBusy ? "Abriendo clan" : "Abrir chat de clan";
  const likeActionLabel = isBusy ? "Marcando like" : "Like";
  const commentActionLabel = isBusy ? "Comentando" : "Comentar";
  const notificationRefreshLabel = isBusy ? "Actualizando" : "Actualizar";
  const notificationReadActionLabel = isBusy ? "Marcando" : "Marcar leida";
  const notificationReadAllActionLabel = isBusy ? "Marcando todas" : "Marcar todas leidas";
  const newestQuickReadLabel = isBusy ? "Marcando reciente" : "Marcar mas reciente leida";
  const oldestQuickReadLabel = isBusy ? "Marcando antigua" : "Marcar mas antigua leida";
  const activeNotificationFilterCount = countActiveNotificationFilters(showUnreadOnly, selectedNotificationKind);
  const notificationFilterSummary = formatNotificationFilterSummary(showUnreadOnly, selectedNotificationKind);
  const emptyFilteredNotificationMessage = formatEmptyFilteredNotificationMessage(
    showUnreadOnly,
    selectedNotificationKind,
    selectedNotificationKindLabel
  );
  const emptyNotificationInboxMessage = formatEmptyNotificationInboxMessage(lastSocialRefreshAt);
  const unreadFilterLabel = formatUnreadFilterLabel(showUnreadOnly, unreadCount);
  const isUnreadFilterDisabled = isBusy || (!showUnreadOnly && unreadCount === 0);
  const isPublishDisabled = isBusy || !postBody.trim();
  const isOpenChatDisabled = isBusy || !targetPlayerId.trim();
  const isSendMessageDisabled = isBusy || !messageBody.trim();
  const isShareActivityDisabled = isBusy || !shareActivityId.trim();
  const isShareConquestDisabled = isBusy || !shareH3Index.trim();

  return (
    <ScrollView style={appStyles.screen} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
      <View style={{ gap: 6 }}>
        <Text style={appStyles.eyebrow}>Social</Text>
        <Text style={appStyles.title}>Feed y chat</Text>
        <Text style={appStyles.body}>Comparte rutas, conquistas, likes, comentarios y mensajes privados.</Text>
      </View>

      {status ? <Text style={{ color: status.includes("No ") ? colors.red : colors.green }}>{status}</Text> : null}

      <Panel title="Publicar">
        <View style={{ gap: 10 }}>
          <SocialInput value={postBody} onChangeText={setPostBody} placeholder="Cuenta tu conquista..." disabled={isBusy} />
          <ActionButton label={publishActionLabel} onPress={() => void publish()} disabled={isPublishDisabled} />
        </View>
      </Panel>

      <Panel title="Notificaciones">
        <View style={{ gap: 8 }}>
          <View style={appStyles.row}>
            <Text style={appStyles.body}>{unreadCount} sin leer</Text>
            <Text style={[appStyles.body, { color: colors.faint }]}>Actualizado {lastSocialRefreshLabel}</Text>
            <ActionButton
              label={unreadFilterLabel}
              variant="secondary"
              onPress={() => {
                resetNotificationVisibleLimit();
                setShowUnreadOnly((current) => !current);
              }}
              disabled={isUnreadFilterDisabled}
            />
            <ActionButton
              label={notificationRefreshLabel}
              variant="secondary"
              onPress={() => void load()}
              disabled={isBusy}
            />
          </View>
          <Text style={[appStyles.body, { color: colors.faint }]}>{notificationInboxSummary}</Text>
          {latestNotificationSummary ? (
            <Text style={[appStyles.body, { color: colors.faint }]}>{latestNotificationSummary}</Text>
          ) : null}
          {oldestPendingNotificationSummary ? (
            <Text style={[appStyles.body, { color: colors.faint }]}>{oldestPendingNotificationSummary}</Text>
          ) : null}
          {newestPendingNotification ? (
            <>
              <Text style={[appStyles.body, { color: colors.faint }]}>
                Acciones rapidas: revisa primero lo nuevo o lo que lleva mas tiempo pendiente.
              </Text>
              <View style={notificationQuickActionsStyle}>
                <ActionButton
                  label={newestQuickReadLabel}
                  variant="secondary"
                  onPress={() => void markNotificationRead(newestPendingNotification.id)}
                  disabled={isBusy}
                />
                {canShowOldestPendingQuickRead && oldestPendingNotification ? (
                  <ActionButton
                    label={oldestQuickReadLabel}
                    variant="secondary"
                    onPress={() => void markNotificationRead(oldestPendingNotification.id)}
                    disabled={isBusy}
                  />
                ) : null}
              </View>
            </>
          ) : null}
          {unreadSummary.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {unreadSummary.map((item) => (
                <ActionButton
                  key={item.label}
                  label={`${item.label}: ${item.count}`}
                  variant={selectedNotificationKind === item.kind ? "primary" : "secondary"}
                  onPress={() => {
                    resetNotificationVisibleLimit();
                    setSelectedNotificationKind(item.kind);
                  }}
                  disabled={isBusy}
                />
              ))}
            </View>
          ) : null}
          {activeNotificationFilterCount > 0 ? (
            <View style={appStyles.row}>
              <Text style={[appStyles.body, { color: colors.faint }]}>
                Filtros activos: {activeNotificationFilterCount}
              </Text>
              <ActionButton
                label="Limpiar filtros"
                variant="secondary"
                onPress={clearNotificationFilters}
                disabled={isBusy}
              />
            </View>
          ) : null}
          <Text style={[appStyles.body, { color: colors.faint }]}>
            Vista: {notificationFilterSummary}
          </Text>
          {selectedNotificationKindLabel ? (
            <View style={appStyles.row}>
              <Text style={[appStyles.body, { color: colors.cyan, fontWeight: "800" }]}>
                Filtro: {selectedNotificationKindLabel}
              </Text>
              <ActionButton
                label="Ver categorias"
                variant="secondary"
                onPress={() => {
                  resetNotificationVisibleLimit();
                  setSelectedNotificationKind(null);
                }}
                disabled={isBusy}
              />
            </View>
          ) : null}
          {displayedNotifications.map((notification) => (
            <View
              key={notification.id}
              style={notification.read_at ? notificationItemStyle : [notificationItemStyle, unreadNotificationItemStyle]}
            >
              <View style={appStyles.row}>
                <Text style={[appStyles.body, { color: colors.cyan, fontWeight: "800" }]}>
                  {formatNotificationKind(notification.kind)}
                </Text>
                <Text style={[appStyles.body, { color: notification.read_at ? colors.faint : colors.green }]}>
                  {formatNotificationStatus(notification)}
                </Text>
              </View>
              <Text style={[appStyles.body, { color: colors.faint }]}>
                Recibida {formatNotificationCreatedAt(notification)}
              </Text>
              {notification.read_at ? (
                <Text style={[appStyles.body, { color: colors.faint }]}>
                  Leida {formatNotificationReadAt(notification)}
                </Text>
              ) : null}
              <Text
                style={[
                  appStyles.body,
                  { color: notification.read_at ? colors.faint : colors.text }
                ]}
              >
                {notification.title}: {notification.body}
              </Text>
              {!notification.read_at ? (
                <ActionButton
                  label={notificationReadActionLabel}
                  variant="secondary"
                  onPress={() => void markNotificationRead(notification.id)}
                  disabled={isBusy}
                />
              ) : null}
            </View>
          ))}
          {filteredNotifications.length > 0 ? (
            <Text style={[appStyles.body, { color: colors.faint }]}>
              {notificationVisibleCountLabel}
            </Text>
          ) : null}
          {canShowMoreNotifications ? (
            <ActionButton
              label="Ver mas"
              variant="secondary"
              onPress={() => setNotificationVisibleLimit((current) => current + 5)}
              disabled={isBusy}
            />
          ) : null}
          {canShowFewerNotifications ? (
            <ActionButton
              label="Ver menos"
              variant="secondary"
              onPress={resetNotificationVisibleLimit}
              disabled={isBusy}
            />
          ) : null}
          {notifications.some((notification) => !notification.read_at) ? (
            <ActionButton
              label={notificationReadAllActionLabel}
              variant="secondary"
              onPress={() => void markAllNotificationsRead()}
              disabled={isBusy}
            />
          ) : null}
          {notifications.length === 0 ? <Text style={appStyles.body}>{emptyNotificationInboxMessage}</Text> : null}
          {notifications.length > 0 && filteredNotifications.length === 0 ? (
            <Text style={appStyles.body}>{emptyFilteredNotificationMessage}</Text>
          ) : null}
        </View>
      </Panel>

      <Panel title="Chat privado">
        <View style={{ gap: 10 }}>
          <SocialInput value={targetPlayerId} onChangeText={setTargetPlayerId} placeholder="ID del rider" disabled={isBusy} />
          <ActionButton label={openChatActionLabel} variant="secondary" onPress={() => void openChat()} disabled={isOpenChatDisabled} />
          <ActionButton
            label={openClanChatActionLabel}
            variant="secondary"
            onPress={() => void openClanChat()}
            disabled={isBusy}
          />
          {thread ? (
            <View style={{ gap: 8 }}>
              <Text style={appStyles.body}>
                {thread.is_group ? thread.title ?? "Chat de clan" : "Chat privado"}
              </Text>
              {messages.slice(-5).map((message) => (
                <Text key={message.id} style={appStyles.body}>
                  {message.sender_id.slice(0, 8)}: {message.body}
                </Text>
              ))}
              <SocialInput value={messageBody} onChangeText={setMessageBody} placeholder="Mensaje" disabled={isBusy} />
              <ActionButton label={sendMessageActionLabel} onPress={() => void sendMessage()} disabled={isSendMessageDisabled} />
            </View>
          ) : null}
        </View>
      </Panel>

      <Panel title="Compartir">
        <View style={{ gap: 10 }}>
          <SocialInput value={shareActivityId} onChangeText={setShareActivityId} placeholder="ID de actividad" disabled={isBusy} />
          <ActionButton
            label={shareActivityActionLabel}
            variant="secondary"
            onPress={() => void shareActivity()}
            disabled={isShareActivityDisabled}
          />
          <SocialInput value={shareH3Index} onChangeText={setShareH3Index} placeholder="H3 conquistado" disabled={isBusy} />
          <ActionButton
            label={shareConquestActionLabel}
            variant="secondary"
            onPress={() => void shareConquest()}
            disabled={isShareConquestDisabled}
          />
        </View>
      </Panel>

      <View style={{ gap: 10 }}>
        {posts.map((post) => (
          <Panel key={post.id}>
            <View style={{ gap: 10 }}>
              <View style={appStyles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "800" }}>{post.author_name}</Text>
                  <Text style={[appStyles.body, { fontSize: 12 }]}>{post.visibility}</Text>
                </View>
                <Text style={{ color: colors.faint, fontSize: 12 }}>{new Date(post.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={appStyles.body}>{post.body ?? "Conquista compartida."}</Text>
              {post.territory_h3_index ? <Text style={appStyles.body}>H3: {post.territory_h3_index}</Text> : null}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <ActionButton
                  label={`${likeActionLabel} ${post.like_count}`}
                  variant="secondary"
                  onPress={() => void like(post.id)}
                  disabled={isBusy}
                />
                <ActionButton
                  label={`${commentActionLabel} ${post.comment_count}`}
                  variant="secondary"
                  onPress={() => void comment(post.id)}
                  disabled={isBusy}
                />
              </View>
            </View>
          </Panel>
        ))}
      </View>
    </ScrollView>
  );
}

function formatNotificationKind(kind: string): string {
  if (kind === "territory_won") {
    return "Territorio ganado";
  }

  if (kind === "territory_lost") {
    return "Territorio perdido";
  }

  if (kind === "territory_attacked") {
    return "Ataque territorial";
  }

  if (kind === "clan_war") {
    return "Guerra de clan";
  }

  if (kind === "event_started") {
    return "Evento";
  }

  return "Aviso";
}

function summarizeUnreadNotifications(notifications: AppNotification[]): Array<{
  label: string;
  count: number;
  kind: string;
}> {
  const summary = new Map<string, { count: number; kind: string }>();

  for (const notification of notifications) {
    if (notification.read_at) {
      continue;
    }

    const label = formatNotificationKind(notification.kind);
    const existing = summary.get(label);
    summary.set(label, {
      count: (existing?.count ?? 0) + 1,
      kind: existing?.kind ?? notification.kind
    });
  }

  return Array.from(summary.entries()).map(([label, item]) => ({ label, ...item }));
}

function sortNotificationsForInbox(notifications: AppNotification[]): AppNotification[] {
  return [...notifications].sort((first, second) => {
    if (!first.read_at && second.read_at) {
      return -1;
    }

    if (first.read_at && !second.read_at) {
      return 1;
    }

    return getNotificationTimestamp(second) - getNotificationTimestamp(first);
  });
}

function getNotificationTimestamp(notification: AppNotification): number {
  const timestamp = Date.parse(notification.created_at);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatNotificationStatus(notification: AppNotification): string {
  return notification.read_at ? "Leida" : "Pendiente";
}

function formatNotificationCreatedAt(notification: AppNotification): string {
  return formatRefreshTime(notification.created_at);
}

function formatNotificationReadAt(notification: AppNotification): string {
  return notification.read_at ? formatRefreshTime(notification.read_at) : "Pendiente";
}

function formatLatestNotificationSummary(notification: AppNotification | undefined): string | null {
  if (!notification) {
    return null;
  }

  return `Ultima alerta: ${formatNotificationKind(notification.kind)} / ${formatNotificationCreatedAt(notification)}`;
}

function formatOldestPendingNotificationSummary(notifications: AppNotification[]): string | null {
  const oldest = getOldestPendingNotification(notifications);
  if (!oldest) {
    return null;
  }

  return `Pendiente mas antigua: ${formatNotificationKind(oldest.kind)} / ${formatNotificationCreatedAt(oldest)}`;
}

function getOldestPendingNotification(notifications: AppNotification[]): AppNotification | null {
  const pendingNotifications = notifications.filter((notification) => !notification.read_at);
  return pendingNotifications.at(-1) ?? null;
}

function getNewestPendingNotification(notifications: AppNotification[]): AppNotification | null {
  return notifications.find((notification) => !notification.read_at) ?? null;
}

function countActiveNotificationFilters(showUnreadOnly: boolean, selectedKind: string | null): number {
  let count = showUnreadOnly ? 1 : 0;
  if (selectedKind) {
    count += 1;
  }
  return count;
}

function formatNotificationFilterSummary(showUnreadOnly: boolean, selectedKind: string | null): string {
  const parts: string[] = [];

  if (showUnreadOnly) {
    parts.push("no leidas");
  }

  if (selectedKind) {
    parts.push(formatNotificationKind(selectedKind));
  }

  if (parts.length === 0) {
    return "todas";
  }
  return parts.join(" / ");
}

function formatNotificationInboxSummary(total: number, unread: number, read: number): string {
  return `Bandeja: ${total} total / ${unread} pendientes / ${read} leidas`;
}

function formatUnreadFilterLabel(showUnreadOnly: boolean, unreadCount: number): string {
  if (showUnreadOnly) {
    return "Ver todas";
  }

  return unreadCount > 0 ? "Solo no leidas" : "Sin pendientes";
}

function formatEmptyNotificationInboxMessage(lastRefreshAt: string | null): string {
  const suffix = lastRefreshAt ? ` Ultima revision ${formatRefreshTime(lastRefreshAt)}.` : "";
  return `Sin notificaciones por ahora.${suffix}`;
}

function formatEmptyFilteredNotificationMessage(
  showUnreadOnly: boolean,
  selectedKind: string | null,
  selectedKindLabel: string | null
): string {
  if (showUnreadOnly && !selectedKind) {
    return "No quedan notificaciones sin leer.";
  }

  if (selectedKind && selectedKindLabel) {
    return showUnreadOnly
      ? `No hay notificaciones sin leer de ${selectedKindLabel}.`
      : `No hay notificaciones de ${selectedKindLabel}.`;
  }

  return "No hay notificaciones para esta vista.";
}

function formatRefreshTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Pendiente";
  }

  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

interface SocialInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

function SocialInput({ value, onChangeText, placeholder, disabled = false }: SocialInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      editable={!disabled}
      placeholder={placeholder}
      placeholderTextColor={colors.faint}
      style={{
        minHeight: 46,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        color: colors.text,
        opacity: disabled ? 0.55 : 1,
        paddingHorizontal: 12
      }}
    />
  );
}

const notificationItemStyle = {
  gap: 6,
  paddingBottom: 10,
  borderBottomWidth: 1,
  borderBottomColor: colors.border
};

const unreadNotificationItemStyle = {
  paddingLeft: 10,
  borderLeftWidth: 3,
  borderLeftColor: colors.green
};

const notificationQuickActionsStyle = {
  flexDirection: "row" as const,
  flexWrap: "wrap" as const,
  gap: 8
};

const localPosts: FeedPost[] = [
  {
    id: "local-feed-1",
    author_id: "local-rider",
    author_name: "Founder Rider",
    author_avatar_url: null,
    activity_id: null,
    territory_h3_index: "89b2a100d43ffff",
    visibility: "public",
    body: "Primera conquista local lista para compartir.",
    media_paths: [],
    created_at: new Date().toISOString(),
    like_count: 12,
    comment_count: 3
  }
];

function makeLocalPost(body: string, h3Index: string | null): FeedPost {
  return {
    id: String(Date.now()),
    author_id: "local-rider",
    author_name: "Founder Rider",
    author_avatar_url: null,
    activity_id: null,
    territory_h3_index: h3Index,
    visibility: "public",
    body,
    media_paths: [],
    created_at: new Date().toISOString(),
    like_count: 0,
    comment_count: 0
  };
}
