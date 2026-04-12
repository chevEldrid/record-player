import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Link, Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AppCard } from '@/components/AppCard';
import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import {
  APP_NAME,
  DRIVE_ROOT_NAME,
  getGoogleClientId,
  getGoogleCloudProjectNumber,
  getGooglePickerApiKey,
  GOOGLE_DISCOVERY,
} from '@/constants/config';
import { useAuth } from '@/contexts/AuthContext';
import type { LibraryConfig } from '@/domain/models';
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

export default function IndexScreen() {
  const router = useRouter();
  const clientId = getGoogleClientId();
  const pickerApiKey = getGooglePickerApiKey();
  const pickerAppId = getGoogleCloudProjectNumber();
  const redirectUri = AuthSession.makeRedirectUri({
    preferLocalhost: true,
  });
  const { finishSignIn, status, error } = useAuth();
  const [working, setWorking] = useState(false);
  const [authError, setAuthError] = useState<string>();
  const [baseFolderName, setBaseFolderName] = useState(DRIVE_ROOT_NAME);
  const [pendingTokens, setPendingTokens] = useState<PendingTokens | null>(null);
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
      <View className="items-center gap-2.5 pt-10">
        <View className="h-[180px] w-[180px] items-center justify-center rounded-full bg-[#2B1F17]">
          <View className="h-[124px] w-[124px] items-center justify-center rounded-full border border-[#4E3B2C]">
            <View className="h-9 w-9 rounded-full bg-appAccent" />
          </View>
        </View>
        <Text className="text-[34px] font-extrabold text-appText">{APP_NAME}</Text>
        <Text className="max-w-[420px] text-center text-base leading-6 text-appMuted">
          Your Digital Memory Collection
        </Text>
      </View>

      {!signedInForSetup ? (
        <View className="mt-7 gap-4">
          {!clientId ? (
            <Text className="text-center text-sm leading-[22px] text-[#C2563D]">
              Add the Google web client ID from `.env.example` before signing in.
            </Text>
          ) : null}
          {error || authError ? (
            <Text className="text-center text-sm leading-[22px] text-[#C2563D]">
              {error ?? authError}
            </Text>
          ) : null}
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
        <AppCard className="mt-7 gap-2.5 p-5">
          <Text className="text-lg font-bold text-appText">Select your Library</Text>
          <LabeledField
            label="Base folder name"
            onChangeText={setBaseFolderName}
            placeholder={DRIVE_ROOT_NAME}
            value={baseFolderName}
          />
          <Text className="text-sm leading-[22px] text-appMuted">
            If no existing library is found, we&apos;ll make a new one.
          </Text>
          {parentFolder ? (
            <View className="gap-1.5 rounded-appMd border border-appAccent bg-appAccentSoft p-4">
              <Text className="text-sm font-bold text-appText">{parentFolder.name}</Text>
              <Text className="text-[13px] text-appMuted">
                Pershie will look here for {normalizeRootFolderName(baseFolderName)} and create it
                if needed.
              </Text>
            </View>
          ) : null}
          {!pickerApiKey || !pickerAppId ? (
            <Text className="text-center text-sm leading-[22px] text-[#C2563D]">
              Choosing a parent folder needs `EXPO_PUBLIC_GOOGLE_API_KEY` and
              `EXPO_PUBLIC_GOOGLE_CLOUD_PROJECT_NUMBER`.
            </Text>
          ) : null}
          <View className="mt-1.5 gap-2">
            <PrimaryButton
              disabled={!pickerApiKey || !pickerAppId}
              label={parentFolder ? 'Choose a different parent folder' : 'Choose parent folder'}
              onPress={chooseParentFolder}
              variant="secondary"
            />
          </View>
          <PrimaryButton
            label="Go to Library"
            loading={working}
            onPress={() =>
              finalizeSignIn({
                parentFolderId: parentFolder?.id,
                rootFolderName: normalizeRootFolderName(baseFolderName),
              })
            }
          />

          {error || authError ? (
            <Text className="text-center text-sm leading-[22px] text-[#C2563D]">
              {error ?? authError}
            </Text>
          ) : null}
        </AppCard>
      )}

      <View className="mb-7 mt-7 flex-row flex-wrap items-center justify-center gap-1.5">
        <Link className="text-[13px] font-semibold text-appAccent" href="/about">
          About
        </Link>
        <Text className="text-[13px] text-appMuted">•</Text>
        <Link className="text-[13px] font-semibold text-appAccent" href="/privacy-policy">
          Privacy Policy
        </Link>
        <Text className="text-[13px] text-appMuted">•</Text>
        <Link className="text-[13px] font-semibold text-appAccent" href="/terms-of-service">
          Terms of Service
        </Link>
      </View>
    </ScreenShell>
  );
}
