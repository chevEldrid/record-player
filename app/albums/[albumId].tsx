import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { FlatList, Text, View } from 'react-native';

import { DriveImage } from '@/components/DriveImage';
import { EmptyState } from '@/components/EmptyState';
import { ScreenShell } from '@/components/ScreenShell';
import { TrackListItem } from '@/components/TrackListItem';
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
      <View className="mb-5 items-center gap-4 px-4 pt-5">
        <View className="rounded-appLg border border-appBorder bg-appCard p-4">
          <DriveImage label={album.name} size={104} uri={album.imageUri} />
        </View>
        <Text className="text-center text-[26px] font-extrabold text-appText">{album.name}</Text>
      </View>

      {album.tracks.length ? (
        <View className="relative flex-1">
          <View className="absolute bottom-10 left-[22px] top-[10px] w-[3px] bg-appAccentSoft" />
          <FlatList
            contentContainerStyle={{ gap: 16, paddingBottom: 40, paddingHorizontal: 16 }}
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
