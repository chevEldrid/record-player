import { createElement } from 'react';
import { Platform, Text, View } from 'react-native';

import { colors, radii } from '@/constants/theme';
import { LabeledField } from '@/components/LabeledField';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  helper?: string;
};

export function DateField({ label, value, onChangeText, placeholder, helper }: Props) {
  if (Platform.OS !== 'web') {
    return (
      <LabeledField
        helper={helper}
        label={label}
        onChangeText={onChangeText}
        placeholder={placeholder}
        value={value}
      />
    );
  }

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-appText">{label}</Text>
      {createElement('input', {
        type: 'date',
        value,
        placeholder,
        onChange: (event: { target: { value: string } }) => onChangeText(event.target.value),
        style: {
          appearance: 'none',
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.md,
          borderStyle: 'solid',
          borderWidth: 1,
          color: colors.text,
          fontFamily: 'inherit',
          fontSize: 16,
          minHeight: 52,
          padding: '14px 16px',
          width: '100%',
        },
      })}
      {helper ? <Text className="text-xs text-appMuted">{helper}</Text> : null}
    </View>
  );
}
