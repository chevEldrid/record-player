import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppData } from '@/contexts/AppDataContext';
import { formatDisplayDate } from '@/utils/date';

export default function RecordScreen() {
  const params = useLocalSearchParams<{ albumId?: string }>();
  const { albums, pendingUploads, saveTrack } = useAppData();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | undefined>(params.albumId);
  const [title, setTitle] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string>();
  const [recordedAt, setRecordedAt] = useState<string>();
  const [recordedMimeType, setRecordedMimeType] = useState('audio/m4a');
  const [saving, setSaving] = useState(false);
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

  async function startRecording() {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone needed', 'Record Player needs microphone access to record.');
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const nextRecording = new Audio.Recording();
    await nextRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await nextRecording.startAsync();
    setRecordedUri(undefined);
    setRecordedAt(undefined);
    setRecording(nextRecording);
  }

  async function stopRecording() {
    if (!recording) {
      return;
    }

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    setRecordedUri(uri ?? undefined);
    setRecordedAt(new Date().toISOString());
    setRecordedMimeType('audio/m4a');
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
  }

  async function saveCurrentRecording(uri: string, mimeType: string) {
    if (!selectedAlbumId) {
      Alert.alert('Select an album', 'Choose where this recording should live first.');
      return;
    }

    setSaving(true);
    try {
      const timestamp = recordedAt ?? new Date().toISOString();
      await saveTrack({
        albumId: selectedAlbumId,
        title: title.trim() || `Recording ${formatDisplayDate(timestamp)}`,
        recordedAt: timestamp,
        tags: [],
        notes: '',
        transcript: '',
        audioUri: uri,
        mimeType,
      });
      setTitle('');
      setRecordedUri(undefined);
      setRecordedAt(undefined);
      Alert.alert(
        'Saved',
        'The track was saved. If you were offline, it will upload automatically later.'
      );
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Saving the track failed.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function pickAudioFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

      const asset = result.assets[0];
    setRecordedUri(asset.uri);
    setRecordedAt(new Date().toISOString());
    setRecordedMimeType(asset.mimeType ?? 'audio/mpeg');
    setTitle(asset.name.replace(/\.[^.]+$/, ''));
  }

  return (
    <ScreenShell scroll>
      <Text style={styles.title}>Record</Text>
      <Text style={styles.subtitle}>
        Capture a new memory or bring in an existing audio file.
      </Text>

      {albums.length ? (
        <>
          <Pressable onPress={() => setSelectorOpen(true)} style={styles.albumPicker}>
            <Text style={styles.albumPickerLabel}>Album</Text>
            <Text style={styles.albumPickerValue}>
              {selectedAlbum?.name ?? 'Choose an album'}
            </Text>
          </Pressable>

          <LabeledField
            label="Track title"
            onChangeText={setTitle}
            placeholder="Optional. Defaults to recording date."
            value={title}
          />

          <View style={styles.recordPanel}>
            <Text style={styles.recordStatus}>
              {recording
                ? 'Recording in progress'
                : recordedUri
                  ? 'Ready to save'
                  : 'Tap the record button to begin'}
            </Text>
            <Pressable
              onPress={recording ? stopRecording : startRecording}
              style={({ pressed }) => [
                styles.recordButton,
                pressed && styles.recordButtonPressed,
              ]}>
              <View style={[styles.recordButtonInner, recording && styles.recordingLive]} />
            </Pressable>
            <Text style={styles.recordCaption}>
              {recording
                ? 'Tap again to stop'
                : 'Works offline. Unsynced recordings stay on device until upload succeeds.'}
            </Text>
          </View>

          <PrimaryButton label="Upload Existing Audio" onPress={pickAudioFile} variant="secondary" />

          {recordedUri ? (
            <View style={styles.saveCard}>
              <Text style={styles.saveTitle}>Current track</Text>
              <Text style={styles.saveBody}>
                {title.trim() || 'Untitled recording'}{'\n'}
                {formatDisplayDate(recordedAt)}
              </Text>
              <PrimaryButton
                label="Save to Album"
                loading={saving}
                onPress={() => saveCurrentRecording(recordedUri, recordedMimeType)}
              />
            </View>
          ) : null}

          {pendingUploads.length ? (
            <Text style={styles.pendingNote}>
              {pendingUploads.length} upload{pendingUploads.length === 1 ? '' : 's'} pending.
            </Text>
          ) : null}
        </>
      ) : (
        <EmptyState
          body="Create an album in the Library tab before recording."
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
            <PrimaryButton label="Close" onPress={() => setSelectorOpen(false)} variant="secondary" />
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  albumPicker: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  albumPickerLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  albumPickerValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  recordPanel: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginVertical: spacing.lg,
    padding: spacing.xl,
  },
  recordStatus: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  recordButton: {
    alignItems: 'center',
    backgroundColor: '#FCE2DC',
    borderRadius: 999,
    height: 170,
    justifyContent: 'center',
    marginVertical: spacing.lg,
    width: 170,
  },
  recordButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  recordButtonInner: {
    backgroundColor: colors.danger,
    borderRadius: 999,
    height: 96,
    width: 96,
  },
  recordingLive: {
    borderRadius: 24,
    height: 70,
    width: 70,
  },
  recordCaption: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  saveCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  saveTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  saveBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  pendingNote: {
    color: colors.accent,
    fontSize: 13,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
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
    fontWeight: '700',
    marginBottom: spacing.xs,
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
    fontSize: 16,
    fontWeight: '600',
  },
});
