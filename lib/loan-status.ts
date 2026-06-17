import { Prisma } from "@/app/generated/prisma/client";
import type { Prisma as PrismaTypes, PrismaClient } from "@/app/generated/prisma/client";

export const LOAN_STATUSES = ["active", "completed", "all"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const DEFAULT_LOAN_STATUS: LoanStatus = "all";

/** SQL fragment for loans that still have an outstanding balance. */
export const OPEN_LOAN_SQL = Prisma.sql`"amountPaid" < "totalAmount"`;

/** SQL fragment for loans that are fully repaid. */
export const RECOVERED_LOAN_SQL = Prisma.sql`"amountPaid" >= "totalAmount"`;

export function isOpenLoan(amountPaid: number, totalAmount: number) {
  return amountPaid < totalAmount;
}

export function isRecoveredLoan(amountPaid: number, totalAmount: number) {
  return amountPaid >= totalAmount;
}

export function parseLoanStatus(value: string | null): LoanStatus {
  return LOAN_STATUSES.includes(value as LoanStatus)
    ? (value as LoanStatus)
    : DEFAULT_LOAN_STATUS;
}

/**
 * Status is derived, not stored: a loan is "completed" when amountPaid has
 * reached totalAmount (outstanding === 0). Uses Prisma field references so it
 * composes with the existing search/date/sort/count where-clause.
 */
export function getLoanStatusWhere(
  prisma: PrismaClient,
  status: LoanStatus
): PrismaTypes.LoanWhereInput | undefined {
  if (status === "active") {
    return { amountPaid: { lt: prisma.loan.fields.totalAmount } };
  }
  if (status === "completed") {
    return { amountPaid: { gte: prisma.loan.fields.totalAmount } };
  }
  return undefined;
}
