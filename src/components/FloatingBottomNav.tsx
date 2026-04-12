import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/constants/theme';

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
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {navItems.map((item) => {
          const isActive = item.key === activeSection;

          return (
            <View key={item.label} style={styles.navSlot}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push(item.route)}
                style={({ pressed }) => [
                  styles.navButton,
                  isActive && styles.navButtonActive,
                  pressed && styles.navButtonPressed,
                ]}>
                <View style={styles.navLabelWrap}>
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
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

const styles = StyleSheet.create({
  wrapper: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bar: {
    alignItems: 'center',
    backgroundColor: 'rgba(36, 25, 16, 0.93)',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    flexDirection: 'row',
    minHeight: 84,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 1,
    shadowRadius: 28,
  },
  navSlot: {
    alignItems: 'center',
    flex: 1,
  },
  navButton: {
    borderRadius: radii.pill,
    minWidth: 100,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  navButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  navButtonPressed: {
    opacity: 0.84,
  },
  navLabelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  navLabel: {
    color: '#F0DDC8',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  navLabelActive: {
    color: '#FFFFFF',
  },
});
