import { PropsWithChildren, useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { FloatingBottomNav, FLOATING_NAV_HEIGHT } from '@/components/FloatingBottomNav';
import { colors, spacing } from '@/constants/theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  bottomNav?: boolean;
  extendBehindBottomNav?: boolean;
}>;

export function ScreenShell({
  children,
  scroll = false,
  padded = true,
  bottomNav = false,
  extendBehindBottomNav = false,
}: Props) {
  const scrollRef = useRef<ScrollView | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (scroll) {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    }, [scroll])
  );

  const content = (
    <View
      style={[
        styles.content,
        padded && styles.padded,
        bottomNav && !extendBehindBottomNav && styles.bottomNavPadding,
      ]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
      <View style={styles.frame}>
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {content}
          </ScrollView>
        ) : (
          content
        )}
        {bottomNav ? <FloatingBottomNav /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  frame: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bottomNavPadding: {
    paddingBottom: FLOATING_NAV_HEIGHT + spacing.lg,
  },
  padded: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
