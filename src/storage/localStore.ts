import type { LibrarySnapshot, PendingUpload } from '@/domain/models';

const WEB_CACHE_KEY = 'pershie.library-cache';
const WEB_QUEUE_KEY = 'pershie.pending-uploads';

function readWebStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeWebStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function ensureLocalStore() {
  return;
}

export async function readLibrarySnapshot() {
  return readWebStorage<LibrarySnapshot | null>(WEB_CACHE_KEY, null);
}

export async function writeLibrarySnapshot(snapshot: LibrarySnapshot) {
  writeWebStorage(WEB_CACHE_KEY, snapshot);
}

export async function readPendingUploads() {
  return readWebStorage<PendingUpload[]>(WEB_QUEUE_KEY, []);
}

export async function writePendingUploads(items: PendingUpload[]) {
  writeWebStorage(WEB_QUEUE_KEY, items);
}

export async function copyIntoPendingAudio(sourceUri: string) {
  return sourceUri;
}

export async function deleteLocalFile(path?: string) {
  if (path?.startsWith('blob:')) {
    URL.revokeObjectURL(path);
  }
}
