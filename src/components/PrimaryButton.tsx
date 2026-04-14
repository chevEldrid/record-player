import { ActivityIndicator, Pressable, Text } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: Props) {
  const palette =
    variant === 'secondary'
      ? 'bg-appCardAlt'
      : variant === 'danger'
        ? 'bg-appDanger'
        : 'bg-appText';

  return (
    <Pressable
      accessibilityRole="button"
      className={`min-h-[52px] items-center justify-center rounded-full px-5 ${palette}`}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled || loading ? 0.55 : 1,
        transform: [{ scale: pressed && !disabled && !loading ? 0.985 : 1 }],
      })}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.text : colors.textInverse} />
      ) : (
        <Text
          className={`text-base font-bold ${variant === 'secondary' ? 'text-appText' : 'text-appTextInverse'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
