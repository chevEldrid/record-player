import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import { getGoogleClientId, GOOGLE_DISCOVERY } from '@/constants/config';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { exchangeGoogleCode, googleScopes } from '@/services/googleAuth';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const clientId = getGoogleClientId();
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'recordplayer',
    path: 'oauth',
  });
  const { finishSignIn, status, error } = useAuth();
  const [working, setWorking] = useState(false);
  const [authError, setAuthError] = useState<string>();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId ?? 'missing-client-id',
      responseType: AuthSession.ResponseType.Code,
      scopes: googleScopes,
      redirectUri,
      usePKCE: true,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
    GOOGLE_DISCOVERY
  );

  useEffect(() => {
    const code = response?.type === 'success' ? response.params.code : undefined;
    const codeVerifier = request?.codeVerifier;

    if (!code || !clientId || !codeVerifier) {
      return;
    }
    const resolvedClientId = clientId;
    const resolvedCode = code;
    const resolvedCodeVerifier = codeVerifier;

    let cancelled = false;

    async function completeSignIn() {
      setWorking(true);
      try {
        const tokenResponse = await exchangeGoogleCode({
          clientId: resolvedClientId,
          code: resolvedCode,
          redirectUri,
          codeVerifier: resolvedCodeVerifier,
        });
        const accessToken = tokenResponse.accessToken;
        if (!accessToken) {
          throw new Error('Google sign-in did not return an access token.');
        }

        if (cancelled) {
          return;
        }

        await finishSignIn({
          accessToken,
          refreshToken: tokenResponse.refreshToken,
          idToken: tokenResponse.idToken,
          tokenType: tokenResponse.tokenType,
          expiresIn: tokenResponse.expiresIn,
        });
      } catch (signInError) {
        if (!cancelled) {
          setAuthError(
            signInError instanceof Error
              ? signInError.message
              : 'Google sign-in did not complete.'
          );
        }
      } finally {
        if (!cancelled) {
          setWorking(false);
        }
      }
    }

    completeSignIn();

    return () => {
      cancelled = true;
    };
  }, [clientId, finishSignIn, redirectUri, request, response]);

  if (status === 'signed-in') {
    return <Redirect href="/(app)/library" />;
  }

  return (
    <ScreenShell padded scroll>
      <View style={styles.hero}>
        <View style={styles.discOuter}>
          <View style={styles.discInner}>
            <View style={styles.discCenter} />
          </View>
        </View>
        <Text style={styles.eyebrow}>Personal histories, kept close</Text>
        <Text style={styles.title}>Record Player</Text>
        <Text style={styles.body}>
          Capture spoken memories as tracks inside albums for the people who matter
          most, with Google Drive as the source of truth.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>MVP summary</Text>
        <Text style={styles.cardBody}>
          Record Player is a warm, minimal mobile app where each person becomes an
          album and every audio memory becomes a track. The first version focuses on
          Google sign-in, Drive-backed storage, lean offline recording, and resilient
          metadata editing without adding a custom backend.
        </Text>

        <Text style={styles.cardTitle}>Technical architecture</Text>
        <Text style={styles.cardBody}>
          Expo React Native with TypeScript and Expo Router keeps the app simple and
          mobile-first. Google OAuth runs client-side with Drive API access, album and
          track metadata live as JSON files in Drive, and a tiny local queue stores
          offline recordings until the next successful sync.
        </Text>

        <Text style={styles.cardTitle}>Assumptions and tradeoffs</Text>
        <Text style={styles.cardBody}>
          The app uses the narrower `drive.file` scope to avoid a heavier backend or
          broader Drive permissions, which means it is best at managing folders it
          created itself. Track metadata is stored as sidecar JSON beside each audio
          file instead of spreading notes and transcripts across many folders, because
          that keeps the MVP more readable and easier to repair when files change
          externally.
        </Text>

        <Text style={styles.cardTitle}>Initial folder structure</Text>
        <Text style={styles.cardBodyMono}>
          Record Player/{'\n'}  albums/{'\n'}    {'{person-slug-id}'}/{'\n'}      metadata.json
          {'\n'}      recordings/{'\n'}        {'{timestamp-title}'}.m4a{'\n'}       
          {'{timestamp-title}'}.json{'\n'}      attachments/
        </Text>
      </View>

      <View style={styles.signInSection}>
        {!clientId ? (
          <Text style={styles.error}>
            Add the Google OAuth client IDs from `.env.example` before signing in.
          </Text>
        ) : null}
        {error || authError ? <Text style={styles.error}>{error ?? authError}</Text> : null}
        <PrimaryButton
          disabled={!clientId || !request}
          label={working ? 'Signing in...' : 'Continue with Google'}
          loading={working}
          onPress={() => {
            setAuthError(undefined);
            promptAsync();
          }}
        />
        {working ? <ActivityIndicator color={colors.text} style={{ marginTop: spacing.md }} /> : null}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xxl,
  },
  discOuter: {
    alignItems: 'center',
    backgroundColor: '#2B1F17',
    borderRadius: 999,
    height: 180,
    justifyContent: 'center',
    width: 180,
  },
  discInner: {
    alignItems: 'center',
    borderColor: '#4E3B2C',
    borderRadius: 999,
    borderWidth: 1,
    height: 124,
    justifyContent: 'center',
    width: 124,
  },
  discCenter: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: 36,
    width: 36,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 360,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xxl,
    padding: spacing.lg,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  cardBodyMono: {
    color: colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  signInSection: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
