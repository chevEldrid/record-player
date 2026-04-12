import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { DateField } from '@/components/DateField';
import { DriveImage } from '@/components/DriveImage';
import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { WarningBadge } from '@/components/WarningBadge';
import { useAppData } from '@/contexts/AppDataContext';
import { formatDisplayDate, formatDisplayDateOnly, toDateInputValue } from '@/utils/date';

export default function TrackDetailsScreen() {
  const { albumId, trackId } = useLocalSearchParams<{ albumId: string; trackId: string }>();
  const { albums, downloadDriveAsset, updateTrack } = useAppData();
  const album = albums.find((candidate) => candidate.id === albumId);
  const track = album?.tracks.find((candidate) => candidate.id === trackId);

  const [title, setTitle] = useState(track?.title ?? '');
  const [occurredAt, setOccurredAt] = useState(toDateInputValue(track?.occurredAt));
  const [tagsText, setTagsText] = useState(track?.tags.join(', ') ?? '');
  const [notes, setNotes] = useState(track?.notes ?? '');
  const [imageUri, setImageUri] = useState<string | undefined>(track?.imageUri);
  const [isEditing, setIsEditing] = useState(false);
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

  useEffect(() => {
    if (!track) {
      return;
    }

    setTitle(track.title);
    setOccurredAt(toDateInputValue(track.occurredAt));
    setTagsText(track.tags.join(', '));
    setNotes(track.notes ?? '');
    setImageUri(track.imageUri);
    setIsEditing(false);
  }, [track]);

  if (!album || !track) {
    return (
      <ScreenShell bottomNav>
        <Text className="text-[26px] font-extrabold text-appText">Track unavailable</Text>
        <Text className="mb-5 mt-1.5 text-[15px] text-appMuted">
          This track could not be loaded.
        </Text>
      </ScreenShell>
    );
  }

  const currentAlbum = album;
  const currentTrack = track;

  function resetForm() {
    setTitle(currentTrack.title);
    setOccurredAt(toDateInputValue(currentTrack.occurredAt));
    setTagsText(currentTrack.tags.join(', '));
    setNotes(currentTrack.notes ?? '');
    setImageUri(currentTrack.imageUri);
  }

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
        recordedAt: currentTrack.recordedAt || new Date().toISOString(),
        occurredAt: occurredAt || toDateInputValue(currentTrack.occurredAt),
        tags: tagsText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        notes,
        imageUri:
          imageUri && !imageUri.startsWith('drive://') ? imageUri : undefined,
      });
      setIsEditing(false);
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
    <ScreenShell bottomNav scroll>
      <Text className="text-[26px] font-extrabold text-appText">{track.title}</Text>
      <Text className="mb-5 mt-1.5 text-[15px] text-appMuted">
        Occurred {formatDisplayDateOnly(currentTrack.occurredAt)}
      </Text>
      <Text className="-mt-3 mb-5 text-[13px] text-appMuted">
        Recorded {formatDisplayDate(currentTrack.recordedAt)}
      </Text>

      <Pressable className="relative mb-5 self-center" onPress={togglePlayback}>
        <DriveImage label={currentTrack.title} size={180} uri={imageUri} />
        <View className="absolute inset-0 items-center justify-center">
          <View className="h-[62px] w-[62px] items-center justify-center rounded-full bg-[rgba(33,26,20,0.24)]">
            <Text className="ml-1 text-2xl font-bold text-white">
              {isPlaying ? 'II' : '▶'}
            </Text>
          </View>
        </View>
      </Pressable>

      {warnings.length ? (
        <View className="mb-5 flex-row flex-wrap gap-1.5">
          {warnings.map((warning) => (
            <WarningBadge key={warning} warning={warning} />
          ))}
        </View>
      ) : null}

      {isEditing ? (
        <View className="gap-4">
          <PrimaryButton label="Change Image" onPress={chooseImage} variant="secondary" />
          <LabeledField label="Title" onChangeText={setTitle} value={title} />
          <DateField
            helper="Used for album timeline ordering."
            label="Occurred at"
            onChangeText={setOccurredAt}
            value={occurredAt}
          />
          <LabeledField
            label="Tags"
            onChangeText={setTagsText}
            placeholder="childhood, migration, music"
            value={tagsText}
          />
          <LabeledField label="Notes" multiline onChangeText={setNotes} value={notes} />
          <View className="h-1" />
          <PrimaryButton label="Save" loading={saving} onPress={saveChanges} />
          <PrimaryButton
            label="Cancel"
            onPress={() => {
              resetForm();
              setIsEditing(false);
            }}
            variant="secondary"
          />
        </View>
      ) : (
        <PrimaryButton
          label="Edit Metadata"
          onPress={() => {
            resetForm();
            setIsEditing(true);
          }}
          variant="secondary"
        />
      )}
    </ScreenShell>
  );
}
