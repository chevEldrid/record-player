import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { DriveImage } from '@/components/DriveImage';
import { EmptyState } from '@/components/EmptyState';
import { ScreenShell } from '@/components/ScreenShell';
import { TrackListItem } from '@/components/TrackListItem';
import { colors, radii, spacing } from '@/constants/theme';
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
      title: '',
    });
  }, [album, navigation]);

  if (!album) {
    return (
      <ScreenShell bottomNav>
        <EmptyState title="Album not found" body="This album could not be loaded." />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell bottomNav>
      <View style={styles.hero}>
        <View style={styles.coverWrap}>
          <DriveImage label={album.name} size={104} uri={album.imageUri} />
        </View>
        <Text style={styles.title}>{album.name}</Text>
      </View>

      {album.tracks.length ? (
        <View style={styles.timelineWrap}>
          <View style={styles.timelineLine} />
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
        </View>
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
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  coverWrap: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  timelineWrap: {
    flex: 1,
    position: 'relative',
  },
  timelineLine: {
    backgroundColor: colors.accentSoft,
    bottom: spacing.xxl,
    left: spacing.md + 6,
    position: 'absolute',
    top: 10,
    width: 3,
  },
});
