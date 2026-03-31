import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppDataProvider } from '@/contexts/AppDataContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background },
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="albums/[albumId]" options={{ title: 'Tracks' }} />
          <Stack.Screen
            name="modals/create-album"
            options={{ presentation: 'modal', title: 'New Album' }}
          />
          <Stack.Screen
            name="modals/track-details"
            options={{ presentation: 'modal', title: 'Track Details' }}
          />
        </Stack>
      </AppDataProvider>
    </AuthProvider>
  );
}
