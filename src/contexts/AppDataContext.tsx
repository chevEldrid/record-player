import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createContext } from 'react';

import type { Album, PendingUpload, RootDriveFolders, Track } from '@/domain/models';
import { useAuth } from '@/contexts/AuthContext';
import { DriveRepository } from '@/services/driveRepository';
import {
  deleteLocalFile,
  ensureLocalStore,
  readLibrarySnapshot,
  readPendingUploads,
  writeLibrarySnapshot,
  writePendingUploads,
} from '@/storage/localStore';
import { parseDriveUri } from '@/utils/driveUri';
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
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { session, status: authStatus } = useAuth();
  const [remoteAlbums, setRemoteAlbums] = useState<Album[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [rootFolders, setRootFolders] = useState<RootDriveFolders>();
  const [status, setStatus] = useState<AppDataContextValue['status']>('idle');
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string>();
  const webDownloadUrls = useRef(new Map<string, string>());

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

  useEffect(() => {
    return () => {
      webDownloadUrls.current.forEach((url) => URL.revokeObjectURL(url));
      webDownloadUrls.current.clear();
    };
  }, []);

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
      if (!repository) {
        throw new Error('Sign in first.');
      }

      const album = remoteAlbums.find((candidate) => candidate.id === input.albumId);
      if (!album) {
        throw new Error('Select an album before saving.');
      }

      const online = await hasInternetConnection();
      if (online) {
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
      throw new Error('Offline uploads are not supported in the web app.');
    },
    [refreshLibrary, remoteAlbums, repository]
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

      const existingUrl = webDownloadUrls.current.get(parsed.fileId);
      if (existingUrl) {
        return existingUrl;
      }

      try {
        const blob = await repository.downloadDriveFile(parsed.fileId);
        const objectUrl = URL.createObjectURL(blob);
        webDownloadUrls.current.set(parsed.fileId, objectUrl);
        return objectUrl;
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
