import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071018",
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 28
  },
  header: {
    gap: 10,
    marginBottom: 28
  },
  brand: {
    color: "#39E58C",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0
  },
  rider: {
    color: "#F6FAFF",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0
  },
  subtitle: {
    color: "#A8B3C2",
    fontSize: 16,
    lineHeight: 22
  },
  panel: {
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    padding: 16
  },
  panelTitle: {
    color: "#F6FAFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  statTile: {
    width: "47%",
    minHeight: 92,
    borderRadius: 8,
    backgroundColor: "#101C27",
    padding: 14,
    justifyContent: "space-between"
  },
  statValue: {
    color: "#F6FAFF",
    fontSize: 24,
    fontWeight: "800",
    textTransform: "capitalize"
  },
  statLabel: {
    color: "#9AA7B6",
    fontSize: 13,
    fontWeight: "600"
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 16
  }
});
