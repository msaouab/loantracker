export type SnapshotTotals = {
  purgedLoanCount: number;
  purgedTotalAmount: number;
  purgedAmountRecovered: number;
  purgedRecoveredCount: number;
  purgedTrustedCount: number;
  purgedNotTrustedCount: number;
  purgedClientNames: string[];
  purgedClientTotals: Record<string, number>;
};

export const EMPTY_SNAPSHOT_TOTALS: SnapshotTotals = {
  purgedLoanCount: 0,
  purgedTotalAmount: 0,
  purgedAmountRecovered: 0,
  purgedRecoveredCount: 0,
  purgedTrustedCount: 0,
  purgedNotTrustedCount: 0,
  purgedClientNames: [],
  purgedClientTotals: {},
};

export function mergeSnapshotTotals(rows: SnapshotTotals[]): SnapshotTotals {
  return rows.reduce((merged, row) => {
    const clientNames = new Set([...merged.purgedClientNames, ...row.purgedClientNames]);
    const clientTotals = { ...merged.purgedClientTotals };

    for (const [name, amount] of Object.entries(row.purgedClientTotals)) {
      clientTotals[name] = (clientTotals[name] ?? 0) + amount;
    }

    return {
      purgedLoanCount: merged.purgedLoanCount + row.purgedLoanCount,
      purgedTotalAmount: merged.purgedTotalAmount + row.purgedTotalAmount,
      purgedAmountRecovered: merged.purgedAmountRecovered + row.purgedAmountRecovered,
      purgedRecoveredCount: merged.purgedRecoveredCount + row.purgedRecoveredCount,
      purgedTrustedCount: merged.purgedTrustedCount + row.purgedTrustedCount,
      purgedNotTrustedCount: merged.purgedNotTrustedCount + row.purgedNotTrustedCount,
      purgedClientNames: [...clientNames],
      purgedClientTotals: clientTotals,
    };
  }, { ...EMPTY_SNAPSHOT_TOTALS, purgedClientNames: [], purgedClientTotals: {} });
}

export function countUniqueClients(
  liveClientNames: string[],
  purgedClientNames: string[]
) {
  return new Set([...liveClientNames, ...purgedClientNames]).size;
}

export function countUniqueAdminClients(
  livePairs: Array<{ userId: string; clientName: string }>,
  purgedClientNamesByUser: Array<{ userId: string; clientNames: string[] }>
) {
  const keys = new Set<string>();

  for (const pair of livePairs) {
    keys.add(`${pair.userId}|${pair.clientName}`);
  }

  for (const entry of purgedClientNamesByUser) {
    for (const clientName of entry.clientNames) {
      keys.add(`${entry.userId}|${clientName}`);
    }
  }

  return keys.size;
}

export function mergeTopClients(
  live: Array<{ name: string; amount: number }>,
  purgedTotals: Record<string, number>
) {
  const merged = new Map<string, number>();

  for (const row of live) {
    merged.set(row.name, row.amount);
  }

  for (const [name, amount] of Object.entries(purgedTotals)) {
    merged.set(name, (merged.get(name) ?? 0) + amount);
  }

  return [...merged.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}
