export const RECOVERED_LOAN_RETENTION_DAYS = 30;

// Amounts are stored as whole MAD (no fractional cents).

export function getOutstanding(totalAmount: number, amountPaid: number) {
  return Math.max(0, totalAmount - amountPaid);
}

export function daysSince(date: Date) {
  const ms = Date.now() - date.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function daysUntilRecoveredPurge(recoveredAt: Date | string) {
  const recovered = typeof recoveredAt === "string" ? new Date(recoveredAt) : recoveredAt;
  return Math.max(0, RECOVERED_LOAN_RETENTION_DAYS - daysSince(recovered));
}
