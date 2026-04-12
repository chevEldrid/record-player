import { Text, View } from 'react-native';

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View className="items-center justify-center px-5 py-10">
      <Text className="mb-1.5 text-center text-[20px] font-bold text-appText">{title}</Text>
      <Text className="text-center text-[15px] leading-[22px] text-appMuted">{body}</Text>
    </View>
  );
}
