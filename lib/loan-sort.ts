import type { PrismaClient } from "@/app/generated/prisma/client";
import type { Prisma } from "@/app/generated/prisma/client";
import { getOutstanding } from "@/lib/loans";

export const LOAN_SORT_FIELDS = [
  "clientName",
  "totalAmount",
  "amountPaid",
  "outstanding",
  "loanDate",
  "clientTrust",
] as const;

export type LoanSortField = (typeof LOAN_SORT_FIELDS)[number];
export type LoanSortOrder = "asc" | "desc";

export const DEFAULT_LOAN_SORT = {
  sortBy: "loanDate" as LoanSortField,
  sortOrder: "desc" as LoanSortOrder,
};

export function parseLoanSort(
  sortBy: string | null,
  sortOrder: string | null
): { sortBy: LoanSortField; sortOrder: LoanSortOrder } {
  const field = LOAN_SORT_FIELDS.includes(sortBy as LoanSortField)
    ? (sortBy as LoanSortField)
    : DEFAULT_LOAN_SORT.sortBy;

  const order =
    sortOrder === "asc" || sortOrder === "desc"
      ? sortOrder
      : DEFAULT_LOAN_SORT.sortOrder;

  return { sortBy: field, sortOrder: order };
}

export async function findSortedLoans(
  prisma: PrismaClient,
  where: Prisma.LoanWhereInput,
  sortBy: LoanSortField,
  sortOrder: LoanSortOrder,
  skip: number,
  take: number
) {
  if (sortBy !== "outstanding") {
    return prisma.loan.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
      include: {
        _count: { select: { payments: true } },
      },
    });
  }

  const matches = await prisma.loan.findMany({
    where,
    select: { id: true, totalAmount: true, amountPaid: true },
  });

  matches.sort((a, b) => {
    const outstandingA = getOutstanding(a.totalAmount, a.amountPaid);
    const outstandingB = getOutstanding(b.totalAmount, b.amountPaid);
    return sortOrder === "asc"
      ? outstandingA - outstandingB
      : outstandingB - outstandingA;
  });

  const pageIds = matches.slice(skip, skip + take).map((loan) => loan.id);
  if (pageIds.length === 0) {
    return [];
  }

  const loans = await prisma.loan.findMany({
    where: { id: { in: pageIds } },
    include: {
      _count: { select: { payments: true } },
    },
  });

  const loansById = new Map(loans.map((loan) => [loan.id, loan]));
  return pageIds
    .map((id) => loansById.get(id))
    .filter((loan): loan is NonNullable<typeof loan> => loan !== undefined);
}
