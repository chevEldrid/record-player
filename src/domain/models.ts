export type GoogleSession = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  tokenType?: string;
  expiresAt?: number;
  scopes: string[];
  libraryConfig?: LibraryConfig;
  user: {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
};

export type LibraryConfig = {
  rootFolderName: string;
  rootFolderId?: string;
  parentFolderId?: string;
};

export type DrivePointers = {
  fileId?: string;
  folderId?: string;
  parentFolderId?: string;
};

export type WarningCode =
  | 'missing-album-metadata'
  | 'missing-track-metadata'
  | 'missing-audio-file'
  | 'missing-track-title'
  | 'missing-recorded-at'
  | 'pending-upload'
  | 'orphan-metadata';

export type AlbumMetadata = {
  schemaVersion: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  imageFileName?: string;
};

export type TrackMetadata = {
  schemaVersion: number;
  id: string;
  albumId: string;
  title: string;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  notes: string;
  transcript: string;
  imageFileName?: string;
  audioFileName?: string;
};

export type Album = {
  id: string;
  name: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
  warnings: WarningCode[];
  trackCount: number;
  drive: {
    folderId: string;
    metadataFileId?: string;
    recordingsFolderId?: string;
    attachmentsFolderId?: string;
  };
  tracks: Track[];
};

export type Track = {
  id: string;
  albumId: string;
  title: string;
  recordedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  notes: string;
  transcript: string;
  imageUri?: string;
  audioUri?: string;
  warnings: WarningCode[];
  isPendingUpload?: boolean;
  drive: {
    audioFileId?: string;
    metadataFileId?: string;
    imageFileId?: string;
    recordingsFolderId?: string;
    attachmentsFolderId?: string;
  };
};

export type RootDriveFolders = {
  rootFolderId: string;
  albumsFolderId: string;
};

export type PendingUpload = {
  id: string;
  albumId: string;
  localAudioUri: string;
  mimeType: string;
  createdAt: string;
  recordedAt: string;
  title: string;
  tags: string[];
  notes: string;
  transcript: string;
  imageUri?: string;
};

export type LibrarySnapshot = {
  albums: Album[];
  updatedAt: string;
  rootFolders?: RootDriveFolders;
};
