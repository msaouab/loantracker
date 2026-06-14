import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  countUniqueAdminClients,
  countUniqueClients,
  mergeTopClients,
} from "@/lib/user-stats-helpers";
import {
  getPrefixedPurgedClientTotals,
  getPurgedClientPairs,
  getSnapshotTotalsForOrg,
  getSnapshotTotalsForUser,
} from "@/lib/user-stats-service";

export type DashboardStats = {
  totalClients: number;
  totalLoanAmount: number;
  amountRecovered: number;
  outstanding: number;
  activeCount: number;
  recoveredCount: number;
  ifAllRecovered: number;
  recoveryRate: number;
  trustDistribution: { trusted: number; notTrusted: number };
  recoveryProgress: { recovered: number; outstanding: number };
  topClients: { name: string; amount: number }[];
  updatedAt: string;
  isAdminView?: boolean;
  activeUserCount?: number;
};

type LoanMetricsRow = {
  total_clients: bigint;
  total_loan_amount: bigint;
  amount_recovered: bigint;
  outstanding: bigint;
  active_count: bigint;
  recovered_count: bigint;
  trusted_count: bigint;
  not_trusted_count: bigint;
};

type TopClientRow = {
  name: string;
  amount: bigint;
};

type ClientPairRow = {
  userId: string;
  clientName: string;
};

function toNumber(value: bigint) {
  return Number(value);
}

async function queryLoanMetrics(userId?: string, adminView = false) {
  const userFilter = userId ? Prisma.sql`AND "userId" = ${userId}` : Prisma.empty;
  const clientCountExpr = adminView
    ? Prisma.sql`COUNT(DISTINCT ("userId", "clientName"))::bigint`
    : Prisma.sql`COUNT(DISTINCT "clientName")::bigint`;

  const [metrics] = await prisma.$queryRaw<LoanMetricsRow[]>`
    SELECT
      ${clientCountExpr} AS total_clients,
      COALESCE(SUM("totalAmount"), 0)::bigint AS total_loan_amount,
      COALESCE(SUM("amountPaid"), 0)::bigint AS amount_recovered,
      COALESCE(SUM(GREATEST(0, "totalAmount" - "amountPaid")), 0)::bigint AS outstanding,
      COUNT(*) FILTER (WHERE "amountPaid" < "totalAmount")::bigint AS active_count,
      COUNT(*) FILTER (WHERE "amountPaid" >= "totalAmount")::bigint AS recovered_count,
      COUNT(*) FILTER (WHERE "clientTrust" = true)::bigint AS trusted_count,
      COUNT(*) FILTER (WHERE "clientTrust" = false)::bigint AS not_trusted_count
    FROM loans
    WHERE "deletedAt" IS NULL
    ${userFilter}
  `;

  const topClients = adminView
    ? await prisma.$queryRaw<TopClientRow[]>`
        SELECT
          u."fullName" || ' · ' || l."clientName" AS name,
          SUM(l."totalAmount")::bigint AS amount
        FROM loans l
        INNER JOIN users u ON u.id = l."userId"
        WHERE l."deletedAt" IS NULL
        GROUP BY l."userId", u."fullName", l."clientName"
        ORDER BY amount DESC
        LIMIT 5
      `
    : await prisma.$queryRaw<TopClientRow[]>`
        SELECT "clientName" AS name, SUM("totalAmount")::bigint AS amount
        FROM loans
        WHERE "deletedAt" IS NULL
        ${userFilter}
        GROUP BY "clientName"
        ORDER BY amount DESC
        LIMIT 5
      `;

  return { metrics, topClients };
}

async function queryLiveClientNames(userId?: string, adminView = false) {
  if (adminView) {
    return prisma.$queryRaw<ClientPairRow[]>`
      SELECT DISTINCT "userId", "clientName"
      FROM loans
      WHERE "deletedAt" IS NULL
    `;
  }

  const rows = await prisma.$queryRaw<Array<{ clientName: string }>>`
    SELECT DISTINCT "clientName"
    FROM loans
    WHERE "deletedAt" IS NULL
      AND "userId" = ${userId}
  `;

  return rows.map((row) => ({ userId: userId!, clientName: row.clientName }));
}

function buildDashboardStats(
  metrics: LoanMetricsRow,
  topClients: TopClientRow[],
  snapshot: Awaited<ReturnType<typeof getSnapshotTotalsForUser>>,
  totalClients: number,
  extras: Pick<DashboardStats, "isAdminView" | "activeUserCount"> = {}
): DashboardStats {
  const liveTotalLoanAmount = toNumber(metrics.total_loan_amount);
  const liveAmountRecovered = toNumber(metrics.amount_recovered);
  const outstanding = toNumber(metrics.outstanding);

  const totalLoanAmount = liveTotalLoanAmount + snapshot.purgedTotalAmount;
  const amountRecovered = liveAmountRecovered + snapshot.purgedAmountRecovered;

  return {
    totalClients,
    totalLoanAmount,
    amountRecovered,
    outstanding,
    activeCount: toNumber(metrics.active_count),
    recoveredCount: toNumber(metrics.recovered_count) + snapshot.purgedRecoveredCount,
    ifAllRecovered: totalLoanAmount,
    recoveryRate:
      totalLoanAmount > 0 ? (amountRecovered / totalLoanAmount) * 100 : 0,
    trustDistribution: {
      trusted: toNumber(metrics.trusted_count) + snapshot.purgedTrustedCount,
      notTrusted: toNumber(metrics.not_trusted_count) + snapshot.purgedNotTrustedCount,
    },
    recoveryProgress: { recovered: amountRecovered, outstanding },
    topClients: mergeTopClients(
      topClients.map((client) => ({
        name: client.name,
        amount: toNumber(client.amount),
      })),
      snapshot.purgedClientTotals
    ),
    updatedAt: new Date().toISOString(),
    ...extras,
  };
}

export async function getDashboardStats(userId: string) {
  const [{ metrics, topClients }, snapshot, liveClientNames] = await Promise.all([
    queryLoanMetrics(userId),
    getSnapshotTotalsForUser(userId),
    queryLiveClientNames(userId),
  ]);

  const totalClients = countUniqueClients(
    liveClientNames.map((row) => row.clientName),
    snapshot.purgedClientNames
  );

  return buildDashboardStats(metrics, topClients, snapshot, totalClients);
}

export async function getAdminDashboardStats() {
  const [
    { metrics, topClients },
    snapshot,
    livePairs,
    activeUserCount,
    purgedPairs,
    prefixedPurgedClientTotals,
  ] = await Promise.all([
    queryLoanMetrics(undefined, true),
    getSnapshotTotalsForOrg(),
    queryLiveClientNames(undefined, true),
    prisma.user.count({
      where: { isAdmin: false, isActivated: true, isFrozen: false },
    }),
    getPurgedClientPairs(),
    getPrefixedPurgedClientTotals(),
  ]);

  const purgedUsers = [...purgedPairs.reduce((map, pair) => {
    const names = map.get(pair.userId) ?? [];
    names.push(pair.clientName);
    map.set(pair.userId, names);
    return map;
  }, new Map<string, string[]>()).entries()].map(([userId, clientNames]) => ({
    userId,
    clientNames,
  }));

  const totalClients = countUniqueAdminClients(livePairs, purgedUsers);

  const liveTotalLoanAmount = toNumber(metrics.total_loan_amount);
  const liveAmountRecovered = toNumber(metrics.amount_recovered);
  const outstanding = toNumber(metrics.outstanding);
  const totalLoanAmount = liveTotalLoanAmount + snapshot.purgedTotalAmount;
  const amountRecovered = liveAmountRecovered + snapshot.purgedAmountRecovered;

  return {
    totalClients,
    totalLoanAmount,
    amountRecovered,
    outstanding,
    activeCount: toNumber(metrics.active_count),
    recoveredCount: toNumber(metrics.recovered_count) + snapshot.purgedRecoveredCount,
    ifAllRecovered: totalLoanAmount,
    recoveryRate:
      totalLoanAmount > 0 ? (amountRecovered / totalLoanAmount) * 100 : 0,
    trustDistribution: {
      trusted: toNumber(metrics.trusted_count) + snapshot.purgedTrustedCount,
      notTrusted: toNumber(metrics.not_trusted_count) + snapshot.purgedNotTrustedCount,
    },
    recoveryProgress: { recovered: amountRecovered, outstanding },
    topClients: mergeTopClients(
      topClients.map((client) => ({
        name: client.name,
        amount: toNumber(client.amount),
      })),
      prefixedPurgedClientTotals
    ),
    updatedAt: new Date().toISOString(),
    isAdminView: true,
    activeUserCount,
  };
}
