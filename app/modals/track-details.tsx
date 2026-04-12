import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { DriveImage } from '@/components/DriveImage';
import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { WarningBadge } from '@/components/WarningBadge';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppData } from '@/contexts/AppDataContext';
import { formatDisplayDateOnly, toDateInputValue } from '@/utils/date';

export default function TrackDetailsModal() {
  const { albumId, trackId } = useLocalSearchParams<{ albumId: string; trackId: string }>();
  const { albums, downloadDriveAsset, updateTrack } = useAppData();
  const album = albums.find((candidate) => candidate.id === albumId);
  const track = album?.tracks.find((candidate) => candidate.id === trackId);

  const [title, setTitle] = useState(track?.title ?? '');
  const [recordedAt, setRecordedAt] = useState(toDateInputValue(track?.recordedAt));
  const [tagsText, setTagsText] = useState(track?.tags.join(', ') ?? '');
  const [notes, setNotes] = useState(track?.notes ?? '');
  const [imageUri, setImageUri] = useState<string | undefined>(track?.imageUri);
  const [saving, setSaving] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const warnings = useMemo(() => track?.warnings ?? [], [track?.warnings]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (!album || !track) {
    return (
      <ScreenShell>
        <Text style={styles.title}>Track unavailable</Text>
        <Text style={styles.subtitle}>This track could not be loaded.</Text>
      </ScreenShell>
    );
  }

  const currentAlbum = album;
  const currentTrack = track;

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0]?.uri);
    }
  }

  async function togglePlayback() {
    if (!currentTrack.audioUri) {
      Alert.alert('Audio missing', 'This track does not currently have an audio file.');
      return;
    }

    if (sound && isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      return;
    }

    if (sound && !isPlaying) {
      await sound.playAsync();
      setIsPlaying(true);
      return;
    }

    const localUri = await downloadDriveAsset(currentTrack.audioUri);
    if (!localUri) {
      Alert.alert('Playback unavailable', 'The audio file could not be downloaded.');
      return;
    }

    const nextSound = new Audio.Sound();
    await nextSound.loadAsync({ uri: localUri });
    nextSound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) {
        return;
      }
      setIsPlaying(status.isPlaying);
    });
    await nextSound.playAsync();
    setSound(nextSound);
  }

  async function saveChanges() {
    setSaving(true);
    try {
      await updateTrack(currentAlbum.id, currentTrack.id, {
        title,
        recordedAt: recordedAt || toDateInputValue(currentTrack.recordedAt),
        tags: tagsText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        notes,
        imageUri:
          imageUri && !imageUri.startsWith('drive://') ? imageUri : undefined,
      });
      Alert.alert('Saved', 'Track updated.');
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Track update failed.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenShell scroll>
      <Text style={styles.title}>{track.title}</Text>
      <Text style={styles.subtitle}>{formatDisplayDateOnly(currentTrack.recordedAt)}</Text>

      <Pressable onPress={togglePlayback} style={styles.heroArt}>
        <DriveImage label={currentTrack.title} size={180} uri={imageUri} />
        <View style={styles.playOverlay}>
          <Text style={styles.playIcon}>{isPlaying ? 'II' : '▶'}</Text>
        </View>
      </Pressable>

      {warnings.length ? (
        <View style={styles.warningWrap}>
          {warnings.map((warning) => (
            <WarningBadge key={warning} warning={warning} />
          ))}
        </View>
      ) : null}

      <PrimaryButton label="Change Image" onPress={chooseImage} variant="secondary" />

      <LabeledField label="Title" onChangeText={setTitle} value={title} />
      <LabeledField
        label="Date"
        onChangeText={setRecordedAt}
        placeholder="2026-04-08"
        value={recordedAt}
      />
      <LabeledField
        label="Tags"
        onChangeText={setTagsText}
        placeholder="childhood, migration, music"
        value={tagsText}
      />
      <LabeledField label="Notes" multiline onChangeText={setNotes} value={notes} />

      <View style={styles.saveSpacer} />
      <PrimaryButton label="Save" loading={saving} onPress={saveChanges} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  heroArt: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  playOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(33, 26, 20, 0.24)',
    borderRadius: 999,
    height: 62,
    justifyContent: 'center',
    position: 'absolute',
    width: 62,
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 4,
  },
  warningWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  saveSpacer: {
    height: spacing.lg,
  },
});
