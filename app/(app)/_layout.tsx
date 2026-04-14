import { Redirect, Tabs, usePathname } from 'expo-router';

import { DrivePermissionGate } from '@/components/DrivePermissionGate';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';

export default function AppLayout() {
  const { status } = useAuth();
  const pathname = usePathname();

  if (status === 'loading') {
    return null;
  }

  if (status !== 'signed-in' && pathname !== '/record') {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          tabBarStyle: { display: 'none' },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textMuted,
        }}>
        <Tabs.Screen name="library" options={{ title: 'Library', tabBarLabel: 'Library' }} />
        <Tabs.Screen name="record" options={{ title: 'Record', tabBarLabel: 'Record' }} />
        <Tabs.Screen name="user" options={{ title: 'User', tabBarLabel: 'User' }} />
      </Tabs>
      {status === 'signed-in' ? <DrivePermissionGate /> : null}
    </>
  );
}
