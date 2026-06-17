import { apiOk } from "@/lib/api-response";
import { withUser } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { PRESENCE_COALESCE_MS } from "@/lib/presence";

/**
 * Heartbeat — records that the current user is active. Coalesced: only writes
 * when lastSeenAt is stale, so multiple tabs / rapid beats don't thrash the DB.
 */
export const POST = withUser(async (_req, userId) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - PRESENCE_COALESCE_MS);

  await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }],
    },
    data: { lastSeenAt: now },
  });

  return apiOk({ ok: true });
});
