import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type NavItem = {
  key: 'library' | 'record' | 'user';
  label: string;
  route: '/(app)/library' | '/(app)/record' | '/(app)/user';
};

const navItems: NavItem[] = [
  { key: 'library', label: 'Library', route: '/(app)/library' },
  { key: 'record', label: 'Record', route: '/(app)/record' },
  { key: 'user', label: 'User', route: '/(app)/user' },
];

export const FLOATING_NAV_HEIGHT = 108;

function normalizePathname(pathname: string) {
  return pathname.replace(/\/\([^/]+\)/g, '') || '/';
}

function getActiveSection(pathname: string): NavItem['key'] | null {
  const normalizedPath = normalizePathname(pathname);

  if (
    normalizedPath === '/library' ||
    normalizedPath.startsWith('/library/') ||
    normalizedPath.startsWith('/albums/')
  ) {
    return 'library';
  }

  if (normalizedPath === '/record' || normalizedPath.startsWith('/record/')) {
    return 'record';
  }

  if (normalizedPath === '/user' || normalizedPath.startsWith('/user/')) {
    return 'user';
  }

  return null;
}

export function FloatingBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const activeSection = getActiveSection(pathname);

  return (
    <View className="absolute bottom-0 left-0 right-0" pointerEvents="box-none">
      <View
        className="min-h-[84px] flex-row items-center rounded-t-appLg bg-appNav px-4 pt-5"
        style={{
          paddingBottom: Math.max(insets.bottom, 12),
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 1,
          shadowRadius: 28,
        }}>
        {navItems.map((item) => {
          const isActive = item.key === activeSection;

          return (
            <View key={item.label} className="flex-1 items-center">
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(item.route)}
                className={`min-w-[100px] rounded-full px-1.5 py-2.5 ${isActive ? 'bg-appNavActive' : ''}`}
                style={({ pressed }) => ({ opacity: pressed ? 0.84 : 1 })}>
                <View className="w-full items-center justify-center">
                  <Text
                    className={`text-center text-[13px] font-bold ${isActive ? 'text-appTextInverse' : 'text-appNavInactive'}`}>
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
