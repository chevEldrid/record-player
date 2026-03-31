export function formatDisplayDate(value?: string) {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function sortByRecordedAtDesc<T extends { recordedAt?: string; createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const left = a.recordedAt ?? a.createdAt;
    const right = b.recordedAt ?? b.createdAt;
    return new Date(right).getTime() - new Date(left).getTime();
  });
}
