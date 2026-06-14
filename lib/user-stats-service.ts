import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  EMPTY_SNAPSHOT_TOTALS,
  mergeSnapshotTotals,
  type SnapshotTotals,
} from "@/lib/user-stats-helpers";

type Db = Prisma.TransactionClient;

export type { SnapshotTotals };
export {
  countUniqueAdminClients,
  countUniqueClients,
  EMPTY_SNAPSHOT_TOTALS,
  mergeSnapshotTotals,
  mergeTopClients,
} from "@/lib/user-stats-helpers";

export type PurgedLoanSnapshot = {
  userId: string;
  clientName: string;
  totalAmount: number;
  clientTrust: boolean;
};

function snapshotFromRows(
  stats: {
    purgedLoanCount: number;
    purgedTotalAmount: number;
    purgedAmountRecovered: number;
    purgedRecoveredCount: number;
    purgedTrustedCount: number;
    purgedNotTrustedCount: number;
  } | null,
  clientStats: Array<{ clientName: string; totalAmount: number }>
): SnapshotTotals {
  if (!stats && clientStats.length === 0) {
    return EMPTY_SNAPSHOT_TOTALS;
  }

  return {
    purgedLoanCount: stats?.purgedLoanCount ?? 0,
    purgedTotalAmount: stats?.purgedTotalAmount ?? 0,
    purgedAmountRecovered: stats?.purgedAmountRecovered ?? 0,
    purgedRecoveredCount: stats?.purgedRecoveredCount ?? 0,
    purgedTrustedCount: stats?.purgedTrustedCount ?? 0,
    purgedNotTrustedCount: stats?.purgedNotTrustedCount ?? 0,
    purgedClientNames: clientStats.map((row) => row.clientName),
    purgedClientTotals: Object.fromEntries(
      clientStats.map((row) => [row.clientName, row.totalAmount])
    ),
  };
}

async function loadUserSnapshot(db: Db | typeof prisma, userId: string) {
  const [stats, clientStats] = await Promise.all([
    db.userStats.findUnique({ where: { userId } }),
    db.purgedClientStat.findMany({
      where: { userId },
      select: { clientName: true, totalAmount: true },
    }),
  ]);

  return snapshotFromRows(stats, clientStats);
}

async function upsertPurgedStats(db: Db, userId: string, loans: PurgedLoanSnapshot[]) {
  let purgedTotalAmount = 0;
  let purgedTrustedCount = 0;
  let purgedNotTrustedCount = 0;

  for (const loan of loans) {
    purgedTotalAmount += loan.totalAmount;
    if (loan.clientTrust) {
      purgedTrustedCount += 1;
    } else {
      purgedNotTrustedCount += 1;
    }

    await db.purgedClientStat.upsert({
      where: {
        userId_clientName: { userId, clientName: loan.clientName },
      },
      create: {
        userId,
        clientName: loan.clientName,
        totalAmount: loan.totalAmount,
        loanCount: 1,
      },
      update: {
        totalAmount: { increment: loan.totalAmount },
        loanCount: { increment: 1 },
      },
    });
  }

  await db.userStats.upsert({
    where: { userId },
    create: {
      userId,
      purgedLoanCount: loans.length,
      purgedTotalAmount,
      purgedAmountRecovered: purgedTotalAmount,
      purgedRecoveredCount: loans.length,
      purgedTrustedCount,
      purgedNotTrustedCount,
    },
    update: {
      purgedLoanCount: { increment: loans.length },
      purgedTotalAmount: { increment: purgedTotalAmount },
      purgedAmountRecovered: { increment: purgedTotalAmount },
      purgedRecoveredCount: { increment: loans.length },
      purgedTrustedCount: { increment: purgedTrustedCount },
      purgedNotTrustedCount: { increment: purgedNotTrustedCount },
    },
  });
}

export async function recordPurgedRecoveredLoans(
  db: Db,
  loans: PurgedLoanSnapshot[]
) {
  const byUser = new Map<string, PurgedLoanSnapshot[]>();

  for (const loan of loans) {
    const list = byUser.get(loan.userId) ?? [];
    list.push(loan);
    byUser.set(loan.userId, list);
  }

  for (const [userId, userLoans] of byUser) {
    await upsertPurgedStats(db, userId, userLoans);
  }
}

export async function getSnapshotTotalsForUser(userId: string) {
  return loadUserSnapshot(prisma, userId);
}

export async function getSnapshotTotalsForOrg() {
  const userIds = await prisma.userStats.findMany({
    select: { userId: true },
  });

  const snapshots = await Promise.all(
    userIds.map((row) => loadUserSnapshot(prisma, row.userId))
  );

  return mergeSnapshotTotals(snapshots);
}

export async function getPrefixedPurgedClientTotals() {
  const rows = await prisma.purgedClientStat.findMany({
    include: { user: { select: { fullName: true } } },
  });

  const totals: Record<string, number> = {};

  for (const row of rows) {
    const label = `${row.user.fullName} · ${row.clientName}`;
    totals[label] = (totals[label] ?? 0) + row.totalAmount;
  }

  return totals;
}

export async function getPurgedClientPairs() {
  return prisma.purgedClientStat.findMany({
    select: { userId: true, clientName: true },
  });
}
