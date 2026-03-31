export function makeDriveUri(fileId: string, fileName: string) {
  return `drive://${fileId}/${encodeURIComponent(fileName)}`;
}

export function parseDriveUri(uri?: string | null) {
  if (!uri || !uri.startsWith('drive://')) {
    return null;
  }

  const withoutScheme = uri.replace('drive://', '');
  const [fileId, ...rest] = withoutScheme.split('/');
  return {
    fileId,
    fileName: decodeURIComponent(rest.join('/')),
  };
}
