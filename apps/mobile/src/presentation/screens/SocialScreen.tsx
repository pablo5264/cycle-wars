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

  async function load() {
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
    }
  }

  async function comment(postId: string) {
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
    }
  }

  async function openChat() {
    if (!targetPlayerId.trim()) {
      setStatus("Ingresa el ID del rider.");
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
    }
  }

  async function shareConquest() {
    if (!shareH3Index.trim()) {
      setStatus("Ingresa el H3 conquistado.");
      return;
    }

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
    }
  }

  async function sendMessage() {
    if (!thread || !messageBody.trim()) {
      return;
    }

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
    }
  }

  async function markNotificationRead(notificationId: string) {
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
    }
  }

  async function markAllNotificationsRead() {
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
      setStatus("Notificaciones leidas.");
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : "No se pudieron marcar notificaciones.");
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    const matchesUnread = !showUnreadOnly || !notification.read_at;
    const matchesKind = !selectedNotificationKind || notification.kind === selectedNotificationKind;
    return matchesUnread && matchesKind;
  });
  const displayedNotifications = sortNotificationsForInbox(filteredNotifications).slice(0, notificationVisibleLimit);
  const unreadCount = notifications.filter((notification) => !notification.read_at).length;
  const notificationVisibleCountLabel = `Mostrando ${displayedNotifications.length} de ${filteredNotifications.length}`;
  const canShowMoreNotifications = displayedNotifications.length < filteredNotifications.length;
  const unreadSummary = summarizeUnreadNotifications(notifications);
  const selectedNotificationKindLabel = selectedNotificationKind
    ? formatNotificationKind(selectedNotificationKind)
    : null;
  const lastSocialRefreshLabel = lastSocialRefreshAt ? formatRefreshTime(lastSocialRefreshAt) : "Pendiente";
  const notificationRefreshLabel = isBusy ? "Actualizando" : "Actualizar";

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
          <SocialInput value={postBody} onChangeText={setPostBody} placeholder="Cuenta tu conquista..." />
          <ActionButton label="Publicar" onPress={() => void publish()} disabled={isBusy} />
        </View>
      </Panel>

      <Panel title="Notificaciones">
        <View style={{ gap: 8 }}>
          <View style={appStyles.row}>
            <Text style={appStyles.body}>{unreadCount} sin leer</Text>
            <Text style={[appStyles.body, { color: colors.faint }]}>Actualizado {lastSocialRefreshLabel}</Text>
            <ActionButton
              label={showUnreadOnly ? "Ver todas" : "Solo no leidas"}
              variant="secondary"
              onPress={() => setShowUnreadOnly((current) => !current)}
            />
            <ActionButton
              label={notificationRefreshLabel}
              variant="secondary"
              onPress={() => void load()}
              disabled={isBusy}
            />
          </View>
          {unreadSummary.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {unreadSummary.map((item) => (
                <ActionButton
                  key={item.label}
                  label={`${item.label}: ${item.count}`}
                  variant="secondary"
                  onPress={() => setSelectedNotificationKind(item.kind)}
                />
              ))}
            </View>
          ) : null}
          {selectedNotificationKindLabel ? (
            <View style={appStyles.row}>
              <Text style={[appStyles.body, { color: colors.cyan, fontWeight: "800" }]}>
                Filtro: {selectedNotificationKindLabel}
              </Text>
              <ActionButton
                label="Ver categorias"
                variant="secondary"
                onPress={() => setSelectedNotificationKind(null)}
              />
            </View>
          ) : null}
          {displayedNotifications.map((notification) => (
            <View key={notification.id} style={{ gap: 6 }}>
              <Text style={[appStyles.body, { color: colors.cyan, fontWeight: "800" }]}>
                {formatNotificationKind(notification.kind)}
              </Text>
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
                  label="Marcar leida"
                  variant="secondary"
                  onPress={() => void markNotificationRead(notification.id)}
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
            />
          ) : null}
          {notifications.some((notification) => !notification.read_at) ? (
            <ActionButton
              label="Marcar todas leidas"
              variant="secondary"
              onPress={() => void markAllNotificationsRead()}
            />
          ) : null}
          {notifications.length === 0 ? <Text style={appStyles.body}>Sin notificaciones nuevas.</Text> : null}
          {notifications.length > 0 && filteredNotifications.length === 0 && showUnreadOnly && !selectedNotificationKind ? (
            <Text style={appStyles.body}>No quedan notificaciones sin leer.</Text>
          ) : null}
          {notifications.length > 0 && filteredNotifications.length === 0 && selectedNotificationKind ? (
            <Text style={appStyles.body}>No hay notificaciones para este filtro.</Text>
          ) : null}
        </View>
      </Panel>

      <Panel title="Chat privado">
        <View style={{ gap: 10 }}>
          <SocialInput value={targetPlayerId} onChangeText={setTargetPlayerId} placeholder="ID del rider" />
          <ActionButton label="Abrir chat" variant="secondary" onPress={() => void openChat()} disabled={isBusy} />
          <ActionButton label="Abrir chat de clan" variant="secondary" onPress={() => void openClanChat()} disabled={isBusy} />
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
              <SocialInput value={messageBody} onChangeText={setMessageBody} placeholder="Mensaje" />
              <ActionButton label="Enviar" onPress={() => void sendMessage()} />
            </View>
          ) : null}
        </View>
      </Panel>

      <Panel title="Compartir">
        <View style={{ gap: 10 }}>
          <SocialInput value={shareActivityId} onChangeText={setShareActivityId} placeholder="ID de actividad" />
          <ActionButton label="Compartir ruta" variant="secondary" onPress={() => void shareActivity()} />
          <SocialInput value={shareH3Index} onChangeText={setShareH3Index} placeholder="H3 conquistado" />
          <ActionButton label="Compartir conquista" variant="secondary" onPress={() => void shareConquest()} />
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
                <ActionButton label={`Like ${post.like_count}`} variant="secondary" onPress={() => void like(post.id)} />
                <ActionButton label={`Comentar ${post.comment_count}`} variant="secondary" onPress={() => void comment(post.id)} />
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
}

function SocialInput({ value, onChangeText, placeholder }: SocialInputProps) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.faint}
      style={{
        minHeight: 46,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        color: colors.text,
        paddingHorizontal: 12
      }}
    />
  );
}

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
