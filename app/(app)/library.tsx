import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlbumCard } from '@/components/AlbumCard';
import { FLOATING_NAV_HEIGHT } from '@/components/FloatingBottomNav';
import { ScreenShell } from '@/components/ScreenShell';
import { colors } from '@/constants/theme';
import { useAppData } from '@/contexts/AppDataContext';
import type { Album } from '@/domain/models';

function chunkAlbums(items: Album[], size: number) {
  const rows: Album[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}

function fillShelfRow(row: Album[], size: number) {
  return [
    ...row,
    ...Array.from({ length: Math.max(size - row.length, 0) }, (_, index) => ({
      id: `shelf-spacer-${index}`,
      name: '',
    })) as Album[],
  ];
}

function estimateShelfCount(height: number) {
  if (height >= 980) {
    return 5;
  }

  if (height >= 760) {
    return 4;
  }

  return 3;
}

function AddAlbumTile({
  onPress,
  size,
}: {
  onPress: () => void;
  size: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className="overflow-hidden rounded-lg border border-[#8B5B2F] bg-[#E6D0B0]"
      onPress={onPress}
      style={({ pressed }) => ({
        shadowColor: 'rgba(43, 25, 10, 0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
        height: size,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        width: size,
      })}>
      <View className="flex-1 items-center justify-center p-0">
        <View
          className="items-center justify-center rounded-appMd bg-appCardAlt"
          style={{ height: size, width: size }}>
          <Text className="text-[42px] font-[200] leading-[44px] text-[#7A4A20]">+</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const { albums, error, isSyncing, requiresDriveReauth, status } = useAppData();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const shelfColumns = width >= 900 ? 5 : width >= 640 ? 4 : 3;
  const coverSize = width >= 900 ? 140 : width >= 640 ? 122 : 96;
  const targetShelfCount = estimateShelfCount(height);
  const minimumShelfHeight = height + FLOATING_NAV_HEIGHT + insets.bottom;
  const shelfItems = useMemo(
    () => [...albums, { id: 'create-album-tile' } as Album],
    [albums]
  );

  const populatedRows = useMemo(
    () => chunkAlbums(shelfItems, shelfColumns),
    [shelfColumns, shelfItems]
  );
  const shelfRows = useMemo(() => {
    const extraShelves = Math.max(targetShelfCount - populatedRows.length, 0);
    return [
      ...populatedRows,
      ...Array.from({ length: extraShelves }, (_, index) => [
        {
          id: `empty-shelf-${index}`,
          name: '',
        } as Album,
      ]),
    ];
  }, [populatedRows, targetShelfCount]);

  return (
    <ScreenShell bottomNav extendBehindBottomNav padded={false}>
      {isSyncing ? <Text className="px-4 pt-2.5 text-[13px] text-appAccent">Syncing pending uploads...</Text> : null}
      {error && !requiresDriveReauth ? (
        <Text className="px-4 pt-2.5 text-[13px] text-appDanger">{error}</Text>
      ) : null}

      {status === 'loading' && !albums.length ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.text} size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 bg-[#C78E4A]"
          contentContainerStyle={{ backgroundColor: '#C78E4A', flexGrow: 1, paddingBottom: 0 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View
            className="flex-1 overflow-hidden bg-[#C78E4A] px-4 pt-5"
            style={{ minHeight: minimumShelfHeight, paddingBottom: FLOATING_NAV_HEIGHT + 28 }}>
            {shelfRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} className="relative mb-5 min-h-[188px] flex-1">
                <View
                  className="absolute inset-x-0 top-0 rounded-t-[10px] border-x-[8px] border-x-[rgba(90,51,23,0.15)] bg-[#D8A161]"
                  style={{ bottom: 18 }}
                />
                <View className="flex-row justify-evenly px-2.5 pt-4">
                  {fillShelfRow(row, shelfColumns).map((album) => (
                    <View key={album.id} className="flex-1 items-center">
                      {album.id.startsWith('empty-shelf-') ||
                        album.id.startsWith('shelf-spacer-') ? (
                        <View style={{ width: coverSize, height: coverSize }} />
                      ) : album.id === 'create-album-tile' ? (
                        <AddAlbumTile
                          onPress={() => router.push('/albums/new')}
                          size={coverSize}
                        />
                      ) : (
                        <AlbumCard
                          album={album}
                          onPress={() =>
                            router.push({
                              pathname: '/albums/[albumId]',
                              params: { albumId: album.id },
                            })
                          }
                          size={coverSize}
                        />
                      )}
                    </View>
                  ))}
                </View>
                <View className="mt-2.5 h-[18px] rounded-lg border-b-4 border-b-[#8C5422] bg-[#B77935]" />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenShell>
  );
}
