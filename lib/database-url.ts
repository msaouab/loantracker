const LEGACY_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

/**
 * Normalizes DATABASE_URL SSL mode for pg v8+ compatibility.
 * Legacy modes (prefer, require, verify-ca) are aliased to verify-full today;
 * setting it explicitly avoids deprecation warnings before pg v9.
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  try {
    const parsed = new URL(url);
    const sslmode = parsed.searchParams.get("sslmode");

    if (sslmode && LEGACY_SSL_MODES.has(sslmode)) {
      parsed.searchParams.set("sslmode", "verify-full");
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}
