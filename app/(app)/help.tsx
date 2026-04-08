import { StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/ScreenShell';
import { APP_NAME } from '@/constants/config';
import { colors, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

const steps = [
  {
    title: '1. Connect Google Drive',
    body: 'Sign in with Google, then either create a fresh library folder or reconnect to one you already used with Pershie.',
  },
  {
    title: '2. Create an album',
    body: 'Each person becomes an album. Their recordings, metadata, and attachments live together inside that person folder.',
  },
  {
    title: '3. Record or upload a track',
    body: 'Use the Record tab to capture a memory in the browser or import an existing audio file, then add notes, tags, and a recording date.',
  },
  {
    title: '4. Review and edit later',
    body: 'Track details stay editable, and Pershie reloads from Google Drive so your library remains recoverable even if files are moved around carefully.',
  },
];

const faqs = [
  {
    title: 'Can I change the top-level folder name?',
    body: 'Yes. New libraries can use any base folder name instead of the default Pershie folder.',
  },
  {
    title: 'How does import work?',
    body: 'Import opens Google Picker so you can explicitly choose the Drive folder you want Pershie to reconnect to.',
  },
  {
    title: 'Where should I put my Google client ID in production?',
    body: 'Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as an environment variable in Vercel so the browser build can read it at build time.',
  },
];

export default function HelpScreen() {
  const { session } = useAuth();

  return (
    <ScreenShell padded scroll>
      <View style={styles.hero}>
        <Text style={styles.title}>{APP_NAME} Help</Text>
        <Text style={styles.subtitle}>
          Quick guidance for getting from sign-in to a working personal-history
          library in Google Drive.
        </Text>
        <Text style={styles.meta}>
          Signed in as {session?.user.email ?? session?.user.name ?? 'your account'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Flow</Text>
        {steps.map((step) => (
          <View key={step.title} style={styles.card}>
            <Text style={styles.cardTitle}>{step.title}</Text>
            <Text style={styles.cardBody}>{step.body}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Common Questions</Text>
        {faqs.map((item) => (
          <View key={item.title} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  meta: {
    color: colors.accent,
    fontSize: 13,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
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
});
