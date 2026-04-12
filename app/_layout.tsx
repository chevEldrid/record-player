import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppDataProvider } from '@/contexts/AppDataContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { PwaProvider } from '@/contexts/PwaContext';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <PwaProvider>
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
            <Stack.Screen name="offline-record" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ headerShown: false }} />
            <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
            <Stack.Screen name="terms-of-service" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
            <Stack.Screen name="albums/[albumId]" options={{ headerShown: false }} />
            <Stack.Screen
              name="modals/create-album"
              options={{ presentation: 'modal', title: 'New Album' }}
            />
            <Stack.Screen
              name="modals/track-details"
              options={{ presentation: 'modal', title: '' }}
            />
          </Stack>
        </AppDataProvider>
      </AuthProvider>
    </PwaProvider>
  );
}
