import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSession } from "../../application/hooks/useSession";
import { AuthScreen } from "../screens/AuthScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RegionScreen } from "../screens/RegionScreen";
import { RideScreen } from "../screens/RideScreen";
import { colors } from "../theme/theme";

type TabKey = "map" | "territories" | "stats" | "profile";

const tabs: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "map", label: "Mapa", icon: "map" },
  { key: "territories", label: "Territorios", icon: "trophy" },
  { key: "stats", label: "Estadisticas", icon: "stats-chart" },
  { key: "profile", label: "Perfil", icon: "person-circle" }
];

export function AppNavigator() {
  const session = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("map");

  if (!session.user) {
    return <AuthScreen session={session} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ flex: 1 }}>
        {activeTab === "map" ? <RideScreen user={session.user} /> : null}
        {activeTab === "territories" ? <RegionScreen /> : null}
        {activeTab === "stats" ? <PlaceholderScreen title="Estadisticas" /> : null}
        {activeTab === "profile" ? <ProfileScreen session={session} /> : null}
      </View>

      <View
        style={{
          minHeight: 72,
          paddingHorizontal: 12,
          paddingTop: 7,
          paddingBottom: 10,
          borderTopColor: "rgba(60,64,67,0.14)",
          borderTopWidth: 1,
          backgroundColor: "#FFFFFF",
          flexDirection: "row",
          justifyContent: "space-around",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 12
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
              style={{ alignItems: "center", justifyContent: "center", minWidth: 68, gap: 3 }}
            >
              <Ionicons
                name={tab.icon}
                color={isActive ? "#1A73E8" : "#5F6368"}
                size={24}
              />
              {isActive ? (
                <Text style={{ color: "#1A73E8", fontSize: 11, fontWeight: "700" }}>
                  {tab.label}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>{title}</Text>
      <Text style={{ color: colors.muted, marginTop: 8 }}>Pantalla en construccion</Text>
    </View>
  );
}