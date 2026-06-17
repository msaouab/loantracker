import { getOutstanding } from "@/lib/loans-core";
import {
  formatCurrency as formatCurrencyForLocale,
  formatRecoveredRetention as formatRecoveredRetentionForLocale,
} from "@/lib/format";
import type { AppLocale } from "@/lib/locale";

export { getOutstanding, RECOVERED_LOAN_RETENTION_DAYS } from "@/lib/loans-core";

export function formatCurrency(amount: number, locale: AppLocale = "en") {
  return formatCurrencyForLocale(amount, locale);
}

export function formatRecoveredRetention(
  recoveredAt: string | null,
  locale: AppLocale = "en",
  labels?: Parameters<typeof formatRecoveredRetentionForLocale>[2]
) {
  const defaultLabels = {
    today: "Today",
    daysAgo: "{count}d ago",
    oneDayAgo: "1d ago",
    deletesToday: "deletes today",
    daysLeft: "{count}d left",
    oneDayLeft: "1d left",
  };
  return formatRecoveredRetentionForLocale(
    recoveredAt,
    locale,
    labels ?? defaultLabels
  );
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
