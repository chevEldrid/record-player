import type { GoogleSession } from '@/domain/models';

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  appProperties?: Record<string, string>;
};

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

type RequestOptions = {
  method?: string;
  body?: BodyInit | null;
  headers?: Record<string, string>;
};

type GoogleApiErrorPayload = {
  error?: {
    message?: string;
    errors?: Array<{
      message?: string;
      reason?: string;
    }>;
    details?: Array<{
      reason?: string;
    }>;
  };
};

function parseGoogleApiError(raw?: string | null) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as GoogleApiErrorPayload;
  } catch {
    return null;
  }
}

function getDriveErrorMessage(raw?: string | null, fallback?: string) {
  const parsed = parseGoogleApiError(raw);
  const message =
    parsed?.error?.message ??
    parsed?.error?.errors?.find((entry) => entry.message)?.message;

  return message || raw || fallback || 'Google Drive request failed.';
}

export function isDriveScopeInsufficientError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  const parsed = parseGoogleApiError(error.message);
  const reasons = [
    ...(parsed?.error?.errors?.map((entry) => entry.reason?.toLowerCase() ?? '') ?? []),
    ...(parsed?.error?.details?.map((entry) => entry.reason?.toLowerCase() ?? '') ?? []),
  ];

  return (
    message.includes('insufficient authentication scopes') ||
    message.includes('insufficient permission') ||
    reasons.includes('access_token_scope_insufficient') ||
    reasons.includes('insufficientpermissions')
  );
}

export class DriveApi {
  constructor(private readonly session: GoogleSession) {}

  private async request<T>(path: string, options: RequestOptions = {}) {
    const response = await fetch(`${DRIVE_API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${this.session.accessToken}`,
        ...(options.body && !(options.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(options.headers ?? {}),
      },
      body: options.body,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(getDriveErrorMessage(message, 'Google Drive request failed.'));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  private async uploadRequest(path: string, options: RequestOptions = {}) {
    const response = await fetch(`${DRIVE_UPLOAD_BASE}${path}`, {
      method: options.method ?? 'POST',
      headers: {
        Authorization: `Bearer ${this.session.accessToken}`,
        ...(options.headers ?? {}),
      },
      body: options.body,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(getDriveErrorMessage(message, 'Google Drive upload failed.'));
    }

    return response;
  }

  listFiles(query: string) {
    const params = new URLSearchParams({
      q: query,
      fields:
        'files(id,name,mimeType,createdTime,modifiedTime,parents,appProperties)',
      pageSize: '200',
      includeItemsFromAllDrives: 'false',
      supportsAllDrives: 'false',
    });

    return this.request<{ files: DriveFile[] }>(`/files?${params.toString()}`);
  }

  async getFile(fileId: string) {
    const params = new URLSearchParams({
      fields: 'id,name,mimeType,createdTime,modifiedTime,parents,appProperties',
    });

    return this.request<DriveFile>(`/files/${fileId}?${params.toString()}`);
  }

  async createFolder(
    name: string,
    parentId?: string,
    appProperties?: Record<string, string>
  ) {
    return this.request<DriveFile>('/files', {
      method: 'POST',
      body: JSON.stringify({
        name,
        parents: parentId ? [parentId] : undefined,
        mimeType: 'application/vnd.google-apps.folder',
        appProperties,
      }),
    });
  }

  async updateMetadata(fileId: string, metadata: Record<string, unknown>) {
    return this.request<DriveFile>(`/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify(metadata),
    });
  }

  async createTextFile(
    name: string,
    parentId: string,
    content: string,
    mimeType: string,
    appProperties?: Record<string, string>
  ) {
    const boundary = `pershie-${Date.now()}`;
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify({
        name,
        parents: [parentId],
        mimeType,
        appProperties,
      }),
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      '',
      content,
      `--${boundary}--`,
    ].join('\r\n');

    const response = await this.uploadRequest('/files?uploadType=multipart', {
      body,
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
    });

    return (await response.json()) as DriveFile;
  }

  async updateTextFile(fileId: string, content: string, mimeType: string) {
    const response = await this.uploadRequest(`/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      body: content,
      headers: {
        'Content-Type': mimeType,
      },
    });

    return (await response.json()) as DriveFile;
  }

  async startResumableUpload(metadata: Record<string, unknown>, mimeType: string) {
    const response = await this.uploadRequest('/files?uploadType=resumable', {
      method: 'POST',
      body: JSON.stringify(metadata),
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType,
      },
    });

    const location = response.headers.get('Location');
    if (!location) {
      throw new Error('Drive resumable upload did not return a session URL.');
    }

    return location;
  }

  async uploadBlobToSession(sessionUrl: string, blob: Blob, mimeType: string) {
    const response = await fetch(sessionUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.session.accessToken}`,
        'Content-Type': mimeType,
      },
      body: blob,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(getDriveErrorMessage(message, 'Drive file content upload failed.'));
    }

    return (await response.json()) as DriveFile;
  }

  async downloadText(fileId: string) {
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${this.session.accessToken}`,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(getDriveErrorMessage(message, 'Failed to download file content.'));
    }

    return response.text();
  }

  async downloadBinary(fileId: string) {
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${this.session.accessToken}`,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(getDriveErrorMessage(message, 'Failed to download binary file.'));
    }

    return response.blob();
  }
}
