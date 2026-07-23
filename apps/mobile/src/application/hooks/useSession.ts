import { useCallback, useEffect, useState } from "react";
import type { SessionUser } from "../../domain/models/AppModels";
import { useAppContainer } from "../state/AppContext";

export interface SessionState {
  user: SessionUser | null;
  isLoading: boolean;
  error: string | null;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useSession(): SessionState {
  const { auth } = useAppContainer();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUser(await auth.currentUser());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load session.");
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    void load();
  }, [load]);

  const signInAnonymously = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUser(await auth.signInAnonymously());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
  }, [auth]);

  return { user, isLoading, error, signInAnonymously, signOut };
}
