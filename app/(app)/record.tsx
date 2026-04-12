import { Audio } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RecordedFileCard } from '@/components/RecordedFileCard';
import { ScreenShell } from '@/components/ScreenShell';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppData } from '@/contexts/AppDataContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  formatDisplayDate,
  formatTimestampFileLabel,
  toLocalTimestampMinute,
} from '@/utils/date';
import { slugify } from '@/utils/slug';

function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function extensionForMimeType(mimeType: string) {
  if (mimeType.includes('mpeg')) {
    return 'mp3';
  }

  if (mimeType.includes('webm')) {
    return 'webm';
  }

  return 'm4a';
}

export default function RecordScreen() {
  const params = useLocalSearchParams<{ albumId?: string }>();
  const { albums, pendingUploads, saveTrack } = useAppData();
  const { isOnline } = useNetworkStatus();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | undefined>(params.albumId);
  const [title, setTitle] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [notes, setNotes] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string>();
  const [recordedAt, setRecordedAt] = useState<string>();
  const [recordedMimeType, setRecordedMimeType] = useState('audio/webm');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  function clearRecording() {
    setRecordedUri(undefined);
    setRecordedAt(undefined);
    setTitle('');
    setTagsText('');
    setNotes('');
    setAudioLevel(0);
  }

  useEffect(() => {
    if (!selectedAlbumId && albums[0]) {
      setSelectedAlbumId(albums[0].id);
    }
  }, [albums, selectedAlbumId]);

  const selectedAlbum = useMemo(
    () => albums.find((album) => album.id === selectedAlbumId),
    [albums, selectedAlbumId]
  );

  async function startRecording() {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone needed', 'Pershie needs microphone access to record.');
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const nextRecording = new Audio.Recording();
    nextRecording.setProgressUpdateInterval(120);
    nextRecording.setOnRecordingStatusUpdate((status) => {
      if (!status.isRecording) {
        setAudioLevel(0);
        return;
      }

      if (typeof status.metering === 'number') {
        const normalized = Math.min(Math.max((status.metering + 60) / 60, 0), 1);
        setAudioLevel(normalized);
        return;
      }

      setAudioLevel((current) => (current > 0.12 ? 0.06 : 0.18));
    });
    await nextRecording.prepareToRecordAsync({
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    });
    await nextRecording.startAsync();
    clearRecording();
    setRecording(nextRecording);
  }

  async function stopRecording() {
    if (!recording) {
      return;
    }

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    setAudioLevel(0);
    setRecordedUri(uri ?? undefined);
    setRecordedAt(toLocalTimestampMinute());
    setRecordedMimeType('audio/webm');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
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

    setSaving(true);
    try {
      await saveTrack({
        albumId: selectedAlbumId,
        title: title.trim() || formatTimestampFileLabel(recordedAt!),
        recordedAt: recordedAt!,
        tags: parseTags(tagsText),
        notes,
        audioUri: recordedUri!,
        mimeType: recordedMimeType,
      });
      clearRecording();
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

  function downloadBlob(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function downloadCurrentRecording() {
    setDownloading(true);
    try {
      const response = await fetch(recordedUri!);
      if (!response.ok) {
        throw new Error('Could not read the recorded audio.');
      }

      const audioBlob = await response.blob();
      const baseName = slugify(title.trim()) || formatTimestampFileLabel(recordedAt!);
      const extension = extensionForMimeType(recordedMimeType);

      downloadBlob(audioBlob, `${baseName}.${extension}`);

      const metadata = {
        title: title.trim() || formatTimestampFileLabel(recordedAt!),
        recordedAt: recordedAt!,
        tags: parseTags(tagsText),
        notes,
        mimeType: recordedMimeType,
      };
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json',
      });
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

  const extension = extensionForMimeType(recordedMimeType);
  const displayName = slugify(title.trim()) || formatTimestampFileLabel(recordedAt);

  return (
    <ScreenShell bottomNav>
      {albums.length ? (
        <>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.heroRecorder}>
              <Pressable
                disabled={Boolean(recordedUri) && !recording}
                onPress={recording ? stopRecording : startRecording}
                style={({ pressed }) => [
                  styles.recordButton,
                  recording && styles.recordButtonActive,
                  recordedUri && !recording && styles.recordButtonDisabled,
                  pressed && styles.recordButtonPressed,
                ]}>
                <View
                  style={[
                    styles.recordButtonCore,
                    recording && styles.recordButtonCoreLive,
                    recording && {
                      transform: [{ scale: 1 + audioLevel * 0.18 }],
                      opacity: 0.75 + audioLevel * 0.25,
                    },
                  ]}
                />
              </Pressable>
            </View>

            {recordedUri && recordedAt ? (
              <RecordedFileCard
                fileName={`${displayName}.${extension}`}
                onDiscard={() => setConfirmDiscardOpen(true)}
                recordedAtLabel={formatDisplayDate(recordedAt)}
                recordedUri={recordedUri}>
                <Pressable onPress={() => setSelectorOpen(true)} style={styles.albumPicker}>
                  <Text style={styles.albumPickerLabel}>Save to</Text>
                  <Text numberOfLines={1} style={styles.albumPickerValue}>
                    {selectedAlbum?.name ?? 'Choose album'}
                  </Text>
                </Pressable>
                <LabeledField
                  label="Track title"
                  onChangeText={setTitle}
                  placeholder={formatTimestampFileLabel(recordedAt)}
                  value={title}
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
                  <View style={styles.offlineNotice}>
                    <Text style={styles.offlineNoticeTitle}>You&apos;re offline</Text>
                    <Text style={styles.offlineNoticeBody}>
                      You are currently offline. Syncing is currently disabled.
                    </Text>
                  </View>
                ) : null}
                <View style={styles.actionGroup}>
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
              <Text style={styles.pendingNote}>
                {pendingUploads.length} upload{pendingUploads.length === 1 ? '' : 's'} pending.
              </Text>
            ) : null}
          </ScrollView>
        </>
      ) : (
        <EmptyState
          body="Create an album from the library before recording."
          title="No albums available"
        />
      )}

      <Modal animationType="slide" transparent visible={selectorOpen}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save to album</Text>
            {albums.map((album) => (
              <Pressable
                key={album.id}
                onPress={() => {
                  setSelectedAlbumId(album.id);
                  setSelectorOpen(false);
                }}
                style={styles.modalOption}>
                <Text style={styles.modalOptionText}>{album.name}</Text>
              </Pressable>
            ))}
            <PrimaryButton
              label="Close"
              onPress={() => setSelectorOpen(false)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={confirmDiscardOpen}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Discard recording?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to discard this recording?
            </Text>
            <View style={styles.modalActions}>
              <PrimaryButton
                label="Keep"
                onPress={() => setConfirmDiscardOpen(false)}
                variant="secondary"
              />
              <PrimaryButton
                label="Discard"
                onPress={() => {
                  clearRecording();
                  setConfirmDiscardOpen(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  albumPicker: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  albumPickerLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  albumPickerValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  content: {
    alignItems: 'stretch',
    flexGrow: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  heroRecorder: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xl,
  },
  recordButton: {
    alignItems: 'center',
    backgroundColor: '#351A16',
    borderRadius: 999,
    height: 188,
    justifyContent: 'center',
    width: 188,
  },
  recordButtonActive: {
    backgroundColor: '#4B1B16',
  },
  recordButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  recordButtonDisabled: {
    opacity: 0.6,
  },
  recordButtonCore: {
    backgroundColor: '#D3372F',
    borderRadius: 999,
    height: 96,
    width: 96,
  },
  recordButtonCoreLive: {
    borderRadius: 28,
  },
  actionGroup: {
    gap: spacing.sm,
  },
  offlineNotice: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  offlineNoticeBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  offlineNoticeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  pendingNote: {
    color: colors.accent,
    fontSize: 13,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(17, 11, 7, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radii.lg,
    gap: spacing.sm,
    padding: spacing.lg,
    width: '100%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  modalBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  modalActions: {
    gap: spacing.sm,
  },
  modalOption: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  modalOptionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
