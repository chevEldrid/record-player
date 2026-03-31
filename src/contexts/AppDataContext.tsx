import { AppState } from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Network from 'expo-network';

import type { Album, PendingUpload, RootDriveFolders, Track } from '@/domain/models';
import { useAuth } from '@/contexts/AuthContext';
import { DriveRepository } from '@/services/driveRepository';
import {
  copyIntoPendingAudio,
  deleteLocalFile,
  ensureLocalStore,
  getDownloadedMediaPath,
  readLibrarySnapshot,
  readPendingUploads,
  writeLibrarySnapshot,
  writePendingUploads,
} from '@/storage/localStore';
import { parseDriveUri } from '@/utils/driveUri';
import { makeId } from '@/utils/id';
import { sortByRecordedAtDesc } from '@/utils/date';

type CreateAlbumInput = {
  name: string;
  imageUri?: string;
};

type SaveTrackInput = {
  albumId: string;
  title: string;
  recordedAt: string;
  tags: string[];
  notes: string;
  transcript: string;
  imageUri?: string;
  audioUri?: string;
  mimeType?: string;
};

type AppDataContextValue = {
  albums: Album[];
  pendingUploads: PendingUpload[];
  rootFolders?: RootDriveFolders;
  status: 'idle' | 'loading' | 'refreshing';
  isSyncing: boolean;
  error?: string;
  refreshLibrary: (silent?: boolean) => Promise<void>;
  createAlbum: (input: CreateAlbumInput) => Promise<Album>;
  saveTrack: (input: SaveTrackInput) => Promise<Track>;
  updateTrack: (
    albumId: string,
    trackId: string,
    changes: Omit<SaveTrackInput, 'albumId' | 'audioUri' | 'mimeType'>
  ) => Promise<Track>;
  syncPendingUploads: () => Promise<void>;
  downloadDriveAsset: (driveUri?: string) => Promise<string | undefined>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function mergePendingUploads(albums: Album[], pendingUploads: PendingUpload[]) {
  return albums.map((album) => {
    const pendingTracks = pendingUploads
      .filter((item) => item.albumId === album.id)
      .map<Track>((item) => ({
        id: item.id,
        albumId: album.id,
        title: item.title,
        recordedAt: item.recordedAt,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
        tags: item.tags,
        notes: item.notes,
        transcript: item.transcript,
        imageUri: item.imageUri,
        audioUri: item.localAudioUri,
        warnings: ['pending-upload'],
        isPendingUpload: true,
        drive: {
          recordingsFolderId: album.drive.recordingsFolderId,
          attachmentsFolderId: album.drive.attachmentsFolderId,
        },
      }));

    return {
      ...album,
      trackCount: album.tracks.length + pendingTracks.length,
      tracks: sortByRecordedAtDesc([...album.tracks, ...pendingTracks]),
    };
  });
}

async function hasInternetConnection() {
  const state = await Network.getNetworkStateAsync();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { session, status: authStatus } = useAuth();
  const [remoteAlbums, setRemoteAlbums] = useState<Album[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [rootFolders, setRootFolders] = useState<RootDriveFolders>();
  const [status, setStatus] = useState<AppDataContextValue['status']>('idle');
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string>();

  const repository = useMemo(
    () => (session ? new DriveRepository(session) : null),
    [session]
  );

  const rehydrateLocalState = useCallback(async () => {
    await ensureLocalStore();
    const [snapshot, queue] = await Promise.all([
      readLibrarySnapshot(),
      readPendingUploads(),
    ]);

    if (snapshot?.albums) {
      setRemoteAlbums(snapshot.albums);
      setRootFolders(snapshot.rootFolders);
    }
    setPendingUploads(queue);
  }, []);

  useEffect(() => {
    rehydrateLocalState();
  }, [rehydrateLocalState]);

  const refreshLibrary = useCallback(
    async (silent = false) => {
      if (!repository || authStatus !== 'signed-in') {
        return;
      }

      const online = await hasInternetConnection();
      if (!online) {
        return;
      }

      setStatus(silent ? 'refreshing' : 'loading');
      try {
        const ensured = await repository.ensureRootFolders();
        const albums = await repository.loadLibrary(ensured);
        setRemoteAlbums(albums);
        setRootFolders(ensured);
        setError(undefined);
        await writeLibrarySnapshot({
          albums,
          updatedAt: new Date().toISOString(),
          rootFolders: ensured,
        });
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : 'Failed to refresh your Drive library.'
        );
      } finally {
        setStatus('idle');
      }
    },
    [authStatus, repository]
  );

  const syncPendingUploads = useCallback(async () => {
    if (!repository || !pendingUploads.length) {
      return;
    }

    const online = await hasInternetConnection();
    if (!online) {
      return;
    }

    setIsSyncing(true);
    try {
      const nextQueue: PendingUpload[] = [];
      let nextAlbums = remoteAlbums;

      for (const item of pendingUploads) {
        const album = nextAlbums.find((candidate) => candidate.id === item.albumId);
        if (!album) {
          nextQueue.push(item);
          continue;
        }

        try {
          await repository.uploadPendingTrack(album, item);
          await deleteLocalFile(item.localAudioUri);
          if (item.imageUri?.startsWith('file://')) {
            await deleteLocalFile(item.imageUri);
          }
        } catch {
          nextQueue.push(item);
        }
      }

      setPendingUploads(nextQueue);
      await writePendingUploads(nextQueue);
      await refreshLibrary(true);
    } finally {
      setIsSyncing(false);
    }
  }, [pendingUploads, refreshLibrary, remoteAlbums, repository]);

  useEffect(() => {
    if (authStatus === 'signed-in') {
      refreshLibrary();
    }
  }, [authStatus, refreshLibrary]);

  useEffect(() => {
    if (authStatus === 'signed-in') {
      syncPendingUploads();
    }
  }, [authStatus, syncPendingUploads]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && authStatus === 'signed-in') {
        refreshLibrary(true);
        syncPendingUploads();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [authStatus, refreshLibrary, syncPendingUploads]);

  const createAlbum = useCallback(
    async (input: CreateAlbumInput) => {
      if (!repository) {
        throw new Error('Sign in first.');
      }

      const online = await hasInternetConnection();
      if (!online) {
        throw new Error('Album creation requires a network connection.');
      }

      const created = await repository.createAlbum(input, rootFolders);
      const nextAlbums = [...remoteAlbums, created].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      setRemoteAlbums(nextAlbums);
      setRootFolders((current) => current);
      await writeLibrarySnapshot({
        albums: nextAlbums,
        updatedAt: new Date().toISOString(),
        rootFolders,
      });
      return created;
    },
    [remoteAlbums, repository, rootFolders]
  );

  const saveTrack = useCallback(
    async (input: SaveTrackInput) => {
      const album = remoteAlbums.find((candidate) => candidate.id === input.albumId);
      if (!album) {
        throw new Error('Select an album before saving.');
      }

      const online = await hasInternetConnection();
      if (repository && online) {
        const saved = await repository.saveTrack({
          album,
          title: input.title,
          recordedAt: input.recordedAt,
          tags: input.tags,
          notes: input.notes,
          transcript: input.transcript,
          imageUri: input.imageUri,
          audioUri: input.audioUri,
          mimeType: input.mimeType,
        });
        await refreshLibrary(true);
        return saved;
      }

      if (!input.audioUri) {
        throw new Error('Metadata-only edits require a network connection.');
      }

      const extension = input.mimeType?.includes('mpeg')
        ? 'mp3'
        : input.mimeType?.includes('wav')
          ? 'wav'
          : 'm4a';
      const localAudioUri = await copyIntoPendingAudio(
        input.audioUri,
        `${makeId('pending')}.${extension}`
      );
      const pending: PendingUpload = {
        id: makeId('pending-track'),
        albumId: input.albumId,
        localAudioUri,
        mimeType: input.mimeType ?? 'audio/m4a',
        createdAt: new Date().toISOString(),
        recordedAt: input.recordedAt,
        title: input.title,
        tags: input.tags,
        notes: input.notes,
        transcript: input.transcript,
        imageUri: input.imageUri,
      };

      const nextQueue = [...pendingUploads, pending];
      setPendingUploads(nextQueue);
      await writePendingUploads(nextQueue);

      return {
        id: pending.id,
        albumId: pending.albumId,
        title: pending.title,
        recordedAt: pending.recordedAt,
        createdAt: pending.createdAt,
        updatedAt: pending.createdAt,
        tags: pending.tags,
        notes: pending.notes,
        transcript: pending.transcript,
        imageUri: pending.imageUri,
        audioUri: pending.localAudioUri,
        warnings: ['pending-upload' as const],
        isPendingUpload: true,
        drive: {
          recordingsFolderId: album.drive.recordingsFolderId,
          attachmentsFolderId: album.drive.attachmentsFolderId,
        },
      };
    },
    [pendingUploads, refreshLibrary, remoteAlbums, repository]
  );

  const updateTrack = useCallback(
    async (
      albumId: string,
      trackId: string,
      changes: Omit<SaveTrackInput, 'albumId' | 'audioUri' | 'mimeType'>
    ) => {
      if (!repository) {
        throw new Error('Sign in first.');
      }

      const album = remoteAlbums.find((candidate) => candidate.id === albumId);
      const track = album?.tracks.find((candidate) => candidate.id === trackId);
      if (!album || !track) {
        throw new Error('Track not found.');
      }
      if (track.isPendingUpload) {
        throw new Error('Pending uploads can be edited after they finish syncing.');
      }

      const online = await hasInternetConnection();
      if (!online) {
        throw new Error('Track edits require a network connection.');
      }

      const saved = await repository.saveTrack({
        album,
        track,
        title: changes.title,
        recordedAt: changes.recordedAt,
        tags: changes.tags,
        notes: changes.notes,
        transcript: changes.transcript,
        imageUri: changes.imageUri,
      });
      await refreshLibrary(true);
      return saved;
    },
    [refreshLibrary, remoteAlbums, repository]
  );

  const downloadDriveAsset = useCallback(
    async (driveUri?: string) => {
      if (!repository || !driveUri) {
        return undefined;
      }

      const parsed = parseDriveUri(driveUri);
      if (!parsed?.fileId) {
        return driveUri;
      }

      const localPath = getDownloadedMediaPath(parsed.fileId, parsed.fileName);
      try {
        return await repository.downloadDriveFileToLocal(parsed.fileId, localPath);
      } catch {
        return undefined;
      }
    },
    [repository]
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      albums: mergePendingUploads(remoteAlbums, pendingUploads),
      pendingUploads,
      rootFolders,
      status,
      isSyncing,
      error,
      refreshLibrary,
      createAlbum,
      saveTrack,
      updateTrack,
      syncPendingUploads,
      downloadDriveAsset,
    }),
    [
      createAlbum,
      downloadDriveAsset,
      error,
      isSyncing,
      pendingUploads,
      refreshLibrary,
      remoteAlbums,
      rootFolders,
      saveTrack,
      status,
      syncPendingUploads,
      updateTrack,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error('useAppData must be used within AppDataProvider.');
  }

  return value;
}
