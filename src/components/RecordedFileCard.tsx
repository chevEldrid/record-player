import { Audio } from 'expo-av';
import { Trash2 } from 'lucide-react-native';
import { PropsWithChildren, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppCard } from '@/components/AppCard';
import { colors } from '@/constants/theme';

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
    <AppCard className="gap-4 p-5">
      <Text className="text-base font-extrabold text-appText">{title}</Text>
      <View className="flex-row items-center gap-4">
        <Pressable
          accessibilityLabel={isPreviewPlaying ? 'Stop playback' : 'Play recording'}
          accessibilityRole="button"
          onPress={() => void togglePreviewPlayback()}
          className="relative h-[58px] w-12 items-center justify-center overflow-hidden rounded-appMd border border-appBorder bg-appCardAlt"
          style={({ pressed }) => ({
            opacity: pressed ? 0.72 : 1,
          })}>
          <View
            className="absolute right-0 top-0 h-3.5 w-3.5 bg-appBg"
            style={{ transform: [{ rotate: '45deg' }, { translateX: 7 }, { translateY: -7 }] }}
          />
          <Text className="ml-0.5 text-[18px] font-bold text-appText">
            {isPreviewPlaying ? '■' : '▶'}
          </Text>
        </Pressable>
        <View className="flex-1 gap-1">
          <Text className="text-sm font-bold text-appText" numberOfLines={1}>
            {fileName}
          </Text>
          <Text className="text-[13px] text-appMuted">{recordedAtLabel}</Text>
        </View>
        <Pressable
          accessibilityLabel="Discard recording"
          accessibilityRole="button"
          onPress={onDiscard}
          className="min-h-9 min-w-[52px] items-center justify-center rounded-full border border-appBorder px-2.5"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}>
          <Trash2 color={colors.textMuted} size={16} strokeWidth={2} />
        </Pressable>
      </View>
      {children}
    </AppCard>
  );
}
