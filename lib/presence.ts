/**
 * Presence ("online / last seen") tuning.
 *
 * The app uses stateless JWT sessions, so "online" is not a real connection
 * state — it means "active within a recent window." The client sends a
 * heartbeat while its tab is visible; `lastSeenAt` is the last heartbeat, and a
 * user is considered online if that timestamp is within the online window.
 */

/** How often the client pings /api/presence while the tab is visible. */
export const PRESENCE_HEARTBEAT_MS = 60_000;

/**
 * A user counts as online if seen within this window. Set to ~2.5× the
 * heartbeat so a single dropped beat doesn't flip them offline.
 */
export const PRESENCE_ONLINE_WINDOW_MS = 150_000;

/** Server-side coalesce: skip the write if lastSeenAt is fresher than this. */
export const PRESENCE_COALESCE_MS = 60_000;

/** Whether a lastSeenAt timestamp is recent enough to count as online. */
export function isOnline(lastSeenAt: string | Date | null | undefined): boolean {
  if (!lastSeenAt) return false;
  const ms =
    typeof lastSeenAt === "string"
      ? new Date(lastSeenAt).getTime()
      : lastSeenAt.getTime();
  if (Number.isNaN(ms)) return false;
  return Date.now() - ms < PRESENCE_ONLINE_WINDOW_MS;
}
