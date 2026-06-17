/**
 * Dashboard portfolio metrics reflect the active book only: loans where
 * amountPaid < totalAmount. Fully recovered and purged loans are excluded.
 *
 * Recovered KPIs (recoveredClients, recoveredAmount, recoveredLoanCount)
 * cover fully repaid live loans plus purged recovered history.
 */
export type DashboardStats = {
  totalClients: number;
  totalLoanAmount: number;
  amountRecovered: number;
  outstanding: number;
  activeCount: number;
  recoveredClients: number;
  recoveredAmount: number;
  recoveredLoanCount: number;
  ifAllRecovered: number;
  recoveryRate: number;
  trustDistribution: { trusted: number; notTrusted: number };
  recoveryProgress: { recovered: number; outstanding: number };
  topClients: { name: string; amount: number }[];
  updatedAt: string;
  isAdminView?: boolean;
  activeUserCount?: number;
};

export type LoanMetricsInput = {
  open_clients: bigint;
  full_budget: bigint;
  open_amount_paid: bigint;
  outstanding: bigint;
  active_count: bigint;
  recovered_count: bigint;
  recovered_amount: bigint;
  open_trusted_count: bigint;
  open_not_trusted_count: bigint;
};

export type TopClientInput = {
  name: string;
  amount: bigint;
};

export type RecoveredSnapshotInput = {
  purgedAmountRecovered: number;
  purgedRecoveredCount: number;
  purgedClientKeys: string[];
};

function toNumber(value: bigint) {
  return Number(value);
}

function countRecoveredClients(
  liveKeys: string[],
  purgedKeys: string[]
) {
  return new Set([...liveKeys, ...purgedKeys]).size;
}

export function computeDashboardStats(
  metrics: LoanMetricsInput,
  topClients: TopClientInput[],
  recoveredClientKeys: string[],
  snapshot: RecoveredSnapshotInput = {
    purgedAmountRecovered: 0,
    purgedRecoveredCount: 0,
    purgedClientKeys: [],
  },
  extras: Pick<DashboardStats, "isAdminView" | "activeUserCount"> = {}
): DashboardStats {
  const totalLoanAmount = toNumber(metrics.full_budget);
  const amountRecovered = toNumber(metrics.open_amount_paid);
  const outstanding = toNumber(metrics.outstanding);
  const recoveredClients = countRecoveredClients(
    recoveredClientKeys,
    snapshot.purgedClientKeys
  );
  const recoveredAmount =
    toNumber(metrics.recovered_amount) + snapshot.purgedAmountRecovered;
  const recoveredLoanCount =
    toNumber(metrics.recovered_count) + snapshot.purgedRecoveredCount;

  return {
    totalClients: toNumber(metrics.open_clients),
    totalLoanAmount,
    amountRecovered,
    outstanding,
    activeCount: toNumber(metrics.active_count),
    recoveredClients,
    recoveredAmount,
    recoveredLoanCount,
    ifAllRecovered: totalLoanAmount,
    recoveryRate:
      totalLoanAmount > 0 ? (amountRecovered / totalLoanAmount) * 100 : 0,
    trustDistribution: {
      trusted: toNumber(metrics.open_trusted_count),
      notTrusted: toNumber(metrics.open_not_trusted_count),
    },
    recoveryProgress: { recovered: amountRecovered, outstanding },
    topClients: topClients.map((client) => ({
      name: client.name,
      amount: toNumber(client.amount),
    })),
    updatedAt: new Date().toISOString(),
    ...extras,
  };
}
