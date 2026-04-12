import { Audio } from 'expo-av';
import { Trash2 } from 'lucide-react-native';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type Props = PropsWithChildren<{
  fileName: string;
  recordedAtLabel: string;
  recordedUri: string;
  onDiscard: () => void;
  title?: string;
}>;

export function RecordedFileCard({
  children,
  fileName,
  onDiscard,
  recordedAtLabel,
  recordedUri,
  title = 'Recorded File',
}: Props) {
  const [previewSound, setPreviewSound] = useState<Audio.Sound | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (previewSound) {
        previewSound.unloadAsync();
      }
    };
  }, [previewSound]);

  async function stopPreviewPlayback() {
    if (!previewSound) {
      setIsPreviewPlaying(false);
      return;
    }

    await previewSound.stopAsync();
    setIsPreviewPlaying(false);
  }

  async function togglePreviewPlayback() {
    if (isPreviewPlaying) {
      await stopPreviewPlayback();
      return;
    }

    if (previewSound) {
      await previewSound.replayAsync();
      setIsPreviewPlaying(true);
      return;
    }

    const nextSound = new Audio.Sound();
    nextSound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        return;
      }

      if (status.didJustFinish) {
        setIsPreviewPlaying(false);
        return;
      }

      setIsPreviewPlaying(status.isPlaying);
    });

    await nextSound.loadAsync({ uri: recordedUri });
    setPreviewSound(nextSound);
    await nextSound.playAsync();
    setIsPreviewPlaying(true);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.fileRow}>
        <Pressable
          accessibilityLabel={isPreviewPlaying ? 'Stop playback' : 'Play recording'}
          accessibilityRole="button"
          onPress={() => void togglePreviewPlayback()}
          style={({ pressed }) => [styles.fileGlyph, pressed && styles.fileGlyphPressed]}>
          <View style={styles.fileGlyphFold} />
          <Text style={styles.fileGlyphIcon}>{isPreviewPlaying ? '■' : '▶'}</Text>
        </Pressable>
        <View style={styles.fileMeta}>
          <Text numberOfLines={1} style={styles.fileMetaName}>
            {fileName}
          </Text>
          <Text style={styles.fileMetaStamp}>{recordedAtLabel}</Text>
        </View>
        <Pressable
          accessibilityLabel="Discard recording"
          accessibilityRole="button"
          onPress={onDiscard}
          style={({ pressed }) => [styles.trashButton, pressed && styles.trashButtonPressed]}>
          <Trash2 color={colors.textMuted} size={16} strokeWidth={2} />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  fileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  fileGlyph: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: 48,
  },
  fileGlyphFold: {
    backgroundColor: colors.background,
    height: 14,
    position: 'absolute',
    right: 0,
    top: 0,
    transform: [{ rotate: '45deg' }, { translateX: 7 }, { translateY: -7 }],
    width: 14,
  },
  fileGlyphIcon: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 2,
  },
  fileGlyphPressed: {
    opacity: 0.72,
  },
  fileMeta: {
    flex: 1,
    gap: 4,
  },
  fileMetaName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  fileMetaStamp: {
    color: colors.textMuted,
    fontSize: 13,
  },
  trashButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 52,
    paddingHorizontal: spacing.sm,
  },
  trashButtonPressed: {
    opacity: 0.7,
  },
});
