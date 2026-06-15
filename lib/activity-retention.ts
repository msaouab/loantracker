import { prisma } from "@/lib/db";

// Activity logs are hard-deleted after 30 days. (IPs are already /24-anonymized
// at capture, so no separate mid-life anonymization step is needed — the row is
// gone well before any longer-term PII concern.)
export const ACTIVITY_LOG_RETENTION_DAYS = 30;

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
