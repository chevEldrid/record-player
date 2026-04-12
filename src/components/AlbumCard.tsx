import { Pressable, View } from 'react-native';

import type { Album } from '@/domain/models';
import { DriveImage } from '@/components/DriveImage';

export function AlbumCard({
  album,
  onPress,
  size = 104,
}: {
  album: Album;
  onPress: () => void;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-lg border border-[#8B5B2F] bg-[#E6D0B0]"
      style={({ pressed }) => ({
        height: size,
        shadowColor: 'rgba(43, 25, 10, 0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        width: size,
      })}>
      <View className="flex-1 items-center justify-center">
        <DriveImage label={album.name} size={size} uri={album.imageUri} />
      </View>
    </Pressable>
  );
}
