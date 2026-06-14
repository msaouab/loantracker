import { Prisma } from "@/app/generated/prisma/client";
import type { PrismaClient } from "@/app/generated/prisma/client";
import { endOfDay, parseDateParam, startOfDay } from "@/lib/dates";

function escapeLikePattern(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function extractAmountSearchTerm(search: string) {
  const normalized = search.replace(/\s/g, "").replace(",", ".");
  const match = normalized.match(/[\d.]+/);
  if (!match || !/\d/.test(match[0])) {
    return null;
  }

  return match[0];
}

export function getLoanDateWhere(
  dateFrom: string | null,
  dateTo: string | null
): Prisma.LoanWhereInput | undefined {
  const from = parseDateParam(dateFrom);
  const to = parseDateParam(dateTo);

  if (!from && !to) {
    return undefined;
  }

  const loanDate: Prisma.DateTimeFilter = {};

  if (from) {
    loanDate.gte = startOfDay(from);
  }

  if (to) {
    loanDate.lte = endOfDay(to);
  }

  return { loanDate };
}

export async function getLoanSearchWhere(
  prisma: PrismaClient,
  userId: string,
  search: string
): Promise<Prisma.LoanWhereInput | undefined> {
  const trimmed = search.trim();
  if (!trimmed) {
    return undefined;
  }

  const pattern = `%${escapeLikePattern(trimmed)}%`;
  const amountTerm = extractAmountSearchTerm(trimmed);
  const amountPattern = amountTerm
    ? `%${escapeLikePattern(amountTerm)}%`
    : null;

  const searchConditions = [
    Prisma.sql`"clientName" ILIKE ${pattern}`,
    ...(amountPattern
      ? [Prisma.sql`CAST("totalAmount" AS TEXT) ILIKE ${amountPattern}`]
      : []),
  ];

  const matches = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT id
    FROM loans
    WHERE "userId" = ${userId}
      AND "deletedAt" IS NULL
      AND (${Prisma.join(searchConditions, " OR ")})
  `);

  const ids = matches.map((row) => row.id);

  return { id: { in: ids } };
}
