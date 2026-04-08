function parseDateValue(value?: string) {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDisplayDate(value?: string) {
  if (!value) {
    return 'Date unavailable';
  }

  const date = parseDateValue(value);
  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDisplayDateOnly(value?: string) {
  if (!value) {
    return 'Date unavailable';
  }

  const date = parseDateValue(value);
  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date);
}

export function toDateInputValue(value?: string) {
  if (!value) {
    return '';
  }

  const date = parseDateValue(value);
  if (!date) {
    return value.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function sortByRecordedAtDesc<T extends { recordedAt?: string; createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const left = a.recordedAt ?? a.createdAt;
    const right = b.recordedAt ?? b.createdAt;
    return new Date(right).getTime() - new Date(left).getTime();
  });
}
