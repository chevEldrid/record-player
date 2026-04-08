import { useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';

import { AlbumCard } from '@/components/AlbumCard';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { colors, spacing } from '@/constants/theme';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/contexts/AuthContext';

export default function LibraryScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { albums, error, isSyncing, refreshLibrary, rootFolders, status } = useAppData();
  const { session, signOut } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <PrimaryButton
          label="+ Album"
          onPress={() => router.push('/modals/create-album')}
          variant="secondary"
        />
      ),
    });
  }, [navigation, router]);

  return (
    <ScreenShell>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Library</Text>
          <Text style={styles.subtitle}>
            {session?.user.name ?? session?.user.email ?? 'Signed in'}
          </Text>
          <Text style={styles.libraryPath}>
            {session?.libraryConfig?.rootFolderName ?? 'Pershie'}
            {rootFolders ? '/albums' : ''}
          </Text>
        </View>
        <PrimaryButton label="Sign out" onPress={signOut} variant="secondary" />
      </View>

      {isSyncing ? <Text style={styles.syncing}>Syncing pending uploads...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {status === 'loading' && !albums.length ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.text} size="large" />
        </View>
      ) : albums.length ? (
        <FlatList
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          data={albums}
          keyExtractor={(item) => item.id}
          numColumns={2}
          onRefresh={() => refreshLibrary()}
          refreshing={status === 'refreshing'}
          renderItem={({ item }) => (
            <AlbumCard
              album={item}
              onPress={() =>
                router.push({
                  pathname: '/albums/[albumId]',
                  params: { albumId: item.id },
                })
              }
            />
          )}
        />
      ) : (
        <EmptyState
          body="Create your first album to start collecting stories, voice notes, and personal history."
          title="No albums yet"
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  libraryPath: {
    color: colors.accent,
    fontSize: 12,
    marginTop: 6,
  },
  syncing: {
    color: colors.accent,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  loader: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  grid: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  gridRow: {
    gap: spacing.md,
  },
});
