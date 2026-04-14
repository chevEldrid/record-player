import { Text, View } from 'react-native';

import type { WarningCode } from '@/domain/models';

const warningCopy: Record<WarningCode, string> = {
  'missing-album-metadata': 'Album metadata missing',
  'missing-track-metadata': 'Track metadata missing',
  'missing-track-title': 'Title missing',
  'missing-recorded-at': 'Date missing',
  'pending-upload': 'Pending upload',
  'orphan-metadata': 'Metadata could not be parsed',
};

export function WarningBadge({ warning }: { warning: WarningCode }) {
  return (
    <View className="self-start rounded-full border border-appWarningBorder bg-appWarningBg px-2.5 py-1.5">
      <Text className="text-xs font-semibold text-appWarning">{warningCopy[warning]}</Text>
    </View>
  );
}
