import { Modal, Text, View } from 'react-native';

import { AppCard } from '@/components/AppCard';
import { PrimaryButton } from '@/components/PrimaryButton';

type Props = {
  error?: string;
  onReauthorize: () => void;
  onSignOut: () => void;
  open: boolean;
  reauthorizing?: boolean;
};

export function DrivePermissionDialog({
  error,
  onReauthorize,
  onSignOut,
  open,
  reauthorizing,
}: Props) {
  return (
    <Modal animationType="fade" transparent visible={open}>
      <View className="flex-1 items-center justify-center bg-appOverlay p-4">
        <AppCard className="w-full gap-4 bg-appBgElevated p-5">
          <View className="gap-2">
            <Text className="text-lg font-extrabold text-appText">
              Google Drive Permission Needed
            </Text>
            <Text className="text-sm leading-5 text-appMuted">
              Pershie needs Google Drive access to open your library. Re-authorize with the
              required permission, or sign out and return to signed-out mode.
            </Text>
            {error ? <Text className="text-sm leading-5 text-appDanger">{error}</Text> : null}
          </View>
          <View className="gap-2">
            <PrimaryButton
              label={reauthorizing ? 'Re-authorizing...' : 'Re-authorize Google Drive'}
              loading={reauthorizing}
              onPress={onReauthorize}
            />
            <PrimaryButton label="Sign Out" onPress={onSignOut} variant="secondary" />
          </View>
        </AppCard>
      </View>
    </Modal>
  );
}
