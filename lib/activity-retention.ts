import { prisma } from "@/lib/db";

export const ACTIVITY_LOG_RETENTION_DAYS = 365;
export const ACTIVITY_LOG_PII_RETENTION_DAYS = 90;
export const ACTIVITY_PII_BATCH_SIZE = 500;

export { anonymizeIp } from "@/lib/ip-anonymization";

function retentionCutoff(days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return cutoff;
}

export async function purgeExpiredActivityLogs() {
  const cutoff = retentionCutoff(ACTIVITY_LOG_RETENTION_DAYS);
  const result = await prisma.activityLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}

export async function anonymizeStaleActivityPii(
  batchSize = ACTIVITY_PII_BATCH_SIZE
) {
  const cutoff = retentionCutoff(ACTIVITY_LOG_PII_RETENTION_DAYS);
  let total = 0;

  while (true) {
    const updated = await prisma.$executeRaw`
      UPDATE "activity_logs"
      SET
        "ipAddress" = CASE
          WHEN "ipAddress" IS NULL THEN NULL
          WHEN "ipAddress" LIKE '%:%' THEN
            regexp_replace("ipAddress", '(:[^:]*)+[^:]*$', ':xxxx')
          ELSE regexp_replace("ipAddress", '\\.[0-9]+$', '.0')
        END,
        "userAgent" = NULL
      WHERE "id" IN (
        SELECT "id"
        FROM "activity_logs"
        WHERE "createdAt" < ${cutoff}
          AND ("ipAddress" IS NOT NULL OR "userAgent" IS NOT NULL)
        LIMIT ${batchSize}
      )
    `;

    const count = Number(updated);
    total += count;

    if (count < batchSize) {
      break;
    }
  }

  return total;
}
