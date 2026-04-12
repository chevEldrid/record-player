import { Link } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

import { ScreenShell } from '@/components/ScreenShell';

type ContentPageProps = PropsWithChildren<{
  meta?: string;
  title: string;
}>;

export function ContentPage({ children, meta, title }: ContentPageProps) {
  return (
    <ScreenShell scroll>
      <Link className="mb-5 text-[32px] leading-8 text-appText" href="/">
        ←
      </Link>

      <View className="mb-7 gap-2">
        <Text className="text-[30px] font-extrabold text-appText">{title}</Text>
        {meta ? <Text className="text-[13px] text-appMuted">{meta}</Text> : null}
      </View>

      {children}
    </ScreenShell>
  );
}

type SectionProps = PropsWithChildren<{
  heading?: string;
}>;

export function ContentSection({ children, heading }: SectionProps) {
  return (
    <View className="mb-7 gap-2">
      {heading ? <Text className="text-lg font-bold text-appText">{heading}</Text> : null}
      {children}
    </View>
  );
}

export function ContentBody({ children }: PropsWithChildren) {
  return <Text className="text-[15px] leading-6 text-appMuted">{children}</Text>;
}
