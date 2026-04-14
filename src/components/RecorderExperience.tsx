import { useState, type ReactNode } from 'react';
import { Alert, Pressable, Text, View, useWindowDimensions } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DateField } from '@/components/DateField';
import { FLOATING_NAV_HEIGHT } from '@/components/FloatingBottomNav';
import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RecordedFileCard } from '@/components/RecordedFileCard';
import { RecorderButton } from '@/components/RecorderButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useRecorder } from '@/hooks/useRecorder';
import { formatDisplayDate, formatTimestampFileLabel } from '@/utils/date';
import { extensionForMimeType } from '@/utils/recording';

export type RecordedContext = {
  clearRecording: () => void;
  extension: string;
  fileName: string;
  isRecording: boolean;
  recordedAt: string;
  recordedMimeType: string;
  recordedUri: string;
};

type PrimaryAction = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: (context: RecordedContext) => void | Promise<void>;
};

type SecondaryAction = {
  label: string;
  loading?: boolean;
  onPress: (context: RecordedContext) => void | Promise<void>;
  variant?: 'secondary' | 'danger';
};

type Props = {
  onClearDraft?: () => void;
  onRecorded?: (result: { mimeType: string; recordedAt: string; uri?: string }) => void;
  pendingFooter?: ReactNode;
  primaryAction: PrimaryAction;
  secondaryAction?: SecondaryAction;
} & (
    | {
      mode: 'offline';
      fileName: string;
      onBack: () => void;
      onFileNameChange: (value: string) => void;
    }
    | {
      mode: 'library';
      isOnline: boolean;
      notes: string;
      occurredAt: string;
      onNotesChange: (value: string) => void;
      onOccurredAtChange: (value: string) => void;
      onSelectAlbum: () => void;
      onTagsTextChange: (value: string) => void;
      onTitleChange: (value: string) => void;
      selectedAlbumName?: string;
      tagsText: string;
      title: string;
    }
  );

export function RecorderExperience(props: Props) {
  const { height } = useWindowDimensions();
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const recorder = useRecorder({
    clearDraft: props.onClearDraft,
    onRecorded: props.onRecorded,
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

  const extension = extensionForMimeType(recorder.recordedMimeType);
  const hasRecordedTrack = Boolean(recorder.recordedUri && recorder.recordedAt);
  const secondaryAction = props.secondaryAction;
  const idleMinHeight =
    props.mode === 'library'
      ? Math.max(height - FLOATING_NAV_HEIGHT - 96, 320)
      : Math.max(height - 96, 320);
  const recordedContext = hasRecordedTrack
    ? {
      clearRecording: recorder.clearRecording,
      extension,
      fileName: formatTimestampFileLabel(recorder.recordedAt!),
      isRecording: recorder.isRecording,
      recordedAt: recorder.recordedAt!,
      recordedMimeType: recorder.recordedMimeType,
      recordedUri: recorder.recordedUri!,
    }
    : null;

  return (
    <ScreenShell
      bottomNav={props.mode === 'library'}
      padded={props.mode === 'offline'}
      scroll>
        {props.mode === 'offline' ? (
          <Pressable accessibilityRole="button" className="self-start" onPress={props.onBack}>
            <Text className="text-[32px] leading-8 text-appText">←</Text>
          </Pressable>
        ) : null}

        <View
          className={recordedContext ? 'gap-5' : 'justify-center gap-5'}
          style={recordedContext ? undefined : { minHeight: idleMinHeight }}>
          <View className="items-center py-7">
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

          {recordedContext ? (
            <RecordedFileCard
              fileName={`${recordedContext.fileName}.${recordedContext.extension}`}
              onDiscard={() => setConfirmDiscardOpen(true)}
              recordedAtLabel={formatDisplayDate(recordedContext.recordedAt)}
              recordedUri={recordedContext.recordedUri}>
              {props.mode === 'offline' ? (
                <LabeledField
                  label="File name"
                  onChangeText={props.onFileNameChange}
                  placeholder={formatTimestampFileLabel(recordedContext.recordedAt)}
                  value={props.fileName}
                />
              ) : (
                <>
                  <Pressable
                    className="rounded-appLg border border-appBorder bg-appCard p-4"
                    onPress={props.onSelectAlbum}>
                    <Text className="text-xs uppercase text-appMuted">Save to</Text>
                    <Text className="mt-1 text-[18px] font-bold text-appText" numberOfLines={1}>
                      {props.selectedAlbumName ?? 'Choose album'}
                    </Text>
                  </Pressable>
                  <LabeledField
                    label="Track title"
                    onChangeText={props.onTitleChange}
                    placeholder={recordedContext.fileName}
                    value={props.title}
                  />
                  <DateField
                    helper="When this story took place."
                    label="Occurred at"
                    onChangeText={props.onOccurredAtChange}
                    value={props.occurredAt}
                  />
                  <LabeledField
                    label="Tags"
                    onChangeText={props.onTagsTextChange}
                    placeholder="family, travel, childhood"
                    value={props.tagsText}
                  />
                  <LabeledField
                    label="Notes"
                    multiline
                    onChangeText={props.onNotesChange}
                    placeholder="Context, prompts, or details to remember."
                    value={props.notes}
                  />
                  {!props.isOnline ? (
                    <View className="gap-1.5 rounded-appMd border border-appBorder bg-appAccentSoft p-4">
                      <Text className="text-sm font-bold text-appText">You&apos;re offline</Text>
                      <Text className="text-[13px] leading-5 text-appMuted">
                        You are currently offline. Syncing is currently disabled.
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
              <PrimaryButton
                disabled={props.primaryAction.disabled}
                label={props.primaryAction.label}
                loading={props.primaryAction.loading}
                onPress={() => void props.primaryAction.onPress(recordedContext)}
              />
              {secondaryAction ? (
                <PrimaryButton
                  label={secondaryAction.label}
                  loading={secondaryAction.loading}
                  onPress={() => void secondaryAction.onPress(recordedContext)}
                  variant={secondaryAction.variant ?? 'secondary'}
                />
              ) : null}
            </RecordedFileCard>
          ) : null}
        </View>

        {props.pendingFooter}

      <ConfirmDialog
        body="Are you sure you want to discard this recording?"
        confirmLabel="Discard"
        onCancel={() => setConfirmDiscardOpen(false)}
        onConfirm={() => {
          recorder.clearRecording();
          props.onClearDraft?.();
          setConfirmDiscardOpen(false);
        }}
        open={confirmDiscardOpen}
        title="Discard recording?"
      />
    </ScreenShell>
  );
}
