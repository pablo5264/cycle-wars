import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { SessionUser } from "../../domain/models/AppModels";

export class AuthService {
  constructor(private readonly client: SupabaseClient | null) {}

  isConfigured(): boolean {
    return this.client !== null;
  }

  async currentUser(): Promise<SessionUser | null> {
    if (!this.client) {
      return {
        id: "local-rider",
        email: null,
        isAnonymous: true
      };
    }

    const { data } = await this.client.auth.getUser();
    return data.user ? this.toSessionUser(data.user) : null;
  }

  async signInAnonymously(): Promise<SessionUser> {
    if (!this.client) {
      return {
        id: "local-rider",
        email: null,
        isAnonymous: true
      };
    }

    const { data, error } = await this.client.auth.signInAnonymously();
    if (error || !data.user) {
      throw error ?? new Error("Anonymous sign-in failed.");
    }

    return this.toSessionUser(data.user);
  }

  async signInWithEmail(email: string, password: string): Promise<SessionUser> {
    if (!this.client) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw error ?? new Error("Email sign-in failed.");
    }

    return this.toSessionUser(data.user);
  }

  async signOut(): Promise<void> {
    if (this.client) {
      await this.client.auth.signOut();
    }
  }

  async accessToken(): Promise<string | null> {
    if (!this.client) {
      return null;
    }

    const { data } = await this.client.auth.getSession();
    return data.session?.access_token ?? null;
  }

  private toSessionUser(user: User): SessionUser {
    return {
      id: user.id,
      email: user.email ?? null,
      isAnonymous: user.is_anonymous ?? false
    };
  }
}
