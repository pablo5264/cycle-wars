import { Text, View } from "react-native";
import { colors } from "../theme/theme";

interface StatTileProps {
  label: string;
  value: string;
}

export function StatTile({ label, value }: StatTileProps) {
  return (
    <View
      style={{
        width: "47%",
        minHeight: 92,
        borderRadius: 8,
        backgroundColor: colors.surface,
        padding: 14,
        justifyContent: "space-between"
      }}
    >
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "800", textTransform: "capitalize" }}>
        {value}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}
