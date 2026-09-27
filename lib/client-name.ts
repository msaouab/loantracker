/** Collapse internal whitespace and trim — used for display storage. */
export function formatClientNameForStorage(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

/** Normalized lookup key: trim, collapse whitespace, lowercase. */
export function normalizeClientName(name: string) {
  return formatClientNameForStorage(name).toLowerCase();
}

export function isBlankClientName(name: string) {
  return normalizeClientName(name).length === 0;
}
