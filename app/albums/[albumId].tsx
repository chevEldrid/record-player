import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { DriveImage } from '@/components/DriveImage';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { TrackListItem } from '@/components/TrackListItem';
import { colors, spacing } from '@/constants/theme';
import { useAppData } from '@/contexts/AppDataContext';

export default function AlbumTracksScreen() {
  const { albumId } = useLocalSearchParams<{ albumId: string }>();
  const { albums } = useAppData();
  const router = useRouter();
  const navigation = useNavigation();

  const album = albums.find((candidate) => candidate.id === albumId);

  useLayoutEffect(() => {
    if (!album) {
      return;
    }

    navigation.setOptions({
      title: album.name,
      headerRight: () => (
        <PrimaryButton
          label="Record"
          onPress={() =>
            router.push({
              pathname: '/(app)/record',
              params: { albumId: album.id },
            })
          }
          variant="secondary"
        />
      ),
    });
  }, [album, navigation, router]);

  if (!album) {
    return (
      <ScreenShell>
        <EmptyState title="Album not found" body="This album could not be loaded." />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <View style={styles.hero}>
        <DriveImage label={album.name} size={84} uri={album.imageUri} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{album.name}</Text>
          <Text style={styles.subtitle}>
            {album.trackCount} {album.trackCount === 1 ? 'track' : 'tracks'}
          </Text>
        </View>
      </View>

      {album.tracks.length ? (
        <FlatList
          contentContainerStyle={styles.list}
          data={album.tracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TrackListItem
              onPress={() =>
                router.push({
                  pathname: '/modals/track-details',
                  params: { albumId: album.id, trackId: item.id },
                })
              }
              track={item}
            />
          )}
        />
      ) : (
        <EmptyState
          body="Record the first story or upload an existing audio file to begin the timeline."
          title="No tracks yet"
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
});
