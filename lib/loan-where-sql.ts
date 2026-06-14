import { Prisma } from "@/app/generated/prisma/client";
import type { Prisma as PrismaTypes } from "@/app/generated/prisma/client";

function isFieldReference(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as { name: unknown }).name === "string"
  );
}

export function buildLoanWhereSql(where: PrismaTypes.LoanWhereInput): Prisma.Sql {
  const parts: Prisma.Sql[] = [Prisma.sql`"deletedAt" IS NULL`];

  if (typeof where.userId === "string") {
    parts.push(Prisma.sql`"userId" = ${where.userId}`);
  }

  const idFilter = where.id;
  if (
    idFilter &&
    typeof idFilter === "object" &&
    "in" in idFilter &&
    Array.isArray(idFilter.in)
  ) {
    if (idFilter.in.length === 0) {
      parts.push(Prisma.sql`FALSE`);
    } else {
      parts.push(
        Prisma.sql`id IN (${Prisma.join(
          idFilter.in.map((id) => Prisma.sql`${id}`),
          ", "
        )})`
      );
    }
  }

  const loanDate = where.loanDate;
  if (loanDate && typeof loanDate === "object") {
    if ("gte" in loanDate && loanDate.gte instanceof Date) {
      parts.push(Prisma.sql`"loanDate" >= ${loanDate.gte}`);
    }
    if ("lte" in loanDate && loanDate.lte instanceof Date) {
      parts.push(Prisma.sql`"loanDate" <= ${loanDate.lte}`);
    }
  }

  const amountPaid = where.amountPaid;
  if (amountPaid && typeof amountPaid === "object") {
    if ("lt" in amountPaid && isFieldReference(amountPaid.lt)) {
      parts.push(Prisma.sql`"amountPaid" < "totalAmount"`);
    } else if ("gte" in amountPaid && isFieldReference(amountPaid.gte)) {
      parts.push(Prisma.sql`"amountPaid" >= "totalAmount"`);
    }
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return Prisma.join(parts, " AND ");
}
