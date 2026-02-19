export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function getAgeYears(dob: unknown, today = new Date()): number | null {
  const date = toDate(dob);
  if (!date || isNaN(date.getTime())) return null;

  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age;
}

export function formatDobWithAge(dateOfBirth: unknown, locale = 'en-US'): string {
  const dob = toDate(dateOfBirth);
  if (!dob) return typeof dateOfBirth === 'string' ? dateOfBirth : '-';

  const age = getAgeYears(dob);

  let formattedDob = '';
  try {
    formattedDob = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(dob);
  } catch {
    formattedDob = dob.toLocaleDateString(locale, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }

  if (age === null) return formattedDob;
  return `${formattedDob} (${age} y.o.)`;
}
