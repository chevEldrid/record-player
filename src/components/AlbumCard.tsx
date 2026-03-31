import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';
import type { Album } from '@/domain/models';
import { DriveImage } from '@/components/DriveImage';

export function AlbumCard({
  album,
  onPress,
}: {
  album: Album;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        <DriveImage label={album.name} size={120} uri={album.imageUri} />
      </View>
      <Text numberOfLines={2} style={styles.title}>
        {album.name}
      </Text>
      <Text style={styles.meta}>
        {album.trackCount} {album.trackCount === 1 ? 'track' : 'tracks'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  pressed: {
    transform: [{ scale: 0.985 }],
  },
  imageWrap: {
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    minHeight: 40,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
