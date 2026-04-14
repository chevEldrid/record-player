import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';

import { GOOGLE_DISCOVERY, getGoogleClientId } from '@/constants/config';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { DrivePermissionDialog } from '@/components/DrivePermissionDialog';
import {
  googleScopes,
  isGoogleAuthCanceled,
  logGoogleAuthCancellation,
} from '@/services/googleAuth';

WebBrowser.maybeCompleteAuthSession();

export function DrivePermissionGate() {
  const clientId = getGoogleClientId();
  const redirectUri = AuthSession.makeRedirectUri({
    preferLocalhost: true,
  });
  const { finishSignIn, session, signOut } = useAuth();
  const { clearDriveReauthState, error, requiresDriveReauth } = useAppData();
  const [reauthorizing, setReauthorizing] = useState(false);
  const [reauthError, setReauthError] = useState<string>();
  const handledResponseKey = useRef<string | undefined>(undefined);

  const [, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId ?? 'missing-client-id',
      responseType: AuthSession.ResponseType.Token,
      scopes: googleScopes,
      redirectUri,
      usePKCE: false,
      extraParams: {
        prompt: 'consent',
      },
    },
    GOOGLE_DISCOVERY
  );

  useEffect(() => {
    if (!response) {
      return;
    }

    const responseKey =
      response.type === 'success'
        ? JSON.stringify({
            type: response.type,
            accessToken: response.params.access_token,
          })
        : response.type === 'error'
          ? JSON.stringify({
              type: response.type,
              error: response.params.error,
              message: response.error?.message,
            })
          : response.type;

    if (handledResponseKey.current === responseKey) {
      return;
    }

    if (response.type === 'success' && response.params.access_token) {
      handledResponseKey.current = responseKey;
      finishSignIn({
        accessToken: response.params.access_token,
        idToken: response.params.id_token,
        tokenType: response.params.token_type,
        expiresIn: response.params.expires_in
          ? Number(response.params.expires_in)
          : undefined,
        libraryConfig: session?.libraryConfig,
      })
        .then(() => {
          clearDriveReauthState();
          setReauthError(undefined);
        })
        .catch((authError) => {
          setReauthError(
            authError instanceof Error
              ? authError.message
              : 'Google sign-in did not complete.'
          );
        })
        .finally(() => {
          setReauthorizing(false);
        });
      return;
    }

    if (response.type === 'error') {
      handledResponseKey.current = responseKey;
      setReauthorizing(false);
      if (
        isGoogleAuthCanceled({
          code: response.params.error,
          message: response.error?.message,
        })
      ) {
        logGoogleAuthCancellation('reauthorize', {
          code: response.params.error,
          message: response.error?.message,
        });
        setReauthError(undefined);
        return;
      }

      setReauthError(response.error?.message ?? 'Google sign-in did not complete.');
      return;
    }

    handledResponseKey.current = responseKey;
    setReauthorizing(false);
  }, [clearDriveReauthState, finishSignIn, response, session?.libraryConfig]);

  return (
    <DrivePermissionDialog
      error={reauthError ?? error}
      onReauthorize={() => {
        handledResponseKey.current = undefined;
        setReauthError(undefined);
        setReauthorizing(true);
        promptAsync().catch(() => {
          setReauthorizing(false);
          setReauthError('Google sign-in did not complete.');
        });
      }}
      onSignOut={() => {
        clearDriveReauthState();
        setReauthError(undefined);
        signOut();
      }}
      open={requiresDriveReauth}
      reauthorizing={reauthorizing}
    />
  );
}
