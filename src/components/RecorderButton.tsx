import { Pressable, View } from 'react-native';

type Props = {
  activeBackgroundClassName: string;
  activeCoreClassName?: string;
  audioLevel: number;
  coreClassName: string;
  disabled?: boolean;
  disabledClassName?: string;
  isLive: boolean;
  onPress: () => void;
  outerClassName: string;
};

export function RecorderButton({
  activeBackgroundClassName,
  activeCoreClassName,
  audioLevel,
  coreClassName,
  disabled,
  disabledClassName,
  isLive,
  onPress,
  outerClassName,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <View
        className={[
          outerClassName,
          isLive ? activeBackgroundClassName : '',
          disabled ? disabledClassName ?? 'opacity-60' : '',
        ].join(' ')}>
        <View
          className={[coreClassName, isLive ? activeCoreClassName ?? '' : ''].join(' ')}
          style={
            isLive
              ? {
                  opacity: 0.75 + audioLevel * 0.25,
                  transform: [{ scale: 1 + audioLevel * 0.18 }],
                }
              : undefined
          }
        />
      </View>
    </Pressable>
  );
}
