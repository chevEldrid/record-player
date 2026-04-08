import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

import { AlbumCard } from '@/components/AlbumCard';
import { EmptyState } from '@/components/EmptyState';
import { ScreenShell } from '@/components/ScreenShell';
import { colors, radii, spacing } from '@/constants/theme';
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
      onPress={onPress}
      style={({ pressed }) => [
        styles.addTile,
        { width: size, height: size },
        pressed && styles.addTilePressed,
      ]}>
      <Text style={styles.addTilePlus}>+</Text>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const { albums, error, isSyncing, status } = useAppData();
  const { height, width } = useWindowDimensions();
  const shelfColumns = width >= 900 ? 5 : width >= 640 ? 4 : 3;
  const coverSize = width >= 900 ? 140 : width >= 640 ? 122 : 96;
  const targetShelfCount = estimateShelfCount(height);
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
      {isSyncing ? <Text style={styles.syncing}>Syncing pending uploads...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {status === 'loading' && !albums.length ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.text} size="large" />
        </View>
      ) : albums.length ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.bookshelf, { minHeight: height - 92 }]}>
            {shelfRows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.shelfSection}>
                <View style={styles.shelfBack} />
                <View style={styles.row}>
                  {fillShelfRow(row, shelfColumns).map((album) => (
                    <View key={album.id} style={styles.bookSlot}>
                      {album.id.startsWith('empty-shelf-') ||
                      album.id.startsWith('shelf-spacer-') ? (
                        <View style={{ width: coverSize, height: coverSize }} />
                      ) : album.id === 'create-album-tile' ? (
                        <AddAlbumTile
                          onPress={() => router.push('/modals/create-album')}
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
                <View style={styles.shelfLip} />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyWrap}>
          <EmptyState
            body="Tap the + tile on the shelf to start a new album."
            title="No albums yet"
          />
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  syncing: {
    color: colors.accent,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  loader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  bookshelf: {
    backgroundColor: '#C78E4A',
    flex: 1,
    overflow: 'hidden',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  shelfSection: {
    flex: 1,
    marginBottom: spacing.lg,
    minHeight: 188,
    position: 'relative',
  },
  shelfBack: {
    backgroundColor: '#D8A161',
    borderColor: 'rgba(90, 51, 23, 0.15)',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    bottom: 18,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  bookSlot: {
    alignItems: 'center',
    flex: 1,
  },
  shelfLip: {
    backgroundColor: '#B77935',
    borderBottomColor: '#8C5422',
    borderBottomWidth: 4,
    borderRadius: 8,
    height: 18,
    marginTop: spacing.sm,
  },
  addTile: {
    alignItems: 'center',
    backgroundColor: '#E8D1B0',
    borderColor: '#8B5B2F',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
  },
  addTilePressed: {
    transform: [{ scale: 0.98 }],
  },
  addTilePlus: {
    color: '#7A4A20',
    fontSize: 42,
    fontWeight: '200',
    lineHeight: 44,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
});
