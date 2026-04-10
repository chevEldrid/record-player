import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { DRIVE_ROOT_NAME } from '@/constants/config';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

export default function UserScreen() {
  const { session, signOut } = useAuth();

  return (
    <ScreenShell bottomNav scroll>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Text style={styles.accountText}>
          {session?.user.email ?? session?.user.name ?? 'Signed in'}
        </Text>
        <PrimaryButton label="Sign out" onPress={signOut} variant="danger" />
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Current library path</Text>
        <Text style={styles.pathText}>
          drive://{session?.libraryConfig?.rootFolderName ?? DRIVE_ROOT_NAME}/albums
        </Text>
        <Text style={styles.helper}>
          To edit an existing library path or name, update in your personal google drive and re-sign in.
        </Text>
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
