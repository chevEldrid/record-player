import { Text, View } from 'react-native';

import { AppCard } from '@/components/AppCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { DRIVE_ROOT_NAME } from '@/constants/config';
import { useAuth } from '@/contexts/AuthContext';

export default function UserScreen() {
  const { session, signOut } = useAuth();

  return (
    <ScreenShell bottomNav scroll>
      <AppCard className="mx-4 mt-5 gap-2.5 p-5">
        <Text className="text-base font-extrabold text-appText">Account</Text>
        <Text className="text-sm text-appMuted">
          {session?.user.email ?? session?.user.name ?? 'Signed in'}
        </Text>
        <PrimaryButton label="Sign out" onPress={signOut} variant="danger" />
      </AppCard>
      <AppCard className="mx-4 mt-5 gap-2.5 p-5">
        <Text className="text-base font-extrabold text-appText">Current library path</Text>
        <Text className="text-[15px] font-bold text-appAccent">
          drive://{session?.libraryConfig?.rootFolderName ?? DRIVE_ROOT_NAME}/albums
        </Text>
        <Text className="text-[13px] leading-5 text-appMuted">
          To edit an existing library path or name, update in your personal google drive and re-sign in.
        </Text>
      </AppCard>
    </ScreenShell>
  );
}
