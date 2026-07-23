import { Text, TouchableOpacity, View } from "react-native";
import type { TerritoryFeature } from "../../domain/models/MapModels";
import { colors } from "../theme/theme";

interface FallbackHexGridProps {
  features: TerritoryFeature[];
  selectedH3Index: string | null;
  onSelect: (feature: TerritoryFeature) => void;
}

export function FallbackHexGrid({ features, selectedH3Index, onSelect }: FallbackHexGridProps) {
  const visible = features.slice(0, 54);

  return (
    <View
      style={{
        height: 330,
        borderRadius: 8,
        backgroundColor: "#0E1A24",
        overflow: "hidden",
        borderColor: colors.border,
        borderWidth: 1,
        padding: 8
      }}
    >
      <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
        {visible.map((feature, index) => {
          const isSelected = feature.properties.h3Index === selectedH3Index;
          return (
            <TouchableOpacity
              key={feature.properties.h3Index}
              activeOpacity={0.8}
              onPress={() => onSelect(feature)}
              style={{
                width: "16.66%",
                height: "16.66%",
                alignItems: "center",
                justifyContent: "center",
                paddingTop: index % 2 === 0 ? 0 : 12
              }}
            >
              <View
                style={{
                  width: isSelected ? 34 : 30,
                  height: isSelected ? 30 : 26,
                  backgroundColor: feature.properties.fillColor,
                  opacity: feature.properties.fillOpacity + 0.22,
                  transform: [{ rotate: "30deg" }],
                  borderRadius: 5,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: feature.properties.strokeColor
                }}
              />
              {feature.properties.shieldSecondsRemaining > 0 ? (
                <View
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 8,
                    width: 7,
                    height: 7,
                    borderRadius: 7,
                    backgroundColor: colors.cyan
                  }}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text
        style={{
          position: "absolute",
          left: 12,
          bottom: 10,
          color: colors.faint,
          fontSize: 11,
          fontWeight: "700"
        }}
      >
        MapLibre fallback - H3 overlay activo
      </Text>
    </View>
  );
}
