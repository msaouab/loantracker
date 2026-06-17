import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  computeDashboardStats,
  type LoanMetricsInput,
  type TopClientInput,
} from "@/lib/dashboard-stats";
import { OPEN_LOAN_SQL, RECOVERED_LOAN_SQL } from "@/lib/loan-status";
import {
  getPurgedClientPairs,
  getSnapshotTotalsForOrg,
  getSnapshotTotalsForUser,
} from "@/lib/user-stats-service";

export type { DashboardStats } from "@/lib/dashboard-stats";
export { computeDashboardStats } from "@/lib/dashboard-stats";

const MANAGER_LOANS = Prisma.sql`
  FROM loans l
  INNER JOIN users u ON u.id = l."userId" AND u."isAdmin" = false
  WHERE l."deletedAt" IS NULL
`;

function toClientKey(userId: string, clientName: string) {
  return `${userId}|${clientName}`;
}

async function queryUserLoanMetrics(userId: string) {
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
    recoveredClientKeys: recoveredClients.map((row) => row.clientName),
  };
}

async function queryOrgLoanMetrics() {
  const [metrics] = await prisma.$queryRaw<LoanMetricsInput[]>`
    SELECT
      COUNT(DISTINCT (l."userId", l."clientName")) FILTER (WHERE ${OPEN_LOAN_SQL})::bigint AS open_clients,
      COALESCE(SUM(l."totalAmount") FILTER (WHERE ${OPEN_LOAN_SQL}), 0)::bigint AS full_budget,
      COALESCE(SUM(l."amountPaid") FILTER (WHERE ${OPEN_LOAN_SQL}), 0)::bigint AS open_amount_paid,
      COALESCE(SUM(GREATEST(0, l."totalAmount" - l."amountPaid")) FILTER (WHERE ${OPEN_LOAN_SQL}), 0)::bigint AS outstanding,
      (COUNT(*) FILTER (WHERE ${OPEN_LOAN_SQL}))::bigint AS active_count,
      (COUNT(*) FILTER (WHERE ${RECOVERED_LOAN_SQL}))::bigint AS recovered_count,
      COALESCE(SUM(l."totalAmount") FILTER (WHERE ${RECOVERED_LOAN_SQL}), 0)::bigint AS recovered_amount,
      (COUNT(*) FILTER (WHERE l."clientTrust" = true AND ${OPEN_LOAN_SQL}))::bigint AS open_trusted_count,
      (COUNT(*) FILTER (WHERE l."clientTrust" = false AND ${OPEN_LOAN_SQL}))::bigint AS open_not_trusted_count
    ${MANAGER_LOANS}
  `;

  const [topClients, recoveredClients] = await Promise.all([
    prisma.$queryRaw<TopClientInput[]>`
      SELECT
        u."fullName" || ' · ' || l."clientName" AS name,
        SUM(l."totalAmount")::bigint AS amount
      ${MANAGER_LOANS}
        AND ${OPEN_LOAN_SQL}
      GROUP BY l."userId", u."fullName", l."clientName"
      ORDER BY amount DESC
      LIMIT 5
    `,
    prisma.$queryRaw<Array<{ userId: string; clientName: string }>>`
      SELECT DISTINCT l."userId", l."clientName"
      ${MANAGER_LOANS}
        AND ${RECOVERED_LOAN_SQL}
    `,
  ]);

  return {
    metrics,
    topClients,
    recoveredClientKeys: recoveredClients.map((row) =>
      toClientKey(row.userId, row.clientName)
    ),
  };
}

export async function getDashboardStats(userId: string) {
  const [{ metrics, topClients, recoveredClientKeys }, snapshot] = await Promise.all([
    queryUserLoanMetrics(userId),
    getSnapshotTotalsForUser(userId),
  ]);

  return computeDashboardStats(metrics, topClients, recoveredClientKeys, {
    purgedAmountRecovered: snapshot.purgedAmountRecovered,
    purgedRecoveredCount: snapshot.purgedRecoveredCount,
    purgedClientKeys: snapshot.purgedClientNames,
  });
}

export async function getOrgDashboardStats() {
  const [
    { metrics, topClients, recoveredClientKeys },
    snapshot,
    purgedPairs,
    activeUserCount,
  ] = await Promise.all([
    queryOrgLoanMetrics(),
    getSnapshotTotalsForOrg(),
    getPurgedClientPairs(),
    prisma.user.count({
      where: { isAdmin: false, isActivated: true, isFrozen: false },
    }),
  ]);

  return computeDashboardStats(
    metrics,
    topClients,
    recoveredClientKeys,
    {
      purgedAmountRecovered: snapshot.purgedAmountRecovered,
      purgedRecoveredCount: snapshot.purgedRecoveredCount,
      purgedClientKeys: purgedPairs.map((row) =>
        toClientKey(row.userId, row.clientName)
      ),
    },
    { isAdminView: true, activeUserCount }
  );
}
