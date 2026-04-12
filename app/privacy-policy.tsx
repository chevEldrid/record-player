import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/ScreenShell';
import { colors, spacing } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  return (
    <ScreenShell scroll>
      <Link href="/auth/sign-in" style={styles.backLink}>
        ←
      </Link>

      <View style={styles.section}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.meta}>Last updated: April 9, 2026</Text>
        <Text style={styles.body}>
          Pershie helps you record and organize personal-history audio. This policy
          explains what data the app handles and how that data is used.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Information Pershie accesses</Text>
        <Text style={styles.body}>
          When you sign in with Google, Pershie may access your basic Google account
          profile information, including your name, email address, profile image,
          and an authentication token needed to connect the app to your Google Drive.
        </Text>
        <Text style={styles.body}>
          Pershie also accesses the files and folders it creates or opens inside the
          Google Drive library you choose, including audio recordings, metadata,
          images, and folder structure used to organize your library.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>How information is used</Text>
        <Text style={styles.body}>
          Pershie uses Google account access only to authenticate you and connect the
          app to your chosen Google Drive library.
        </Text>
        <Text style={styles.body}>
          Audio recordings, metadata, and images are used only to store, display,
          update, and play back the library content you manage in the app.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Storage and retention</Text>
        <Text style={styles.body}>
          Pershie is designed so your library content lives primarily in your own
          Google Drive. The web app may also store cached library data and session
          details in your browser so the app can reopen faster and remain signed in.
        </Text>
        <Text style={styles.body}>
          Pershie does not use a separate application database to store your library
          contents.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Sharing</Text>
        <Text style={styles.body}>
          Pershie does not sell your personal information. Data handled by the app is
          not shared with third parties except as needed to operate through Google
          services that you authorize, such as Google Sign-In and Google Drive.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Your choices</Text>
        <Text style={styles.body}>
          You can stop using Pershie at any time, revoke the app’s Google access from
          your Google account settings, or delete files from the Google Drive library
          you selected. Deleting Pershie does not delete your saved recordings.
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
  meta: {
    color: colors.textMuted,
    fontSize: 13,
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
});
