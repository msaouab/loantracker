import type { PrismaClient } from "@/app/generated/prisma/client";
import type { Prisma } from "@/app/generated/prisma/client";
import { Prisma as PrismaNamespace } from "@/app/generated/prisma/client";
import { buildLoanWhereSql } from "@/lib/loan-where-sql";
import type { LoanSortField, LoanSortOrder } from "@/lib/loan-sort-types";

async function hydrateLoansByIds(
  prismaClient: PrismaClient,
  pageIds: string[]
) {
  if (pageIds.length === 0) {
    return [];
  }

  const loans = await prismaClient.loan.findMany({
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

async function findOutstandingSortedLoans(
  prismaClient: PrismaClient,
  where: Prisma.LoanWhereInput,
  sortOrder: LoanSortOrder,
  skip: number,
  take: number
) {
  const whereSql = buildLoanWhereSql(where);
  const orderDirection =
    sortOrder === "asc" ? PrismaNamespace.sql`ASC` : PrismaNamespace.sql`DESC`;

  const pageIds = await prismaClient.$queryRaw<Array<{ id: string }>>(
    PrismaNamespace.sql`
      SELECT id
      FROM loans
      WHERE ${whereSql}
      ORDER BY GREATEST(0, "totalAmount" - "amountPaid") ${orderDirection}
      OFFSET ${skip}
      LIMIT ${take}
    `
  );

  return hydrateLoansByIds(prismaClient, pageIds.map((row) => row.id));
}

export async function findSortedLoans(
  prismaClient: PrismaClient,
  where: Prisma.LoanWhereInput,
  sortBy: LoanSortField,
  sortOrder: LoanSortOrder,
  skip: number,
  take: number
) {
  if (sortBy === "outstanding") {
    return findOutstandingSortedLoans(prismaClient, where, sortOrder, skip, take);
  }

  return prismaClient.loan.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip,
    take,
    include: {
      _count: { select: { payments: true } },
    },
  });
}
