import { Text, TextInput, View } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  helper?: string;
};

export function LabeledField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  helper,
}: Props) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-appText">{label}</Text>
      <TextInput
        className={[
          'rounded-appMd border border-appBorder bg-appCard px-4 py-[14px] text-base text-appText',
          multiline ? 'min-h-[120px]' : '',
        ].join(' ')}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={multiline ? { textAlignVertical: 'top' } : undefined}
        value={value}
      />
      {helper ? <Text className="text-xs text-appMuted">{helper}</Text> : null}
    </View>
  );
}
