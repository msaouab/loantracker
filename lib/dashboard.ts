import { prisma } from "@/lib/db";
import {
  computeDashboardStats,
  type LoanMetricsInput,
  type TopClientInput,
} from "@/lib/dashboard-stats";
import { OPEN_LOAN_SQL, RECOVERED_LOAN_SQL } from "@/lib/loan-status";
import { getSnapshotTotalsForUser } from "@/lib/user-stats-service";

export type { DashboardStats } from "@/lib/dashboard-stats";
export { computeDashboardStats } from "@/lib/dashboard-stats";

async function queryLoanMetrics(userId: string) {
  const [metrics] = await prisma.$queryRaw<LoanMetricsInput[]>`
    SELECT
      COUNT(DISTINCT "clientName") FILTER (WHERE ${OPEN_LOAN_SQL})::bigint AS open_clients,
      COALESCE(SUM("totalAmount") FILTER (WHERE ${OPEN_LOAN_SQL}), 0)::bigint AS full_budget,
      COALESCE(SUM("amountPaid") FILTER (WHERE ${OPEN_LOAN_SQL}), 0)::bigint AS open_amount_paid,
      COALESCE(SUM(GREATEST(0, "totalAmount" - "amountPaid")) FILTER (WHERE ${OPEN_LOAN_SQL}), 0)::bigint AS outstanding,
      (COUNT(*) FILTER (WHERE ${OPEN_LOAN_SQL}))::bigint AS active_count,
      (COUNT(*) FILTER (WHERE ${RECOVERED_LOAN_SQL}))::bigint AS recovered_count,
      COALESCE(SUM("totalAmount") FILTER (WHERE ${RECOVERED_LOAN_SQL}), 0)::bigint AS recovered_amount,
      (COUNT(*) FILTER (WHERE "clientTrust" = true AND ${OPEN_LOAN_SQL}))::bigint AS open_trusted_count,
      (COUNT(*) FILTER (WHERE "clientTrust" = false AND ${OPEN_LOAN_SQL}))::bigint AS open_not_trusted_count
    FROM loans
    WHERE "deletedAt" IS NULL AND "userId" = ${userId}
  `;

  const [topClients, recoveredClients] = await Promise.all([
    prisma.$queryRaw<TopClientInput[]>`
      SELECT "clientName" AS name, SUM("totalAmount")::bigint AS amount
      FROM loans
      WHERE "deletedAt" IS NULL AND ${OPEN_LOAN_SQL} AND "userId" = ${userId}
      GROUP BY "clientName"
      ORDER BY amount DESC
      LIMIT 5
    `,
    prisma.$queryRaw<{ clientName: string }[]>`
      SELECT DISTINCT "clientName"
      FROM loans
      WHERE "deletedAt" IS NULL AND ${RECOVERED_LOAN_SQL} AND "userId" = ${userId}
    `,
  ]);

  return {
    metrics,
    topClients,
    recoveredClientNames: recoveredClients.map((row) => row.clientName),
  };
}

export async function getDashboardStats(userId: string) {
  const [{ metrics, topClients, recoveredClientNames }, snapshot] = await Promise.all([
    queryLoanMetrics(userId),
    getSnapshotTotalsForUser(userId),
  ]);

  return computeDashboardStats(metrics, topClients, recoveredClientNames, {
    purgedAmountRecovered: snapshot.purgedAmountRecovered,
    purgedRecoveredCount: snapshot.purgedRecoveredCount,
    purgedClientNames: snapshot.purgedClientNames,
  });
}
