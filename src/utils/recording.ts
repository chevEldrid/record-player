export function extensionForMimeType(mimeType: string) {
  if (mimeType.includes('mpeg')) {
    return 'mp3';
  }

  if (mimeType.includes('webm')) {
    return 'webm';
  }

  return 'm4a';
}

export function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export async function downloadAudioFile(recordedUri: string, fileName: string) {
  const response = await fetch(recordedUri);
  if (!response.ok) {
    throw new Error('Could not read the recorded audio.');
  }

  const audioBlob = await response.blob();
  downloadBlob(audioBlob, fileName);
}
