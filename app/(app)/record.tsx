import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';

import { AppCard } from '@/components/AppCard';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RecorderExperience, type RecordedContext } from '@/components/RecorderExperience';
import { useAppData } from '@/contexts/AppDataContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { todayDateInputValue } from '@/utils/date';
import { downloadAudioFile } from '@/utils/recording';
import { slugify } from '@/utils/slug';

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function RecordScreen() {
  const params = useLocalSearchParams<{ albumId?: string }>();
  const { albums, pendingUploads, saveTrack } = useAppData();
  const { isOnline } = useNetworkStatus();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | undefined>(params.albumId);
  const [title, setTitle] = useState('');
  const [occurredAt, setOccurredAt] = useState(todayDateInputValue());
  const [tagsText, setTagsText] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    if (!selectedAlbumId && albums[0]) {
      setSelectedAlbumId(albums[0].id);
    }
  }, [albums, selectedAlbumId]);

  const selectedAlbum = useMemo(
    () => albums.find((album) => album.id === selectedAlbumId),
    [albums, selectedAlbumId]
  );

  async function saveCurrentRecording({
    clearRecording,
    fileName,
    recordedAt,
    recordedMimeType,
    recordedUri,
  }: Pick<RecordedContext, 'clearRecording' | 'fileName' | 'recordedAt' | 'recordedMimeType' | 'recordedUri'>) {
    if (!isOnline) {
      Alert.alert(
        'Connection lost',
        'Save to Album is unavailable while you are offline. Download the recording instead and upload it later.'
      );
      return;
    }

    if (!selectedAlbumId) {
      Alert.alert('Select an album', 'Choose where this recording should live first.');
      return;
    }

    setSaving(true);
    try {
      await saveTrack({
        albumId: selectedAlbumId,
        title: title.trim() || fileName,
        recordedAt,
        occurredAt,
        tags: parseTags(tagsText),
        notes,
        audioUri: recordedUri,
        mimeType: recordedMimeType,
      });
      clearRecording();
      setTitle('');
      setOccurredAt(todayDateInputValue());
      setTagsText('');
      setNotes('');
      Alert.alert('Saved', 'The track was saved.');
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Saving the track failed.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function downloadCurrentRecording({
    extension,
    fileName,
    recordedUri,
  }: Pick<RecordedContext, 'extension' | 'fileName' | 'recordedUri'>) {
    setDownloading(true);
    try {
      const baseName = slugify(title.trim()) || fileName;

      await downloadAudioFile(recordedUri, `${baseName}.${extension}`);
      Alert.alert('Downloaded', 'The recording was downloaded to this device.');
    } catch (error) {
      Alert.alert(
        'Could not download',
        error instanceof Error ? error.message : 'Downloading the recording failed.'
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      {albums.length ? (
        <RecorderExperience
          isOnline={isOnline}
          mode="library"
          notes={notes}
          onClearDraft={() => {
            setTitle('');
            setOccurredAt(todayDateInputValue());
            setTagsText('');
            setNotes('');
          }}
          onNotesChange={setNotes}
          onOccurredAtChange={setOccurredAt}
          onSelectAlbum={() => setSelectorOpen(true)}
          onTagsTextChange={setTagsText}
          onTitleChange={setTitle}
          pendingFooter={
            pendingUploads.length ? (
              <Text className="mt-4 px-4 text-[13px] text-appAccent">
                {pendingUploads.length} upload{pendingUploads.length === 1 ? '' : 's'} pending.
              </Text>
            ) : null
          }
          primaryAction={{
            disabled: !isOnline,
            label: 'Save to Album',
            loading: saving,
            onPress: saveCurrentRecording,
          }}
          occurredAt={occurredAt}
          selectedAlbumName={selectedAlbum?.name}
          secondaryAction={{
            label: 'Download',
            loading: downloading,
            onPress: downloadCurrentRecording,
            variant: 'secondary',
          }}
          tagsText={tagsText}
          title={title}
        />
      ) : (
        <EmptyState
          body="Create an album from the library before recording."
          title="No albums available"
        />
      )}

      <Modal animationType="slide" transparent visible={selectorOpen}>
        <View className="flex-1 items-center justify-center bg-appOverlay p-4">
          <AppCard className="w-full gap-2 bg-appBgElevated p-5">
            <Text className="mb-1 text-lg font-extrabold text-appText">Save to album</Text>
            {albums.map((album) => (
              <Pressable
                key={album.id}
                className="rounded-appMd border border-appBorder bg-appCard p-4"
                onPress={() => {
                  setSelectedAlbumId(album.id);
                  setSelectorOpen(false);
                }}>
                <Text className="text-[15px] font-bold text-appText">{album.name}</Text>
              </Pressable>
            ))}
            <PrimaryButton
              label="Close"
              onPress={() => setSelectorOpen(false)}
              variant="secondary"
            />
          </AppCard>
        </View>
      </Modal>
    </>
  );
}
