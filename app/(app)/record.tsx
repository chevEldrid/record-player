import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
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
  const [audioLevel, setAudioLevel] = useState(0);

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
    setAudioLevel(0);
    setRecordedUri(uri ?? undefined);
    setRecordedAt(new Date().toISOString());
    setRecordedMimeType(Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a');
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
    <ScreenShell bottomNav scroll>
      {albums.length ? (
        <>
          <View style={styles.header}>
            <Pressable onPress={() => setSelectorOpen(true)} style={styles.albumPicker}>
              <Text style={styles.albumPickerLabel}>Save to</Text>
              <Text numberOfLines={1} style={styles.albumPickerValue}>
                {selectedAlbum?.name ?? 'Choose album'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            <Pressable
              onPress={recording ? stopRecording : startRecording}
              style={({ pressed }) => [
                styles.recordButton,
                recording && styles.recordButtonActive,
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
            <Text style={styles.recordCaption}>
              {recording ? 'Tap to stop' : recordedUri ? 'Ready to save' : 'Tap to record'}
            </Text>
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Upload Audio" onPress={pickAudioFile} variant="secondary" />
          </View>

          {recordedUri ? (
            <View style={styles.saveCard}>
              <LabeledField
                label="Track title"
                onChangeText={setTitle}
                placeholder="Optional. Defaults to recording date."
                value={title}
              />
              <Text style={styles.saveMeta}>{formatDisplayDate(recordedAt)}</Text>
              <PrimaryButton
                label="Save Recording"
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
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
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
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxl,
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
  recordButtonCore: {
    backgroundColor: '#D3372F',
    borderRadius: 999,
    height: 96,
    width: 96,
  },
  recordButtonCoreLive: {
    borderRadius: 28,
  },
  recordCaption: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  actions: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  saveCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  saveMeta: {
    color: colors.textMuted,
    fontSize: 13,
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
