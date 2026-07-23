import { View } from "react-native";
import type { DimensionValue } from "react-native";
import { colors } from "../theme/theme";

interface ProgressBarProps {
  value: number;
  color?: string;
}

export function ProgressBar({ value, color = colors.green }: ProgressBarProps) {
  const width = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` as DimensionValue;

  return (
    <View
      style={{
        height: 8,
        borderRadius: 8,
        backgroundColor: "#203140",
        overflow: "hidden"
      }}
    >
      <View
        style={{
          width,
          height: "100%",
          backgroundColor: color,
          borderRadius: 8
        }}
      />
    </View>
  );
}
