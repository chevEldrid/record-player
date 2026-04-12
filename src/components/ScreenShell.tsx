import { PropsWithChildren, useCallback, useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { FloatingBottomNav, FLOATING_NAV_HEIGHT } from '@/components/FloatingBottomNav';

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
      className={`flex-1 bg-appBg ${padded ? 'px-4 pt-4' : ''}`}
      style={bottomNav && !extendBehindBottomNav ? { paddingBottom: FLOATING_NAV_HEIGHT + 20 } : undefined}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-appBg" edges={['left', 'right', 'bottom']}>
      <View className="flex-1 bg-appBg">
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            className="flex-1 bg-appBg"
            contentContainerStyle={{ backgroundColor: '#FFBD59', flexGrow: 1 }}
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
