export function normalizeSearch(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function compareText(a: unknown, b: unknown): number {
  const left = normalizeSearch(a);
  const right = normalizeSearch(b);
  return left.localeCompare(right);
}
