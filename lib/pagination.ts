export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function parsePage(value: string | null) {
  return Math.max(1, Number(value ?? 1));
}

export function parsePageSize(
  value: string | null,
  defaultSize = DEFAULT_PAGE_SIZE,
  maxSize = MAX_PAGE_SIZE
) {
  const parsed = Number(value ?? defaultSize);
  if (!Number.isFinite(parsed)) {
    return defaultSize;
  }
  return Math.min(maxSize, Math.max(1, parsed));
}
