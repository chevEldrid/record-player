import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { RecorderExperience, type RecordedContext } from '@/components/RecorderExperience';
import { formatTimestampFileLabel } from '@/utils/date';
import { downloadAudioFile } from '@/utils/recording';
import { slugify } from '@/utils/slug';

export default function OfflineRecordScreen() {
  const router = useRouter();
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);

  async function saveCurrentRecording({
    clearRecording,
    extension,
    fileName: defaultFileName,
    recordedMimeType,
    recordedUri,
  }: Pick<RecordedContext, 'clearRecording' | 'extension' | 'fileName' | 'recordedMimeType' | 'recordedUri'>) {
    setSaving(true);
    try {
      const resolvedName = slugify(fileName.trim()) || defaultFileName;

      await downloadAudioFile(recordedUri, `${resolvedName}.${extension}`);
      clearRecording();
      setFileName('');
      Alert.alert(
        'Saved to device',
        recordedMimeType === 'audio/mpeg'
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

  return (
    <RecorderExperience
      fileName={fileName}
      mode="offline"
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace('/');
      }}
      onClearDraft={() => setFileName('')}
      onFileNameChange={setFileName}
      onRecorded={({ recordedAt }) => {
        setFileName(formatTimestampFileLabel(recordedAt));
      }}
      primaryAction={{
        label: 'Save to Device',
        loading: saving,
        onPress: saveCurrentRecording,
      }}
    />
  );
}
