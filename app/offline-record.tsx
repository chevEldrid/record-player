import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RecordedFileCard } from '@/components/RecordedFileCard';
import { RecorderButton } from '@/components/RecorderButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useRecorder } from '@/hooks/useRecorder';
import { formatDisplayDate, formatTimestampFileLabel } from '@/utils/date';
import { downloadBlob, extensionForMimeType } from '@/utils/recording';
import { slugify } from '@/utils/slug';

export default function OfflineRecordScreen() {
  const router = useRouter();
  const [fileName, setFileName] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const recorder = useRecorder({
    clearDraft: () => {
      setFileName('');
    },
    onRecorded: ({ recordedAt }) => {
      setFileName(formatTimestampFileLabel(recordedAt));
    },
  });

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
    if (!recorder.recordedUri) {
      Alert.alert('Record first', 'Create audio before saving it to your device.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(recorder.recordedUri);
      if (!response.ok) {
        throw new Error('Could not read the recorded audio.');
      }

      const audioBlob = await response.blob();
      const extension = extensionForMimeType(recorder.recordedMimeType);
      const resolvedName =
        slugify(fileName.trim()) || formatTimestampFileLabel(recorder.recordedAt);

      downloadBlob(audioBlob, `${resolvedName}.${extension}`);
      recorder.clearRecording();
      setFileName('');
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

  const extension = extensionForMimeType(recorder.recordedMimeType);
  const resolvedName =
    slugify(fileName.trim()) || formatTimestampFileLabel(recorder.recordedAt);

  return (
    <ScreenShell padded>
      <ScrollView
        contentContainerStyle={{ alignItems: 'stretch', flexGrow: 1, gap: 20, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          className="self-start"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }

            router.replace('/');
          }}>
          <Text className="text-[32px] leading-8 text-appText">←</Text>
        </Pressable>

        <View className="flex-1 justify-center gap-5">
          <View className="items-center py-7">
            <RecorderButton
              activeBackgroundClassName="bg-[#F2CEC0]"
              activeCoreClassName="bg-[#C9563B]"
              audioLevel={recorder.audioLevel}
              coreClassName="h-[78px] w-[78px] rounded-full bg-appText"
              disabled={recorder.hasRecordedAudio && !recorder.isRecording}
              isLive={recorder.isRecording}
              onPress={recorder.isRecording ? recorder.stopRecording : handleStartRecording}
              outerClassName="h-[148px] w-[148px] items-center justify-center rounded-full bg-[#F7E8DB]"
            />
          </View>

          {recorder.recordedUri ? (
            <RecordedFileCard
              fileName={`${resolvedName}.${extension}`}
              onDiscard={() => setConfirmDiscardOpen(true)}
              recordedAtLabel={formatDisplayDate(recorder.recordedAt)}
              recordedUri={recorder.recordedUri}>
              <LabeledField
                label="File name"
                onChangeText={setFileName}
                placeholder={formatTimestampFileLabel(recorder.recordedAt)}
                value={fileName}
              />
              <PrimaryButton
                label="Save to Device"
                loading={saving}
                onPress={saveCurrentRecording}
              />
            </RecordedFileCard>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmDialog
        body="Are you sure you want to discard this recording?"
        confirmLabel="Discard"
        onCancel={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          recorder.clearRecording();
          setFileName('');
          setConfirmDiscardOpen(false);
        }}
        open={confirmDiscardOpen}
        title="Discard recording?"
      />
    </ScreenShell>
  );
}
