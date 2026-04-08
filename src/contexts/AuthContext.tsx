import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  fetchGoogleUser,
  isSessionExpired,
  readStoredSession,
  writeStoredSession,
} from '@/services/googleAuth';
import type { GoogleSession } from '@/domain/models';

type AuthContextValue = {
  session: GoogleSession | null;
  status: 'loading' | 'signed-out' | 'signed-in';
  error?: string;
  finishSignIn: (tokens: {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    tokenType?: string;
    expiresIn?: number;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<GoogleSession | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('loading');
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const stored = await readStoredSession();

        if (!stored) {
          if (!cancelled) {
            setStatus('signed-out');
          }
          return;
        }

        if (isSessionExpired(stored)) {
          await writeStoredSession(null);
          if (!cancelled) {
            setSession(null);
            setStatus('signed-out');
          }
          return;
        }

        if (!cancelled) {
          setSession(stored);
          setStatus('signed-in');
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : 'Failed to restore your Google session.'
          );
          setStatus('signed-out');
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      status,
      error,
      async finishSignIn(tokens) {
        const user = await fetchGoogleUser(tokens.accessToken);
        const nextSession: GoogleSession = {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          idToken: tokens.idToken,
          tokenType: tokens.tokenType,
          expiresAt: tokens.expiresIn
            ? Math.floor(Date.now() / 1000) + tokens.expiresIn
            : undefined,
          scopes: [],
          user,
        };

        await writeStoredSession(nextSession);
        setSession(nextSession);
        setStatus('signed-in');
        setError(undefined);
      },
      async signOut() {
        await writeStoredSession(null);
        setSession(null);
        setStatus('signed-out');
      },
    }),
    [error, session, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return value;
}
