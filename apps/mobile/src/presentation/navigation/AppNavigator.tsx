import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSession } from "../../application/hooks/useSession";
import { useAppContainer } from "../../application/state/AppContext";
import { AuthScreen } from "../screens/AuthScreen";
import { ClanScreen } from "../screens/ClanScreen";
import { EventsScreen } from "../screens/EventsScreen";
import { MapScreen } from "../screens/MapScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RegionScreen } from "../screens/RegionScreen";
import { RideScreen } from "../screens/RideScreen";
import { ShopScreen } from "../screens/ShopScreen";
import { SocialScreen } from "../screens/SocialScreen";
import { colors } from "../theme/theme";

type TabKey = "map" | "ride" | "regions" | "events" | "social" | "profile" | "clan" | "shop";

const tabs: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "map", label: "Mapa", icon: "map" },
  { key: "ride", label: "Ruta", icon: "radio" },
  { key: "regions", label: "Zonas", icon: "flag" },
  { key: "events", label: "Eventos", icon: "trophy" },
  { key: "social", label: "Social", icon: "chatbubbles" },
  { key: "profile", label: "Perfil", icon: "person-circle" },
  { key: "clan", label: "Clan", icon: "shield" },
  { key: "shop", label: "Tienda", icon: "bag" }
];

export function AppNavigator() {
  const session = useSession();
  const { api } = useAppContainer();
  const [activeTab, setActiveTab] = useState<TabKey>("map");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (!session.user || !api.isConfigured()) {
      setUnreadNotificationCount(0);
      return;
    }

    let isMounted = true;
    api
      .getNotifications()
      .then((notifications) => {
        if (isMounted) {
          setUnreadNotificationCount(notifications.filter((item) => item.read_at === null).length);
        }
      })
      .catch(() => setUnreadNotificationCount(0));

    return () => {
      isMounted = false;
    };
  }, [activeTab, api, session.user]);

  if (!session.user) {
    return <AuthScreen session={session} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        {activeTab === "map" ? <MapScreen /> : null}
        {activeTab === "ride" ? <RideScreen user={session.user} /> : null}
        {activeTab === "regions" ? <RegionScreen /> : null}
        {activeTab === "events" ? <EventsScreen /> : null}
        {activeTab === "social" ? <SocialScreen /> : null}
        {activeTab === "profile" ? <ProfileScreen session={session} /> : null}
        {activeTab === "clan" ? <ClanScreen /> : null}
        {activeTab === "shop" ? <ShopScreen /> : null}
      </View>

      <View
        style={{
          minHeight: 74,
          paddingHorizontal: 8,
          paddingTop: 8,
          paddingBottom: 12,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          backgroundColor: "#09141E",
          flexDirection: "row",
          justifyContent: "space-around"
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              onPress={() => setActiveTab(tab.key)}
              style={{ alignItems: "center", justifyContent: "center", width: 43, gap: 4, position: "relative" }}
            >
              <Ionicons
                name={tab.icon}
                color={isActive ? colors.green : colors.faint}
                size={24}
              />
              {tab.key === "social" && unreadNotificationCount > 0 ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: colors.red,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4
                  }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 9,
                      fontWeight: "900"
                    }}
                  >
                    {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                  </Text>
                </View>
              ) : null}
              <Text
                style={{
                  color: isActive ? colors.green : colors.faint,
                  fontSize: 9,
                  fontWeight: "700"
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
