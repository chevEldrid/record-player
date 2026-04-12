import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Link, Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

function ModeCard({
  active,
  title,
  body,
  onPress,
}: {
  active: boolean;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.modeCard, active && styles.modeCardActive]}>
      <Text style={styles.modeTitle}>{title}</Text>
      <Text style={styles.modeBody}>{body}</Text>
    </Pressable>
  );
}

export default function SignInScreen() {
  const router = useRouter();
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
  const [parentFolder, setParentFolder] = useState<PickedFolder | null>(null);

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

    if (response.type === 'success' && response.params.access_token) {
      setPendingTokens({
        accessToken: response.params.access_token,
        idToken: response.params.id_token,
        tokenType: response.params.token_type,
        expiresIn: response.params.expires_in
          ? Number(response.params.expires_in)
          : undefined,
      });
      setPickedFolder(null);
      setParentFolder(null);
      setAuthError(undefined);
      return;
    }

    if (response.type === 'error') {
      setAuthError(response.error?.message ?? 'Google sign-in did not complete.');
    }
  }, [response]);

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

  async function openPicker() {
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

  async function chooseParentFolder() {
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

      if (!folder) {
        return;
      }

      setParentFolder(folder);
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

  const signedInForSetup = Boolean(pendingTokens);

  return (
    <ScreenShell padded scroll>
      <View style={styles.hero}>
        <View style={styles.discOuter}>
          <View style={styles.discInner}>
            <View style={styles.discCenter} />
          </View>
        </View>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.body}>
          Your Digital Memory Collection
        </Text>
      </View>

      {!signedInForSetup ? (
        <View style={styles.signInSection}>
          {!clientId ? (
            <Text style={styles.error}>
              Add the Google web client ID from `.env.example` before signing in.
            </Text>
          ) : null}
          {error || authError ? <Text style={styles.error}>{error ?? authError}</Text> : null}
          <PrimaryButton
            disabled={!clientId}
            label={working ? 'Signing in...' : 'Sign in with Google'}
            loading={working}
            onPress={() => {
              setAuthError(undefined);
              setWorking(true);
              promptAsync().finally(() => {
                setWorking(false);
              });
            }}
          />
          <PrimaryButton
            label="Open Recorder"
            onPress={() => router.push('/offline-record')}
            variant="secondary"
          />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Choose your Experience</Text>
          <View style={styles.modeRow}>
            <ModeCard
              active={setupMode === 'create'}
              title="Create new"
              body="Creates a new library in your Google Drive"
              onPress={() => {
                setSetupMode('create');
                setPickedFolder(null);
                setAuthError(undefined);
              }}
            />
            <ModeCard
              active={setupMode === 'import'}
              title="Open existing"
              body="Select an existing Pershie library"
              onPress={() => {
                setSetupMode('import');
                setAuthError(undefined);
              }}
            />
          </View>

          {setupMode === 'create' ? (
            <>
              <LabeledField
                label="Base folder name"
                onChangeText={setBaseFolderName}
                placeholder={DRIVE_ROOT_NAME}
                value={baseFolderName}
              />
              {parentFolder ? (
                <View style={styles.libraryOption}>
                  <Text style={styles.libraryOptionTitle}>{parentFolder.name}</Text>
                  <Text style={styles.libraryOptionBody}>
                    New library will be created here as {normalizeRootFolderName(baseFolderName)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.cardBody}>
                  By default Pershie creates the library at the top level of Drive. You can
                  also choose an existing parent folder first.
                </Text>
              )}
              <View style={styles.actionStack}>
                <PrimaryButton
                  disabled={!pickerApiKey || !pickerAppId}
                  label={parentFolder ? 'Choose a different parent folder' : 'Choose parent folder'}
                  onPress={chooseParentFolder}
                  variant="secondary"
                />
              </View>
              <PrimaryButton
                label="Create new library"
                loading={working}
                onPress={() =>
                  finalizeSignIn({
                    parentFolderId: parentFolder?.id,
                    rootFolderName: normalizeRootFolderName(baseFolderName),
                  })
                }
              />
            </>
          ) : (
            <>
              {!pickerApiKey || !pickerAppId ? (
                <Text style={styles.error}>
                  Import mode needs `EXPO_PUBLIC_GOOGLE_API_KEY` and
                  `EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER`.
                </Text>
              ) : null}
              {pickedFolder ? (
                <View style={styles.libraryOption}>
                  <Text style={styles.libraryOptionTitle}>{pickedFolder.name}</Text>
                  <Text style={styles.libraryOptionBody}>
                    {pickedFolder.name}/{DRIVE_ALBUMS_FOLDER_NAME}
                  </Text>
                </View>
              ) : (
                <Text style={styles.cardBody}>
                  Choose the existing base folder you want Pershie to reconnect to.
                </Text>
              )}
              <View style={styles.actionStack}>
                <PrimaryButton
                  disabled={!pickerApiKey || !pickerAppId}
                  label={pickedFolder ? 'Use selected folder' : 'Open Google Picker'}
                  loading={working}
                  onPress={() => {
                    if (pickedFolder) {
                      finalizeSignIn({
                        rootFolderId: pickedFolder.id,
                        rootFolderName: pickedFolder.name,
                        parentFolderId: undefined,
                      });
                      return;
                    }

                    openPicker();
                  }}
                />
                <PrimaryButton
                  label={pickedFolder ? 'Choose a different folder' : 'Create a new library instead'}
                  onPress={() => {
                    if (pickedFolder) {
                      openPicker();
                      return;
                    }

                    setSetupMode('create');
                    setAuthError(undefined);
                  }}
                  variant="secondary"
                />
              </View>
            </>
          )}

          {error || authError ? <Text style={styles.error}>{error ?? authError}</Text> : null}
        </View>
      )}

      <View style={styles.legalLinks}>
        <Link href="/about" style={styles.legalLink}>
          About
        </Link>
        <Text style={styles.legalDivider}>•</Text>
        <Link href="/privacy-policy" style={styles.legalLink}>
          Privacy Policy
        </Link>
        <Text style={styles.legalDivider}>•</Text>
        <Link href="/terms-of-service" style={styles.legalLink}>
          Terms of Service
        </Link>
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
    fontSize: 18,
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
    marginTop: spacing.xs,
  },
  legalLinks: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xl,
  },
  legalLink: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  legalDivider: {
    color: colors.textMuted,
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 20,
  },
  signInSection: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  offlineHelper: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
