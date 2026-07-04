import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { login as loginRequest, register as registerRequest } from "@/api/auth";
import { getMe } from "@/api/user";
import {
  ApiError,
  clearTokens,
  getAccessToken,
  hydrateTokens,
  setTokens,
} from "@/lib/api-client";
import type { UserResponse } from "@/lib/types";

export type User = UserResponse;

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  /** Completes a sign-in when tokens were obtained out-of-band (OAuth2). */
  signInWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Splits a "Full Name" field into the first/last names the API requires. */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

function messageFromError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On launch: restore tokens and, if present, re-fetch the user profile.
  useEffect(() => {
    (async () => {
      try {
        await hydrateTokens();
        if (getAccessToken()) {
          const me = await getMe();
          setUser(me);
        }
      } catch {
        // Token invalid/expired or server unreachable — start signed out.
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const res = await loginRequest(email.trim(), password);
      await setTokens(res.access_token, res.refresh_token);
      setUser(res.user);
    } catch (err) {
      const message = messageFromError(err, "Sign in failed");
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      setError(null);
      try {
        const { firstName, lastName } = splitName(fullName);
        await registerRequest({
          firstName,
          lastName,
          email: email.trim(),
          password,
        });
        // Registration returns no tokens, so authenticate to start the session.
        const res = await loginRequest(email.trim(), password);
        await setTokens(res.access_token, res.refresh_token);
        setUser(res.user);
      } catch (err) {
        const message = messageFromError(err, "Sign up failed");
        setError(message);
        throw new Error(message);
      }
    },
    [],
  );

  const signInWithTokens = useCallback(
    async (accessToken: string, refreshToken: string) => {
      setError(null);
      await setTokens(accessToken, refreshToken);
      const me = await getMe();
      setUser(me);
    },
    [],
  );

  const signOut = useCallback(async () => {
    setError(null);
    await clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await getMe();
    setUser(me);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isSignedIn: !!user,
      signUp,
      signIn,
      signInWithTokens,
      signOut,
      refreshUser,
      setUser,
      error,
      clearError: () => setError(null),
    }),
    [user, isLoading, error, signIn, signUp, signInWithTokens, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
