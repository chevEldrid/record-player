import { DRIVE_SCOPE, GOOGLE_DISCOVERY } from '@/constants/config';
import type { GoogleSession } from '@/domain/models';

const SESSION_STORAGE_KEY = 'record-player.google-session';

type StoredSession = GoogleSession;

export const googleScopes = ['openid', 'profile', 'email', DRIVE_SCOPE];

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
  const raw =
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(SESSION_STORAGE_KEY);
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
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function isSessionExpired(session?: GoogleSession | null) {
  if (!session?.expiresAt) {
    return false;
  }

  return Date.now() >= session.expiresAt * 1000 - 60_000;
}
