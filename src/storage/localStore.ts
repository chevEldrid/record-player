import * as FileSystem from 'expo-file-system/legacy';

import type { LibrarySnapshot, PendingUpload } from '@/domain/models';

const APP_DIR = `${FileSystem.documentDirectory}record-player`;
const CACHE_FILE = `${APP_DIR}/library-cache.json`;
const QUEUE_FILE = `${APP_DIR}/pending-uploads.json`;
const PENDING_AUDIO_DIR = `${APP_DIR}/pending-audio`;
const DOWNLOADS_DIR = `${APP_DIR}/downloads`;

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

export async function ensureLocalStore() {
  await ensureDir(APP_DIR);
  await ensureDir(PENDING_AUDIO_DIR);
  await ensureDir(DOWNLOADS_DIR);
}

async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      return fallback;
    }

    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(path: string, value: unknown) {
  await ensureLocalStore();
  await FileSystem.writeAsStringAsync(path, JSON.stringify(value, null, 2));
}

export async function readLibrarySnapshot() {
  return readJsonFile<LibrarySnapshot | null>(CACHE_FILE, null);
}

export async function writeLibrarySnapshot(snapshot: LibrarySnapshot) {
  await writeJsonFile(CACHE_FILE, snapshot);
}

export async function readPendingUploads() {
  return readJsonFile<PendingUpload[]>(QUEUE_FILE, []);
}

export async function writePendingUploads(items: PendingUpload[]) {
  await writeJsonFile(QUEUE_FILE, items);
}

export async function copyIntoPendingAudio(sourceUri: string, fileName: string) {
  await ensureLocalStore();
  const destination = `${PENDING_AUDIO_DIR}/${fileName}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export function getDownloadedMediaPath(fileId: string, fileName?: string) {
  const suffix = fileName?.split('.').pop() ?? 'bin';
  return `${DOWNLOADS_DIR}/${fileId}.${suffix}`;
}

export async function deleteLocalFile(path?: string) {
  if (!path) {
    return;
  }

  try {
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      await FileSystem.deleteAsync(path, { idempotent: true });
    }
  } catch {
    // Best effort cleanup for cache and pending files.
  }
}
