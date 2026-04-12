import {
  APP_SCHEMA_VERSION,
  DRIVE_ALBUMS_FOLDER_NAME,
  DRIVE_ROOT_NAME,
} from '@/constants/config';
import type {
  Album,
  AlbumMetadata,
  GoogleSession,
  PendingUpload,
  RootDriveFolders,
  Track,
  TrackMetadata,
  WarningCode,
} from '@/domain/models';
import { DriveApi, type DriveFile } from '@/services/driveApi';
import { formatDisplayDate } from '@/utils/date';
import { makeDriveUri } from '@/utils/driveUri';
import { makeId } from '@/utils/id';
import { fileStem, slugify } from '@/utils/slug';

type CreateAlbumInput = {
  name: string;
  imageUri?: string;
};

type UpsertTrackInput = {
  album: Album;
  track?: Track;
  title: string;
  recordedAt: string;
  tags: string[];
  notes: string;
  imageUri?: string;
  audioUri?: string;
  mimeType?: string;
};

function safeJsonParse<T>(raw?: string | null) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function asAlbumMetadata(value: unknown): AlbumMetadata | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.name !== 'string') {
    return null;
  }

  return {
    schemaVersion: Number(record.schemaVersion ?? APP_SCHEMA_VERSION),
    id: record.id,
    name: record.name,
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? new Date().toISOString()),
    imageFileName:
      typeof record.imageFileName === 'string' ? record.imageFileName : undefined,
  };
}

function asTrackMetadata(value: unknown): TrackMetadata | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string') {
    return null;
  }

  return {
    schemaVersion: Number(record.schemaVersion ?? APP_SCHEMA_VERSION),
    id: record.id,
    albumId: String(record.albumId ?? ''),
    title: String(record.title ?? ''),
    recordedAt: String(record.recordedAt ?? ''),
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? new Date().toISOString()),
    tags: Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    notes: typeof record.notes === 'string' ? record.notes : '',
    imageFileName:
      typeof record.imageFileName === 'string' ? record.imageFileName : undefined,
    audioFileName:
      typeof record.audioFileName === 'string' ? record.audioFileName : undefined,
  };
}

function makeAlbumFolderName(name: string, albumId: string) {
  return `${slugify(name) || 'album'}-${albumId.slice(-4)}`;
}

function makeTrackBaseName(title: string, trackId: string) {
  return `${slugify(title) || 'track'}-${trackId.slice(-4)}`;
}

async function blobFromUri(uri: string) {
  const response = await fetch(uri);
  return response.blob();
}

export class DriveRepository {
  private readonly api: DriveApi;

  constructor(private readonly session: GoogleSession) {
    this.api = new DriveApi(session);
  }

  async ensureRootFolders(): Promise<RootDriveFolders> {
    const configuredRootId = this.session.libraryConfig?.rootFolderId;
    const configuredRootName =
      this.session.libraryConfig?.rootFolderName.trim() || DRIVE_ROOT_NAME;
    const configuredParentId = this.session.libraryConfig?.parentFolderId;
    const rootFolderId = configuredRootId
      ? await this.ensureExistingRootFolder(configuredRootId)
      : await this.ensureFolderByProperty(
          'recordPlayerType',
          'root',
          configuredRootName,
          configuredParentId
        );
    const albumsFolderId = await this.ensureFolderByProperty(
      'recordPlayerType',
      'albums-root',
      DRIVE_ALBUMS_FOLDER_NAME,
      rootFolderId
    );

    return { rootFolderId, albumsFolderId };
  }
  private async ensureExistingRootFolder(rootFolderId: string) {
    const rootFolder = await this.api
      .getFile(rootFolderId)
      .catch(() => null);

    if (!rootFolder || rootFolder.mimeType !== 'application/vnd.google-apps.folder') {
      throw new Error('The selected Pershie library folder is no longer available.');
    }

    return rootFolder.id;
  }

  private async ensureFolderByProperty(
    key: string,
    value: string,
    fallbackName: string,
    parentId?: string
  ) {
    const query = [
      "mimeType = 'application/vnd.google-apps.folder'",
      "trashed = false",
      `appProperties has { key='${key}' and value='${value}' }`,
      parentId ? `'${parentId}' in parents` : null,
    ]
      .filter(Boolean)
      .join(' and ');

    const existing = await this.api.listFiles(query);
    const folder = existing.files[0];
    if (folder) {
      return folder.id;
    }

    const created = await this.api.createFolder(fallbackName, parentId, {
      [key]: value,
    });
    return created.id;
  }

  async loadLibrary(rootFolders?: RootDriveFolders) {
    const folders = rootFolders ?? (await this.ensureRootFolders());
    const albumFolders = await this.api.listFiles(
      [
        `'${folders.albumsFolderId}' in parents`,
        "mimeType = 'application/vnd.google-apps.folder'",
        'trashed = false',
      ].join(' and ')
    );

    const albums = await Promise.all(
      albumFolders.files.map((folder) => this.loadAlbumFromFolder(folder))
    );

    return albums.sort((a, b) => a.name.localeCompare(b.name));
  }

  async createAlbum(input: CreateAlbumInput, rootFolders?: RootDriveFolders) {
    const folders = rootFolders ?? (await this.ensureRootFolders());
    const albumId = makeId('album');
    const now = new Date().toISOString();
    const folder = await this.api.createFolder(
      makeAlbumFolderName(input.name, albumId),
      folders.albumsFolderId,
      {
        recordPlayerType: 'album',
        recordPlayerAlbumId: albumId,
      }
    );

    const recordingsFolder = await this.api.createFolder('recordings', folder.id);
    const attachmentsFolder = await this.api.createFolder('attachments', folder.id);

    let imageFileName: string | undefined;
    if (input.imageUri) {
      imageFileName = `album-cover-${albumId}.jpg`;
      await this.uploadBinaryFile({
        parentId: attachmentsFolder.id,
        fileName: imageFileName,
        mimeType: 'image/jpeg',
        localUri: input.imageUri,
      });
    }

    const metadata: AlbumMetadata = {
      schemaVersion: APP_SCHEMA_VERSION,
      id: albumId,
      name: input.name.trim(),
      createdAt: now,
      updatedAt: now,
      imageFileName,
    };

    await this.api.createTextFile(
      'metadata.json',
      folder.id,
      JSON.stringify(metadata, null, 2),
      'application/json',
      {
        recordPlayerType: 'album-metadata',
        recordPlayerAlbumId: albumId,
      }
    );

    return this.loadAlbumFromFolder(folder);
  }

  async saveTrack(input: UpsertTrackInput) {
    const trackId = input.track?.id ?? makeId('track');
    const now = new Date().toISOString();
    const baseName = makeTrackBaseName(input.title, trackId);
    const metadataName = `${baseName}.json`;
    const audioFileName =
      input.track?.audioUri && input.track.audioUri.endsWith('.m4a')
        ? input.track.audioUri.split('/').pop() ?? `${baseName}.m4a`
        : `${baseName}.m4a`;

    const recordingsFolderId = input.album.drive.recordingsFolderId;
    if (!recordingsFolderId) {
      throw new Error('Album recordings folder is missing.');
    }

    const attachmentsFolderId = input.album.drive.attachmentsFolderId;
    let imageFileName = input.track?.imageUri?.split('/').pop();

    if (input.imageUri && attachmentsFolderId) {
      imageFileName = `${baseName}-image.jpg`;
      await this.uploadBinaryFile({
        parentId: attachmentsFolderId,
        fileName: imageFileName,
        mimeType: 'image/jpeg',
        localUri: input.imageUri,
      });
    }

    let audioDriveFile: DriveFile | undefined;
    if (input.audioUri) {
      audioDriveFile = await this.uploadBinaryFile({
        parentId: recordingsFolderId,
        fileName: audioFileName,
        mimeType: input.mimeType ?? 'audio/m4a',
        localUri: input.audioUri,
      });
    }

    const metadata: TrackMetadata = {
      schemaVersion: APP_SCHEMA_VERSION,
      id: trackId,
      albumId: input.album.id,
      title: input.title.trim() || formatDisplayDate(input.recordedAt),
      recordedAt: input.recordedAt,
      createdAt: input.track?.createdAt ?? now,
      updatedAt: now,
      tags: input.tags,
      notes: input.notes,
      imageFileName,
      audioFileName:
        audioDriveFile?.name ??
        input.track?.audioUri?.split('/').pop() ??
        input.track?.title,
    };

    if (input.track?.drive.metadataFileId) {
      await this.api.updateTextFile(
        input.track.drive.metadataFileId,
        JSON.stringify(metadata, null, 2),
        'application/json'
      );
    } else {
      await this.api.createTextFile(
        metadataName,
        recordingsFolderId,
        JSON.stringify(metadata, null, 2),
        'application/json',
        {
          recordPlayerType: 'track-metadata',
          recordPlayerTrackId: trackId,
          recordPlayerAlbumId: input.album.id,
        }
      );
    }

    const refreshedAlbum = await this.loadAlbumById(input.album.id);
    if (!refreshedAlbum) {
      throw new Error('Track saved, but the album could not be reloaded.');
    }

    const savedTrack = refreshedAlbum.tracks.find((track) => track.id === trackId);
    if (!savedTrack) {
      throw new Error('Track saved, but could not be read back from Drive.');
    }

    return savedTrack;
  }

  async uploadPendingTrack(album: Album, pending: PendingUpload) {
    return this.saveTrack({
      album,
      title: pending.title,
      recordedAt: pending.recordedAt,
      tags: pending.tags,
      notes: pending.notes,
      imageUri: pending.imageUri,
      audioUri: pending.localAudioUri,
      mimeType: pending.mimeType,
    });
  }

  async loadAlbumById(albumId: string) {
    const results = await this.api.listFiles(
      [
        "mimeType = 'application/vnd.google-apps.folder'",
        "trashed = false",
        `appProperties has { key='recordPlayerAlbumId' and value='${albumId}' }`,
      ].join(' and ')
    );

    const match = results.files[0];
    if (!match) {
      return null;
    }

    return this.loadAlbumFromFolder(match);
  }

  async downloadDriveFile(fileId: string) {
    return this.api.downloadBinary(fileId);
  }

  private async uploadBinaryFile(params: {
    parentId: string;
    fileName: string;
    mimeType: string;
    localUri: string;
  }) {
    const blob = await blobFromUri(params.localUri);

    const sessionUrl = await this.api.startResumableUpload(
      {
        name: params.fileName,
        parents: [params.parentId],
      },
      params.mimeType
    );

    return this.api.uploadBlobToSession(sessionUrl, blob, params.mimeType);
  }

  private async loadAlbumFromFolder(folder: DriveFile): Promise<Album> {
    const children = await this.api.listFiles(
      [`'${folder.id}' in parents`, 'trashed = false'].join(' and ')
    );

    const metadataFile = children.files.find((file) => file.name === 'metadata.json');
    const recordingsFolder = children.files.find((file) => file.name === 'recordings');
    const attachmentsFolder = children.files.find((file) => file.name === 'attachments');

    const metadataRaw = metadataFile
      ? await this.api.downloadText(metadataFile.id).catch(() => null)
      : null;
    const metadata = asAlbumMetadata(safeJsonParse(metadataRaw));

    const warnings: WarningCode[] = [];
    if (!metadata) {
      warnings.push('missing-album-metadata');
    }

    const attachmentFiles = attachmentsFolder
      ? await this.api
          .listFiles([`'${attachmentsFolder.id}' in parents`, 'trashed = false'].join(' and '))
          .then((result) => result.files)
      : [];
    const attachmentByName = new Map(attachmentFiles.map((file) => [file.name, file]));

    const tracks = recordingsFolder
      ? await this.loadTracks(
          recordingsFolder.id,
          metadata?.id,
          attachmentsFolder?.id,
          attachmentByName
        )
      : [];

    const imageUri =
      metadata?.imageFileName && attachmentByName.get(metadata.imageFileName)
        ? makeDriveUri(
            attachmentByName.get(metadata.imageFileName)!.id,
            metadata.imageFileName
          )
        : undefined;

    return {
      id:
        metadata?.id ??
        folder.appProperties?.recordPlayerAlbumId ??
        makeId('album-fallback'),
      name: metadata?.name ?? folder.name,
      createdAt: metadata?.createdAt ?? folder.createdTime ?? new Date().toISOString(),
      updatedAt: metadata?.updatedAt ?? folder.modifiedTime ?? new Date().toISOString(),
      imageUri,
      warnings,
      trackCount: tracks.length,
      drive: {
        folderId: folder.id,
        metadataFileId: metadataFile?.id,
        recordingsFolderId: recordingsFolder?.id,
        attachmentsFolderId: attachmentsFolder?.id,
      },
      tracks,
    };
  }

  private async loadTracks(
    recordingsFolderId: string,
    fallbackAlbumId: string | undefined,
    attachmentsFolderId?: string,
    attachmentByName?: Map<string, DriveFile>
  ) {
    const children = await this.api.listFiles(
      [`'${recordingsFolderId}' in parents`, 'trashed = false'].join(' and ')
    );

    const audioByStem = new Map<string, DriveFile>();
    const metadataByStem = new Map<string, { file: DriveFile; metadata: TrackMetadata | null }>();

    await Promise.all(
      children.files.map(async (file) => {
        if (file.mimeType.startsWith('audio/') || /\.(m4a|mp3|wav)$/i.test(file.name)) {
          audioByStem.set(fileStem(file.name), file);
          return;
        }

        if (file.name.endsWith('.json')) {
          const raw = await this.api.downloadText(file.id).catch(() => null);
          metadataByStem.set(fileStem(file.name), {
            file,
            metadata: asTrackMetadata(safeJsonParse(raw)),
          });
        }
      })
    );

    const stems = new Set([...audioByStem.keys(), ...metadataByStem.keys()]);
    const tracks: Track[] = [];

    stems.forEach((stem) => {
      const audioFile = audioByStem.get(stem);
      const metadataRecord = metadataByStem.get(stem);
      const metadata = metadataRecord?.metadata;
      const warnings: WarningCode[] = [];

      if (!metadata) {
        warnings.push('missing-track-metadata');
      }
      if (metadataRecord && !metadata) {
        warnings.push('orphan-metadata');
      }
      if (!metadata?.title) {
        warnings.push('missing-track-title');
      }
      if (!metadata?.recordedAt) {
        warnings.push('missing-recorded-at');
      }

      const recordedAt = metadata?.recordedAt || audioFile?.createdTime;
      const title =
        metadata?.title ||
        audioFile?.name.replace(/\.[^.]+$/, '') ||
        'Untitled track';

      tracks.push({
        id:
          metadata?.id ??
          metadataRecord?.file.appProperties?.recordPlayerTrackId ??
          stem,
        albumId: metadata?.albumId || fallbackAlbumId || '',
        title,
        recordedAt,
        createdAt:
          metadata?.createdAt || audioFile?.createdTime || new Date().toISOString(),
        updatedAt:
          metadata?.updatedAt || audioFile?.modifiedTime || new Date().toISOString(),
        tags: metadata?.tags ?? [],
        notes: metadata?.notes ?? '',
        imageUri:
          metadata?.imageFileName && attachmentByName?.get(metadata.imageFileName)
            ? makeDriveUri(
                attachmentByName.get(metadata.imageFileName)!.id,
                metadata.imageFileName
              )
            : undefined,
        audioUri: audioFile ? makeDriveUri(audioFile.id, audioFile.name) : undefined,
        warnings,
        drive: {
          audioFileId: audioFile?.id,
          metadataFileId: metadataRecord?.file.id,
          recordingsFolderId,
          attachmentsFolderId,
        },
      });
    });

    return tracks.sort((a, b) => {
      const left = a.recordedAt ?? a.createdAt;
      const right = b.recordedAt ?? b.createdAt;
      return new Date(right).getTime() - new Date(left).getTime();
    });
  }
}
