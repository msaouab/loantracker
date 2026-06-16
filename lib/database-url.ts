const LEGACY_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

/**
 * Aliases legacy SSL modes (prefer, require, verify-ca) to verify-full, which
 * pg v8+ resolves them to anyway; setting it explicitly silences the pre-v9
 * deprecation warning. Returns the url untouched if it can't be parsed.
 */
function normalizeSslMode(url: string): string {
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

/**
 * Pooled connection for the runtime client (serverless-friendly).
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  return normalizeSslMode(url);
}

/**
 * Direct (non-pooled) connection for schema migrations.
 *
 * `prisma migrate deploy` acquires a Postgres advisory lock, which does not
 * survive PgBouncer transaction pooling — running it against Neon's `-pooler`
 * host times out (P1002, "Timed out trying to acquire a postgres advisory
 * lock"). Migrations must therefore use a direct connection.
 *
 * Prefers an explicit DIRECT_URL / DIRECT_DATABASE_URL; otherwise derives the
 * direct endpoint from DATABASE_URL by stripping Neon's `-pooler` suffix, so
 * deploys work without any extra environment configuration.
 */
export function getDirectDatabaseUrl(): string {
  const explicit = process.env.DIRECT_URL ?? process.env.DIRECT_DATABASE_URL;
  if (explicit) {
    return normalizeSslMode(explicit);
  }

  const pooled = getDatabaseUrl();
  try {
    const parsed = new URL(pooled);
    parsed.hostname = parsed.hostname.replace("-pooler", "");
    return parsed.toString();
  } catch {
    return pooled;
  }
}
