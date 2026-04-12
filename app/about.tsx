import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/ScreenShell';
import {
  APP_NAME,
  DRIVE_ALBUMS_FOLDER_NAME,
  DRIVE_ROOT_NAME,
} from '@/constants/config';
import { colors, spacing } from '@/constants/theme';

export default function AboutScreen() {
  return (
    <ScreenShell scroll>
      <Link href="/auth/sign-in" style={styles.backLink}>
        ←
      </Link>

      <View style={styles.section}>
        <Text style={styles.title}>About {APP_NAME}</Text>
        <Text style={styles.body}>
          Pershie is an app for recording and organizing human histories. Each
          person is represented as an album, and each recording is stored as a track.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>How it works</Text>
        <Text style={styles.body}>
          After signing in with Google and pointing Pershie to your personal library, Pershie takes care of the rest.
          All recordings are saved on your drive with appropriate metadata and can be deleted, edited, updated, or imported completely outside of this application with no issues.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Library structure</Text>
        <Text style={styles.mono}>
          {DRIVE_ROOT_NAME}
          {'\n'}  {DRIVE_ALBUMS_FOLDER_NAME}
          {'\n'}    {'{person-slug-id}'}
          {'\n'}      metadata.json
          {'\n'}      recordings/
          {'\n'}        {'{track-title-id}'}.m4a
          {'\n'}        {'{track-title-id}'}.json
          {'\n'}      attachments/
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>What Pershie stores</Text>
        <Text style={styles.body}>
          Nothing - you keep all your own data.
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backLink: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 32,
    marginBottom: spacing.lg,
  },
  section: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  heading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  mono: {
    backgroundColor: colors.backgroundElevated,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 22,
    padding: spacing.md,
  },
});
