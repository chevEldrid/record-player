import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import {
  APP_NAME,
  DRIVE_ALBUMS_FOLDER_NAME,
  DRIVE_ROOT_NAME,
  getGoogleClientId,
  getGoogleCloudProjectNumber,
  getGooglePickerApiKey,
  GOOGLE_DISCOVERY,
} from '@/constants/config';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import type { LibraryConfig } from '@/domain/models';
import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { googleScopes } from '@/services/googleAuth';
import { openGoogleFolderPicker, type PickedFolder } from '@/services/googlePicker';

WebBrowser.maybeCompleteAuthSession();

type PendingTokens = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType?: string;
  expiresIn?: number;
};

function normalizeRootFolderName(value: string) {
  return value.trim() || DRIVE_ROOT_NAME;
}

export default function SignInScreen() {
  const clientId = getGoogleClientId();
  const pickerApiKey = getGooglePickerApiKey();
  const pickerAppId = getGoogleCloudProjectNumber();
  const redirectUri = AuthSession.makeRedirectUri({
    path: 'auth/sign-in',
    preferLocalhost: true,
  });
  const { finishSignIn, status, error } = useAuth();
  const [working, setWorking] = useState(false);
  const [authError, setAuthError] = useState<string>();
  const [setupMode, setSetupMode] = useState<'create' | 'import'>('create');
  const [baseFolderName, setBaseFolderName] = useState(DRIVE_ROOT_NAME);
  const [pendingTokens, setPendingTokens] = useState<PendingTokens | null>(null);
  const [pickedFolder, setPickedFolder] = useState<PickedFolder | null>(null);

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

  const authTokens = useMemo<PendingTokens | null>(() => {
    if (response?.type !== 'success' || !response.params.access_token) {
      return null;
    }

    return {
      accessToken: response.params.access_token,
      idToken: response.params.id_token,
      tokenType: response.params.token_type,
      expiresIn: response.params.expires_in
        ? Number(response.params.expires_in)
        : undefined,
    };
  }, [response]);

  useEffect(() => {
    if (!clientId || !authTokens) {
      return;
    }

    let cancelled = false;

    async function completeSignIn() {
      if (!authTokens) {
        return;
      }

      const tokens = authTokens;
      setWorking(true);

      try {
        if (setupMode === 'import') {
          if (!pickerApiKey || !pickerAppId) {
            throw new Error(
              'Import with Google Picker requires EXPO_PUBLIC_GOOGLE_API_KEY and EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER.'
            );
          }

          const folder = await openGoogleFolderPicker({
            accessToken: tokens.accessToken,
            apiKey: pickerApiKey,
            appId: pickerAppId,
          });

          if (cancelled) {
            return;
          }

          setPendingTokens(tokens);
          setPickedFolder(folder);
          setAuthError(
            folder
              ? undefined
              : 'No folder was selected. You can reopen Google Picker or create a new library instead.'
          );
          return;
        }

        await finishSignIn({
          ...tokens,
          libraryConfig: {
            rootFolderName: normalizeRootFolderName(baseFolderName),
          },
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
  }, [authTokens, baseFolderName, clientId, finishSignIn, pickerApiKey, pickerAppId, setupMode]);

  async function finalizeSignIn(libraryConfig: LibraryConfig) {
    if (!pendingTokens) {
      return;
    }

    setWorking(true);
    setAuthError(undefined);
    try {
      await finishSignIn({
        ...pendingTokens,
        libraryConfig,
      });
    } catch (signInError) {
      setAuthError(
        signInError instanceof Error
          ? signInError.message
          : 'Google sign-in did not complete.'
      );
    } finally {
      setWorking(false);
    }
  }

  async function reopenPicker() {
    if (!pendingTokens || !pickerApiKey || !pickerAppId) {
      return;
    }

    setWorking(true);
    setAuthError(undefined);
    try {
      const folder = await openGoogleFolderPicker({
        accessToken: pendingTokens.accessToken,
        apiKey: pickerApiKey,
        appId: pickerAppId,
      });
      setPickedFolder(folder);
      if (!folder) {
        setAuthError(
          'No folder was selected. You can reopen Google Picker or create a new library instead.'
        );
      }
    } catch (pickerError) {
      setAuthError(
        pickerError instanceof Error ? pickerError.message : 'Failed to open Google Picker.'
      );
    } finally {
      setWorking(false);
    }
  }

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
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.body}>
          Capture spoken memories as tracks inside albums for the people who matter
          most, with Google Drive as the source of truth.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How Pershie stores your library</Text>
        <Text style={styles.cardBody}>
          Pershie signs in with Google, saves files into your Drive, and keeps the
          browser app lean. You can create a fresh base folder or reconnect to an
          existing library before entering the app.
        </Text>

        <Text style={styles.cardTitle}>Drive folder structure</Text>
        <Text style={styles.cardBodyMono}>
          {normalizeRootFolderName(baseFolderName)}
          {'\n'}  {DRIVE_ALBUMS_FOLDER_NAME}
          {'\n'}    {'{person-slug-id}'}
          {'\n'}      metadata.json
          {'\n'}      recordings/
          {'\n'}        {'{timestamp-title}'}.m4a
          {'\n'}        {'{timestamp-title}'}.json
          {'\n'}      attachments/
        </Text>

        <Text style={styles.cardTitle}>Choose your setup</Text>
        <View style={styles.modeRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSetupMode('create');
              setPendingTokens(null);
              setPickedFolder(null);
              setAuthError(undefined);
            }}
            style={[styles.modeCard, setupMode === 'create' && styles.modeCardActive]}>
            <Text style={styles.modeTitle}>Create new library</Text>
            <Text style={styles.modeBody}>
              Pick the top-level Drive folder name you want Pershie to manage.
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSetupMode('import');
              setPendingTokens(null);
              setPickedFolder(null);
              setAuthError(undefined);
            }}
            style={[styles.modeCard, setupMode === 'import' && styles.modeCardActive]}>
            <Text style={styles.modeTitle}>Import with Google Picker</Text>
            <Text style={styles.modeBody}>
              Sign in, then choose the Drive folder you want Pershie to use.
            </Text>
          </Pressable>
        </View>

        {setupMode === 'create' ? (
          <LabeledField
            helper="This becomes the top-level folder in Google Drive. It does not have to be named Pershie."
            label="Base folder name"
            onChangeText={setBaseFolderName}
            placeholder={DRIVE_ROOT_NAME}
            value={baseFolderName}
          />
        ) : (
          <Text style={styles.cardBody}>
            Google Picker lets users explicitly choose an existing Drive folder,
            which is more reliable than trying to discover folders with limited
            Drive scopes.
          </Text>
        )}
      </View>

      {pendingTokens ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Imported folder</Text>
          {pickedFolder ? (
            <View style={styles.libraryOption}>
              <Text style={styles.libraryOptionTitle}>{pickedFolder.name}</Text>
              <Text style={styles.libraryOptionBody}>
                {pickedFolder.name}/{DRIVE_ALBUMS_FOLDER_NAME}
              </Text>
            </View>
          ) : (
            <Text style={styles.cardBody}>
              Pick a Drive folder to reconnect an existing library, or create a new
              one instead.
            </Text>
          )}

          <View style={styles.actionStack}>
            <PrimaryButton
              label={pickedFolder ? 'Use selected folder' : 'Open Google Picker'}
              loading={working}
              disabled={!pickedFolder && (!pickerApiKey || !pickerAppId)}
              onPress={() => {
                if (pickedFolder) {
                  finalizeSignIn({
                    rootFolderId: pickedFolder.id,
                    rootFolderName: pickedFolder.name,
                  });
                  return;
                }

                reopenPicker();
              }}
            />
            <PrimaryButton
              label={pickedFolder ? 'Choose a different folder' : 'Create a new library instead'}
              onPress={() => {
                if (pickedFolder) {
                  reopenPicker();
                  return;
                }

                finalizeSignIn({
                  rootFolderName: normalizeRootFolderName(baseFolderName),
                });
              }}
              variant="secondary"
            />
          </View>
        </View>
      ) : null}

      <View style={styles.signInSection}>
        {!clientId ? (
          <Text style={styles.error}>
            Add the Google web client ID from `.env.example` before signing in.
          </Text>
        ) : null}
        {setupMode === 'import' && (!pickerApiKey || !pickerAppId) ? (
          <Text style={styles.error}>
            Import mode also needs `EXPO_PUBLIC_GOOGLE_API_KEY` and
            `EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER`.
          </Text>
        ) : null}
        {error || authError ? <Text style={styles.error}>{error ?? authError}</Text> : null}
        {!pendingTokens ? (
          <PrimaryButton
            disabled={!clientId || (setupMode === 'import' && (!pickerApiKey || !pickerAppId))}
            label={
              working
                ? 'Signing in...'
                : setupMode === 'import'
                  ? 'Sign in to open Google Picker'
                  : 'Continue with Google'
            }
            loading={working}
            onPress={() => {
              setAuthError(undefined);
              promptAsync();
            }}
          />
        ) : null}
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
    maxWidth: 420,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xl,
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
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 22,
    padding: spacing.md,
  },
  modeRow: {
    gap: spacing.sm,
  },
  modeCard: {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  modeCardActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  modeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modeBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  libraryOption: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  libraryOptionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  libraryOptionBody: {
    color: colors.textMuted,
    fontSize: 13,
  },
  actionStack: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  signInSection: {
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
});
