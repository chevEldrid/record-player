import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
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
      style={({ pressed }) => [
        styles.card,
        { width: size, height: size },
        pressed && styles.pressed,
      ]}>
      <View style={styles.imageWrap}>
        <DriveImage label={album.name} size={size} uri={album.imageUri} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E6D0B0',
    borderColor: '#8B5B2F',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  imageWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
