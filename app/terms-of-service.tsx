import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/ScreenShell';
import { colors, spacing } from '@/constants/theme';

export default function TermsOfServiceScreen() {
  return (
    <ScreenShell scroll>
      <Link href="/auth/sign-in" style={styles.backLink}>
        ←
      </Link>

      <View style={styles.section}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.meta}>Last updated: April 9, 2026</Text>
        <Text style={styles.body}>
          These Terms of Service govern your use of Pershie, a web app for recording
          and organizing personal-history audio in your own Google Drive.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Use of the service</Text>
        <Text style={styles.body}>
          You may use Pershie only in compliance with applicable law and these terms.
          You are responsible for the recordings, images, notes, and other content
          you create, upload, or manage through the app.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Your Google account and content</Text>
        <Text style={styles.body}>
          Pershie relies on Google Sign-In and Google Drive access that you authorize.
          You remain responsible for your Google account, your Drive files, and the
          permissions on folders and content you choose to connect.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Acceptable use</Text>
        <Text style={styles.body}>
          You agree not to use Pershie to violate privacy rights, infringe
          intellectual property rights, upload unlawful material, or interfere with
          the normal operation or security of the service.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Availability</Text>
        <Text style={styles.body}>
          Pershie is provided on an as-is and as-available basis. Features may
          change, improve, or be removed over time, especially while the product is
          being tested.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Limitation of liability</Text>
        <Text style={styles.body}>
          To the fullest extent permitted by law, Pershie is not liable for indirect,
          incidental, special, consequential, or exemplary damages arising from your
          use of the app, including data loss, account issues, or service
          interruptions.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Changes to these terms</Text>
        <Text style={styles.body}>
          These terms may be updated from time to time. Continued use of Pershie
          after an update means you accept the revised terms.
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backLink: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
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
