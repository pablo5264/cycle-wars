import type { PropsWithChildren } from "react";
import { Text, View } from "react-native";
import { appStyles } from "../theme/styles";
import { colors } from "../theme/theme";

interface PanelProps extends PropsWithChildren {
  title?: string;
}

export function Panel({ title, children }: PanelProps) {
  return (
    <View style={appStyles.panel}>
      {title ? (
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800", marginBottom: 12 }}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
