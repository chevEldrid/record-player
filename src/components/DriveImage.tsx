import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/constants/theme';
import { useAppData } from '@/contexts/AppDataContext';

type Props = {
  uri?: string;
  label: string;
  size?: number;
  rounded?: boolean;
};

export function DriveImage({ uri, label, size = 72, rounded = false }: Props) {
  const { downloadDriveAsset } = useAppData();
  const [resolvedUri, setResolvedUri] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function resolveUri() {
      if (!uri) {
        setResolvedUri(undefined);
        return;
      }

      if (!uri.startsWith('drive://')) {
        setResolvedUri(uri);
        return;
      }

      const localUri = await downloadDriveAsset(uri);
      if (!cancelled) {
        setResolvedUri(localUri);
      }
    }

    resolveUri();
    return () => {
      cancelled = true;
    };
  }, [downloadDriveAsset, uri]);

  if (!resolvedUri) {
    return (
      <View
        style={[
          styles.placeholder,
          { height: size, width: size, borderRadius: rounded ? size / 2 : radii.md },
        ]}>
        <Text style={styles.placeholderText}>{label.slice(0, 1).toUpperCase()}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={{
        height: size,
        width: size,
        borderRadius: rounded ? size / 2 : radii.md,
      }}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
});
