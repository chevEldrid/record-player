import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import {
  DRIVE_ROOT_NAME,
  getGoogleCloudProjectNumber,
  getGooglePickerApiKey,
} from '@/constants/config';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { openGoogleFolderPicker } from '@/services/googlePicker';

const steps = [
  'Sign in and choose a fresh folder or reconnect an existing Drive folder.',
  'Create one album per person you want to preserve memories for.',
  'Use Record to capture audio or upload an existing file.',
  'Open any album to review tracks and edit details later.',
];

export default function UserScreen() {
  const { session, signOut, updateLibraryConfig } = useAuth();
  const { refreshLibrary } = useAppData();
  const pickerApiKey = getGooglePickerApiKey();
  const pickerAppId = getGoogleCloudProjectNumber();
  const [baseFolderName, setBaseFolderName] = useState(
    session?.libraryConfig?.rootFolderName ?? DRIVE_ROOT_NAME
  );
  const [working, setWorking] = useState(false);

  async function saveBaseFolderName() {
    if (!session) {
      return;
    }

    setWorking(true);
    try {
      const nextName = baseFolderName.trim() || DRIVE_ROOT_NAME;
      await updateLibraryConfig({
        rootFolderName: nextName,
      });
      await refreshLibrary();
      Alert.alert('Updated', 'Your library folder preference was updated.');
    } catch (error) {
      Alert.alert(
        'Could not update folder',
        error instanceof Error ? error.message : 'Updating the folder failed.'
      );
    } finally {
      setWorking(false);
    }
  }

  async function chooseFolder() {
    if (!session?.accessToken || !pickerApiKey || !pickerAppId) {
      Alert.alert(
        'Google Picker unavailable',
        'Add the Google Picker environment variables before choosing a new Drive folder.'
      );
      return;
    }

    setWorking(true);
    try {
      const folder = await openGoogleFolderPicker({
        accessToken: session.accessToken,
        apiKey: pickerApiKey,
        appId: pickerAppId,
      });

      if (!folder) {
        return;
      }

      setBaseFolderName(folder.name);
      await updateLibraryConfig({
        rootFolderId: folder.id,
        rootFolderName: folder.name,
      });
      await refreshLibrary();
      Alert.alert('Updated', 'Pershie is now connected to the selected Drive folder.');
    } catch (error) {
      Alert.alert(
        'Could not change folder',
        error instanceof Error ? error.message : 'Changing the folder failed.'
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <ScreenShell bottomNav scroll>
      <View style={styles.hero}>
        <Text style={styles.subtitle}>
          Manage your Pershie library location, get a quick walkthrough, or sign out.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current library path</Text>
        <Text style={styles.pathText}>
          {session?.libraryConfig?.rootFolderName ?? DRIVE_ROOT_NAME}/albums
        </Text>
        <Text style={styles.helper}>
          This is the Drive folder Pershie will load when refreshing your library.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Update library path</Text>
        <LabeledField
          label="Base folder name"
          onChangeText={setBaseFolderName}
          placeholder={DRIVE_ROOT_NAME}
          value={baseFolderName}
          helper="Use this for a new top-level folder preference, or pick an existing folder from Drive."
        />
        <PrimaryButton label="Save folder name" loading={working} onPress={saveBaseFolderName} />
        <PrimaryButton
          label="Choose existing Drive folder"
          onPress={chooseFolder}
          variant="secondary"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Help</Text>
        <View style={styles.helpList}>
          {steps.map((step) => (
            <Text key={step} style={styles.helpItem}>
              {step}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.accountText}>
          {session?.user.email ?? session?.user.name ?? 'Signed in'}
        </Text>
        <PrimaryButton label="Sign out" onPress={signOut} variant="danger" />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  pathText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  helper: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  helpList: {
    gap: spacing.sm,
  },
  helpItem: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  accountText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
