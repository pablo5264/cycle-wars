import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { PlayerProfileProps } from "@cycle-wars/shared";
import type { AppContainer } from "../../infrastructure/di/container";
import { StatTile } from "../components/StatTile";
import { styles } from "./homeStyles";

interface HomeScreenProps {
  dependencies: AppContainer;
}

export function HomeScreen({ dependencies }: HomeScreenProps) {
  const [profile, setProfile] = useState<PlayerProfileProps | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dependencies.getPlayerProfile
      .execute("local-rider")
      .then((player) => setProfile(player.snapshot()))
      .catch((caught: unknown) =>
        setError(caught instanceof Error ? caught.message : "Unable to load rider profile.")
      );
  }, [dependencies]);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#39E58C" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>CYCLE WARS</Text>
        <Text style={styles.rider}>{profile.displayName}</Text>
        <Text style={styles.subtitle}>Global cycling territory conquest</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Rider Command</Text>
        <View style={styles.grid}>
          <StatTile label="Level" value={String(profile.level)} />
          <StatTile label="League" value={profile.league.replace("_", " ")} />
          <StatTile label="Territories" value={String(profile.stats.territories)} />
          <StatTile label="Conquests" value={String(profile.stats.conquests)} />
        </View>
      </View>
    </View>
  );
}
