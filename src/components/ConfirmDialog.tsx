import { Modal, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { AppCard } from '@/components/AppCard';

type Props = {
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

export function ConfirmDialog({
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  open,
  title,
}: Props) {
  return (
    <Modal animationType="fade" transparent visible={open}>
      <View className="flex-1 items-center justify-center bg-appOverlay p-4">
        <AppCard className="w-full gap-4 bg-appBgElevated p-5">
          <View className="gap-2">
            <Text className="text-lg font-extrabold text-appText">{title}</Text>
            <Text className="text-sm leading-5 text-appMuted">{body}</Text>
          </View>
          <View className="gap-2">
            <PrimaryButton label="Keep" onPress={onCancel} variant="secondary" />
            <PrimaryButton label={confirmLabel} onPress={onConfirm} />
          </View>
        </AppCard>
      </View>
    </Modal>
  );
}
