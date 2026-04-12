import { Audio } from 'expo-av';
import { Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { colors, radii, spacing } from '@/constants/theme';
import {
  formatDisplayDate,
  formatTimestampFileLabel,
  toLocalTimestampMinute,
} from '@/utils/date';
import { slugify } from '@/utils/slug';

function extensionForMimeType(mimeType: string) {
  if (mimeType.includes('mpeg')) {
    return 'mp3';
  }

  if (mimeType.includes('webm')) {
    return 'webm';
  }

  return 'm4a';
}

export default function OfflineRecordScreen() {
  const router = useRouter();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string>();
  const [recordedAt, setRecordedAt] = useState<string>();
  const [recordedMimeType, setRecordedMimeType] = useState('audio/webm');
  const [fileName, setFileName] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  function clearRecording() {
    setRecordedUri(undefined);
    setRecordedAt(undefined);
    setFileName('');
    setAudioLevel(0);
  }

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
    const nextRecordedAt = toLocalTimestampMinute();
    setRecording(null);
    setAudioLevel(0);
    setRecordedUri(uri ?? undefined);
    setRecordedAt(nextRecordedAt);
    setRecordedMimeType(Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a');
    setFileName(formatTimestampFileLabel(nextRecordedAt));
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
  }

  function downloadBlob(blob: Blob, nextFileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = nextFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  async function saveCurrentRecording() {
    if (!recordedUri) {
      Alert.alert('Record first', 'Create audio before saving it to your device.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(recordedUri);
      if (!response.ok) {
        throw new Error('Could not read the recorded audio.');
      }

      const audioBlob = await response.blob();
      const extension = extensionForMimeType(recordedMimeType);
      const resolvedName = slugify(fileName.trim()) || formatTimestampFileLabel(recordedAt);

      downloadBlob(audioBlob, `${resolvedName}.${extension}`);
      clearRecording();
      Alert.alert(
        'Saved to device',
        extension === 'mp3'
          ? 'The recording was downloaded to this device.'
          : `The recording was downloaded as .${extension}. Browser recording here does not produce a true MP3.`
      );
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Saving the recording to your device failed.'
      );
    } finally {
      setSaving(false);
    }
  }

  const extension = extensionForMimeType(recordedMimeType);
  const resolvedName = slugify(fileName.trim()) || formatTimestampFileLabel(recordedAt);

  return (
    <ScreenShell padded>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace('/');
          }}
          style={styles.backLinkWrap}>
          <Text style={styles.backLink}>←</Text>
        </Pressable>

        <View style={styles.mainContent}>
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

          {recordedUri ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recorded File</Text>
              <View style={styles.fileRow}>
                <View style={styles.fileGlyph}>
                  <View style={styles.fileGlyphFold} />
                </View>
                <View style={styles.fileMeta}>
                  <Text numberOfLines={1} style={styles.fileMetaName}>
                    {resolvedName}.{extension}
                  </Text>
                  <Text style={styles.fileMetaStamp}>{formatDisplayDate(recordedAt)}</Text>
                </View>
                <Pressable
                  accessibilityLabel="Discard recording"
                  accessibilityRole="button"
                  onPress={() => setConfirmDiscardOpen(true)}
                  style={({ pressed }) => [
                    styles.trashButton,
                    pressed && styles.trashButtonPressed,
                  ]}>
                  <Trash2 color={colors.textMuted} size={16} strokeWidth={2} />
                </Pressable>
              </View>
              <LabeledField
                label="File name"
                onChangeText={setFileName}
                placeholder={formatTimestampFileLabel(recordedAt)}
                value={fileName}
              />
              <PrimaryButton
                label="Save to Device"
                loading={saving}
                onPress={saveCurrentRecording}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

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
  backLink: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 32,
  },
  backLinkWrap: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  content: {
    alignItems: 'stretch',
    flexGrow: 1,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  mainContent: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  heroRecorder: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  recordButton: {
    alignItems: 'center',
    backgroundColor: '#F7E8DB',
    borderRadius: 999,
    height: 148,
    justifyContent: 'center',
    width: 148,
  },
  recordButtonActive: {
    backgroundColor: '#F2CEC0',
  },
  recordButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  recordButtonDisabled: {
    opacity: 0.6,
  },
  recordButtonCore: {
    backgroundColor: colors.text,
    borderRadius: 999,
    height: 78,
    width: 78,
  },
  recordButtonCoreLive: {
    backgroundColor: '#C9563B',
  },
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
  helperBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  helperCard: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  helperTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  fileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  fileGlyph: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    height: 58,
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
    gap: spacing.md,
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
});
