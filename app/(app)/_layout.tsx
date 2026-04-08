import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';

export default function AppLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return null;
  }

  if (status !== 'signed-in') {
    return <Redirect href="/auth/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
      }}>
      <Tabs.Screen name="library" options={{ title: 'Library', tabBarLabel: 'Library' }} />
      <Tabs.Screen name="record" options={{ title: 'Record', tabBarLabel: 'Record' }} />
      <Tabs.Screen name="help" options={{ title: 'Help', tabBarLabel: 'Help' }} />
    </Tabs>
  );
}
