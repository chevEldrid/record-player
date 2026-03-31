import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
import type { WarningCode } from '@/domain/models';

const warningCopy: Record<WarningCode, string> = {
  'missing-album-metadata': 'Album metadata missing',
  'missing-track-metadata': 'Track metadata missing',
  'missing-audio-file': 'Audio missing',
  'missing-track-title': 'Title missing',
  'missing-recorded-at': 'Date missing',
  'pending-upload': 'Pending upload',
  'orphan-metadata': 'Metadata could not be parsed',
};

export function WarningBadge({ warning }: { warning: WarningCode }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{warningCopy[warning]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF2DF',
    borderColor: '#F2C88A',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  label: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
});
