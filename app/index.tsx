import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useAuth } from '@/contexts/AuthContext';
import { usePwa } from '@/contexts/PwaContext';
import { colors, radii, spacing } from '@/constants/theme';

export default function IndexScreen() {
  const router = useRouter();
  const { status } = useAuth();
  const { canInstall, install, isInstalled } = usePwa();

  if (status === 'loading') {
    return null;
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
        <Text style={styles.title}>Pershie</Text>
        <Text style={styles.body}>
          A warm, browser-based recorder for personal-history audio. Use it immediately, then sign
          in later if you want your recordings synced into Google Drive.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Open Recorder" onPress={() => router.push('/offline-record')} />
        {canInstall ? (
          <PrimaryButton label="Install App" onPress={() => void install()} variant="secondary" />
        ) : null}
        <PrimaryButton
          label="Sign In to Sync"
          onPress={() => router.push('/auth/sign-in')}
          variant={canInstall ? 'primary' : 'secondary'}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Use it your way</Text>
        <Text style={styles.cardBody}>
          Record without an account, keep files on this device, and upload later when you have a
          connection.
        </Text>
        <Text style={styles.cardBody}>
          Or sign in with Google and organize everything directly into albums in your Drive.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {isInstalled ? 'Installed on this device' : 'Installable as an app'}
        </Text>
        <Text style={styles.cardBody}>
          Pershie can launch in its own standalone window, keep the recorder available if your
          connection drops, and let people download recordings even while offline.
        </Text>
        {!canInstall && !isInstalled ? (
          <Text style={styles.cardBody}>
            If your browser does not show an install button, open the browser menu and choose Add
            to Home Screen or Install App.
          </Text>
        ) : null}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  discOuter: {
    alignItems: 'center',
    backgroundColor: '#2C2520',
    borderRadius: 999,
    height: 164,
    justifyContent: 'center',
    width: 164,
  },
  discInner: {
    alignItems: 'center',
    backgroundColor: '#40342B',
    borderRadius: 999,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  discCenter: {
    backgroundColor: '#F2E6D9',
    borderRadius: 999,
    height: 28,
    width: 28,
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
    maxWidth: 520,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
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
    fontSize: 16,
    fontWeight: '800',
  },
  cardBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});
