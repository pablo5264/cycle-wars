import { StyleSheet } from "react-native";
import { colors } from "./theme";

export const appStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 18,
    paddingTop: 58,
    paddingBottom: 18
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0
  },
  eyebrow: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21
  },
  panel: {
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: colors.border,
    borderWidth: 1,
    padding: 14
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  dangerButton: {
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: "#351D25",
    borderColor: "rgba(255,107,107,0.4)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  buttonTextDark: {
    color: "#062013",
    fontSize: 15,
    fontWeight: "800"
  },
  buttonTextLight: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  }
});
