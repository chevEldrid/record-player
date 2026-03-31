import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

import { DRIVE_SCOPE, GOOGLE_DISCOVERY } from '@/constants/config';
import type { GoogleSession } from '@/domain/models';

const SESSION_STORAGE_KEY = 'record-player.google-session';

type StoredSession = GoogleSession;

export const googleScopes = ['openid', 'profile', 'email', DRIVE_SCOPE];

export async function exchangeGoogleCode(params: {
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}) {
  return AuthSession.exchangeCodeAsync(
    {
      clientId: params.clientId,
      code: params.code,
      redirectUri: params.redirectUri,
      extraParams: params.codeVerifier ? { code_verifier: params.codeVerifier } : undefined,
    },
    GOOGLE_DISCOVERY
  );
}

export async function refreshGoogleSession(session: GoogleSession, clientId: string) {
  if (!session.refreshToken) {
    return session;
  }

  const refreshed = await AuthSession.refreshAsync(
    {
      clientId,
      refreshToken: session.refreshToken,
      scopes: googleScopes,
    },
    GOOGLE_DISCOVERY
  );

  return {
    ...session,
    accessToken: refreshed.accessToken ?? session.accessToken,
    expiresAt: refreshed.issuedAt
      ? refreshed.issuedAt + (refreshed.expiresIn ?? 0)
      : session.expiresAt,
    refreshToken: refreshed.refreshToken ?? session.refreshToken,
    tokenType: refreshed.tokenType ?? session.tokenType,
  } satisfies GoogleSession;
}

export async function fetchGoogleUser(accessToken: string) {
  const response = await fetch(GOOGLE_DISCOVERY.userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to load Google profile.');
  }

  const payload = await response.json();
  return {
    id: payload.sub as string | undefined,
    email: payload.email as string | undefined,
    name: payload.name as string | undefined,
    picture: payload.picture as string | undefined,
  };
}

export async function readStoredSession() {
  const raw = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export async function writeStoredSession(session: GoogleSession | null) {
  if (!session) {
    await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
    return;
  }

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function isSessionExpired(session?: GoogleSession | null) {
  if (!session?.expiresAt) {
    return false;
  }

  return Date.now() >= session.expiresAt * 1000 - 60_000;
}
