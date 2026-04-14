import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { AppCard } from '@/components/AppCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DateField } from '@/components/DateField';
import { EmptyState } from '@/components/EmptyState';
import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RecordedFileCard } from '@/components/RecordedFileCard';
import { RecorderButton } from '@/components/RecorderButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useAppData } from '@/contexts/AppDataContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useRecorder } from '@/hooks/useRecorder';
import { formatDisplayDate, formatTimestampFileLabel, todayDateInputValue } from '@/utils/date';
import { downloadBlob, extensionForMimeType } from '@/utils/recording';
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
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const recorder = useRecorder({
    clearDraft: () => {
      setTitle('');
      setOccurredAt(todayDateInputValue());
      setTagsText('');
      setNotes('');
    },
  });

  useEffect(() => {
    if (!selectedAlbumId && albums[0]) {
      setSelectedAlbumId(albums[0].id);
    }
  }, [albums, selectedAlbumId]);

  const selectedAlbum = useMemo(
    () => albums.find((album) => album.id === selectedAlbumId),
    [albums, selectedAlbumId]
  );

  async function handleStartRecording() {
    try {
      await recorder.startRecording();
    } catch (error) {
      Alert.alert(
        'Microphone needed',
        error instanceof Error ? error.message : 'Pershie needs microphone access to record.'
      );
    }
  }

  async function saveCurrentRecording() {
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

    if (!recorder.recordedUri || !recorder.recordedAt) {
      Alert.alert('Record first', 'Create audio before saving it to an album.');
      return;
    }

    setSaving(true);
    try {
      await saveTrack({
        albumId: selectedAlbumId,
        title: title.trim() || formatTimestampFileLabel(recorder.recordedAt),
        recordedAt: recorder.recordedAt,
        occurredAt,
        tags: parseTags(tagsText),
        notes,
        audioUri: recorder.recordedUri,
        mimeType: recorder.recordedMimeType,
      });
      recorder.clearRecording();
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

  async function downloadCurrentRecording() {
    if (!recorder.recordedUri || !recorder.recordedAt) {
      return;
    }

    setDownloading(true);
    try {
      const response = await fetch(recorder.recordedUri);
      if (!response.ok) {
        throw new Error('Could not read the recorded audio.');
      }

      const audioBlob = await response.blob();
      const baseName = slugify(title.trim()) || formatTimestampFileLabel(recorder.recordedAt);
      const extension = extensionForMimeType(recorder.recordedMimeType);

      downloadBlob(audioBlob, `${baseName}.${extension}`);

      const metadataBlob = new Blob(
        [
          JSON.stringify(
            {
              title: title.trim() || formatTimestampFileLabel(recorder.recordedAt),
              recordedAt: recorder.recordedAt,
              occurredAt,
              tags: parseTags(tagsText),
              notes,
              mimeType: recorder.recordedMimeType,
            },
            null,
            2
          ),
        ],
        {
          type: 'application/json',
        }
      );
      downloadBlob(metadataBlob, `${baseName}.json`);
      Alert.alert('Downloaded', 'The recording and its metadata were downloaded to this device.');
    } catch (error) {
      Alert.alert(
        'Could not download',
        error instanceof Error ? error.message : 'Downloading the recording failed.'
      );
    } finally {
      setDownloading(false);
    }
  }

  const extension = extensionForMimeType(recorder.recordedMimeType);
  const displayName =
    slugify(title.trim()) || formatTimestampFileLabel(recorder.recordedAt);

  return (
    <ScreenShell bottomNav>
      {albums.length ? (
        <ScrollView
          contentContainerStyle={{
            alignItems: 'stretch',
            flexGrow: 1,
            gap: 20,
            justifyContent: 'center',
            paddingBottom: 28,
          }}
          keyboardShouldPersistTaps="handled">
          <View className="items-center px-4 py-7">
            <RecorderButton
              activeBackgroundClassName="bg-appRecordLiveRing"
              activeCoreClassName="bg-appRecordCore"
              audioLevel={recorder.audioLevel}
              coreClassName="h-[78px] w-[78px] rounded-full bg-appRecordCore"
              disabled={recorder.hasRecordedAudio && !recorder.isRecording}
              isLive={recorder.isRecording}
              onPress={recorder.isRecording ? recorder.stopRecording : handleStartRecording}
              outerClassName="h-[148px] w-[148px] items-center justify-center rounded-full bg-appRecordRing"
            />
          </View>

          {recorder.recordedUri && recorder.recordedAt ? (
            <RecordedFileCard
              fileName={`${displayName}.${extension}`}
              onDiscard={() => setConfirmDiscardOpen(true)}
              recordedAtLabel={formatDisplayDate(recorder.recordedAt)}
              recordedUri={recorder.recordedUri}>
              <Pressable className="rounded-appLg border border-appBorder bg-appCard p-4" onPress={() => setSelectorOpen(true)}>
                <Text className="text-xs uppercase text-appMuted">Save to</Text>
                <Text className="mt-1 text-[18px] font-bold text-appText" numberOfLines={1}>
                  {selectedAlbum?.name ?? 'Choose album'}
                </Text>
              </Pressable>
              <LabeledField
                label="Track title"
                onChangeText={setTitle}
                placeholder={formatTimestampFileLabel(recorder.recordedAt)}
                value={title}
              />
              <DateField
                helper="When this story took place."
                label="Occurred at"
                onChangeText={setOccurredAt}
                value={occurredAt}
              />
              <LabeledField
                label="Tags"
                onChangeText={setTagsText}
                placeholder="family, travel, childhood"
                value={tagsText}
              />
              <LabeledField
                label="Notes"
                multiline
                onChangeText={setNotes}
                placeholder="Context, prompts, or details to remember."
                value={notes}
              />
              {!isOnline ? (
                <View className="gap-1.5 rounded-appMd border border-appBorder bg-appAccentSoft p-4">
                  <Text className="text-sm font-bold text-appText">You&apos;re offline</Text>
                  <Text className="text-[13px] leading-5 text-appMuted">
                    You are currently offline. Syncing is currently disabled.
                  </Text>
                </View>
              ) : null}
              <View className="gap-2">
                <PrimaryButton
                  disabled={!isOnline}
                  label="Save to Album"
                  loading={saving}
                  onPress={saveCurrentRecording}
                />
                <PrimaryButton
                  label="Download"
                  loading={downloading}
                  onPress={downloadCurrentRecording}
                  variant="secondary"
                />
              </View>
            </RecordedFileCard>
          ) : null}

          {pendingUploads.length ? (
            <Text className="mt-4 px-4 text-[13px] text-appAccent">
              {pendingUploads.length} upload{pendingUploads.length === 1 ? '' : 's'} pending.
            </Text>
          ) : null}
        </ScrollView>
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

      <ConfirmDialog
        body="Are you sure you want to discard this recording?"
        confirmLabel="Discard"
        onCancel={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          recorder.clearRecording();
          setTitle('');
          setOccurredAt(todayDateInputValue());
          setTagsText('');
          setNotes('');
          setConfirmDiscardOpen(false);
        }}
        open={confirmDiscardOpen}
        title="Discard recording?"
      />
    </ScreenShell>
  );
}
