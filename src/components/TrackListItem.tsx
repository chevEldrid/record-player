import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
import type { Track } from '@/domain/models';
import { formatDisplayDate } from '@/utils/date';
import { WarningBadge } from '@/components/WarningBadge';

export function TrackListItem({
  track,
  onPress,
}: {
  track: Track;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.timelineDot} />
      <View style={styles.card}>
        <Text style={styles.title}>{track.title}</Text>
        <Text style={styles.date}>{formatDisplayDate(track.recordedAt)}</Text>
        {track.warnings.length ? (
          <View style={styles.warningRow}>
            {track.warnings.slice(0, 2).map((warning) => (
              <WarningBadge key={warning} warning={warning} />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  timelineDot: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    height: 14,
    marginTop: 18,
    width: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  date: {
    color: colors.textMuted,
    fontSize: 13,
  },
  warningRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
