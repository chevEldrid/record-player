import { Pressable, Text, View } from 'react-native';

import type { Track } from '@/domain/models';
import { formatDisplayDateOnly } from '@/utils/date';
import { WarningBadge } from '@/components/WarningBadge';

export function TrackListItem({
  track,
  onPress,
}: {
  track: Track;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-start gap-4"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
      <View className="w-4 self-stretch items-center">
        <View className="mt-[18px] h-3.5 w-3.5 rounded-full bg-appAccent" />
      </View>
      <View className="flex-1 gap-1.5 rounded-appLg border border-appBorder bg-appCard p-4">
        <Text className="text-base font-bold text-appText">{track.title}</Text>
        <Text className="text-[13px] text-appMuted">
          {formatDisplayDateOnly(track.occurredAt)}
        </Text>
        {track.warnings.length ? (
          <View className="mt-1 flex-row flex-wrap gap-1.5">
            {track.warnings.slice(0, 2).map((warning) => (
              <WarningBadge key={warning} warning={warning} />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
