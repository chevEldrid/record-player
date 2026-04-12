import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { useMemo, useState } from 'react';

import { toLocalTimestampMinute } from '@/utils/date';

type Options = {
  clearDraft?: () => void;
  onRecorded?: (result: { mimeType: string; recordedAt: string; uri?: string }) => void;
};

export function useRecorder({ clearDraft, onRecorded }: Options = {}) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordedAt, setRecordedAt] = useState<string>();
  const [recordedMimeType, setRecordedMimeType] = useState('audio/webm');
  const [recordedUri, setRecordedUri] = useState<string>();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  async function startRecording() {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Pershie needs microphone access to record.');
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
    clearDraft?.();
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
    const nextRecordedAt = toLocalTimestampMinute();
    const mimeType = Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';

    setRecording(null);
    setAudioLevel(0);
    setRecordedUri(uri ?? undefined);
    setRecordedAt(nextRecordedAt);
    setRecordedMimeType(mimeType);

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    onRecorded?.({
      mimeType,
      recordedAt: nextRecordedAt,
      uri: uri ?? undefined,
    });
  }

  function clearRecording() {
    setAudioLevel(0);
    setRecordedAt(undefined);
    setRecordedUri(undefined);
  }

  return useMemo(
    () => ({
      audioLevel,
      clearRecording,
      hasRecordedAudio: Boolean(recordedUri),
      isRecording: Boolean(recording),
      recordedAt,
      recordedMimeType,
      recordedUri,
      startRecording,
      stopRecording,
    }),
    [audioLevel, recordedAt, recordedMimeType, recordedUri, recording]
  );
}
