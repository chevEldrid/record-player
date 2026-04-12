import { PropsWithChildren } from 'react';
import { View } from 'react-native';

type Props = PropsWithChildren<{
  className?: string;
}>;

export function AppCard({ children, className }: Props) {
  return (
    <View
      className={`rounded-appLg border border-appBorder bg-appCard p-4 ${className ?? ''}`.trim()}>
      {children}
    </View>
  );
}
