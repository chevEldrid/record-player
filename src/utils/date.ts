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

function pad(value: number) {
  return `${value}`.padStart(2, '0');
}

export function toLocalTimestampMinute(date = new Date()) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absoluteOffset / 60));
  const offsetRemainder = pad(absoluteOffset % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:00${sign}${offsetHours}:${offsetRemainder}`;
}

export function formatTimestampFileLabel(value?: string) {
  const date = parseDateValue(value);
  if (!date) {
    return 'recording';
  }

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}_${hours}-${minutes}`;
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

export function todayDateInputValue() {
  return toDateInputValue(new Date().toISOString());
}

export function sortByOccurredAtDesc<T extends { occurredAt?: string; recordedAt?: string; createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const left = a.occurredAt ?? a.recordedAt ?? a.createdAt;
    const right = b.occurredAt ?? b.recordedAt ?? b.createdAt;
    return new Date(right).getTime() - new Date(left).getTime();
  });
}
