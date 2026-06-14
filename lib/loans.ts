export const RECOVERED_LOAN_RETENTION_DAYS = 30;

// Amounts are stored as whole MAD (no fractional cents).

export function getOutstanding(totalAmount: number, amountPaid: number) {
  return Math.max(0, totalAmount - amountPaid);
}

function daysSince(date: Date) {
  const ms = Date.now() - date.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function daysUntilRecoveredPurge(recoveredAt: Date | string) {
  const recovered = typeof recoveredAt === "string" ? new Date(recoveredAt) : recoveredAt;
  return Math.max(0, RECOVERED_LOAN_RETENTION_DAYS - daysSince(recovered));
}

export function formatRecoveredRetention(recoveredAt: string | null) {
  if (!recoveredAt) {
    return null;
  }

  const recovered = new Date(recoveredAt);
  const daysAgo = daysSince(recovered);
  const daysLeft = daysUntilRecoveredPurge(recovered);
  const agoLabel =
    daysAgo === 0 ? "Today" : daysAgo === 1 ? "1d ago" : `${daysAgo}d ago`;
  const purgeLabel =
    daysLeft === 0 ? "deletes today" : daysLeft === 1 ? "1d left" : `${daysLeft}d left`;

  return `${agoLabel} · ${purgeLabel}`;
}

type LoanRecord = {
  id: string;
  clientName: string;
  totalAmount: number;
  amountPaid: number;
  loanDate: Date;
  description: string | null;
  clientTrust: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  recoveredAt?: Date | null;
};

export function serializeLoan(loan: LoanRecord) {
  return {
    id: loan.id,
    clientName: loan.clientName,
    totalAmount: loan.totalAmount,
    amountPaid: loan.amountPaid,
    outstanding: getOutstanding(loan.totalAmount, loan.amountPaid),
    loanDate: loan.loanDate.toISOString(),
    description: loan.description,
    clientTrust: loan.clientTrust,
    createdAt: loan.createdAt.toISOString(),
    updatedAt: loan.updatedAt.toISOString(),
    deletedAt: loan.deletedAt?.toISOString() ?? null,
    recoveredAt: loan.recoveredAt?.toISOString() ?? null,
  };
}

export function formatCurrency(amount: number) {
  const formatted = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted} DH`;
}
