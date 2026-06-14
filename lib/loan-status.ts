import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";

export const LOAN_STATUSES = ["active", "completed", "all"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export const DEFAULT_LOAN_STATUS: LoanStatus = "all";

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
): Prisma.LoanWhereInput | undefined {
  if (status === "active") {
    return { amountPaid: { lt: prisma.loan.fields.totalAmount } };
  }
  if (status === "completed") {
    return { amountPaid: { gte: prisma.loan.fields.totalAmount } };
  }
  return undefined;
}
