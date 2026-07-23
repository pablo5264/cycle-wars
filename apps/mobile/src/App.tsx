import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppContext } from "./application/state/AppContext";
import { buildContainer } from "./infrastructure/di/container";
import { AppNavigator } from "./presentation/navigation/AppNavigator";

const container = buildContainer();

export function App() {
  return (
    <SafeAreaProvider>
      <AppContext.Provider value={container}>
        <StatusBar style="light" />
        <AppNavigator />
      </AppContext.Provider>
    </SafeAreaProvider>
  );
}
