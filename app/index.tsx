import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/theme';

export default function IndexScreen() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: colors.background,
          flex: 1,
          justifyContent: 'center',
        }}>
        <ActivityIndicator color={colors.text} size="large" />
      </View>
    );
  }

  if (status === 'signed-in') {
    return <Redirect href="/(app)/library" />;
  }

  return <Redirect href="/auth/sign-in" />;
}
