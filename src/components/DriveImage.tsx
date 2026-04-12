import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';

import { radii } from '@/constants/theme';
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
        className="items-center justify-center bg-appCardAlt"
        style={{ height: size, width: size, borderRadius: rounded ? size / 2 : radii.md }}>
        <Text className="text-[28px] font-bold text-appText">
          {label.slice(0, 1).toUpperCase()}
        </Text>
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
