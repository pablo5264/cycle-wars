import { createContext, useContext } from "react";
import type { AppContainer } from "../../infrastructure/di/container";

export const AppContext = createContext<AppContainer | null>(null);

export function useAppContainer(): AppContainer {
  const container = useContext(AppContext);
  if (!container) {
    throw new Error("AppContainer is missing.");
  }

  return container;
}
