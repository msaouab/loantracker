import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { formatCurrency, getOutstanding } from "@/lib/loans";
import type { CreateLoanInput, LoanPaymentInput, UpdateLoanInput } from "@/lib/validations";

type Db = Prisma.TransactionClient;

export type LoanPaymentRecord = {
  id: string;
  loanId: string;
  amount: number;
  paidAt: Date;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function serializePayment(payment: LoanPaymentRecord) {
  return {
    id: payment.id,
    loanId: payment.loanId,
    amount: payment.amount,
    paidAt: payment.paidAt.toISOString(),
    note: payment.note,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
  };
}

export async function getOwnedLoanOrThrow(db: Db, userId: string, loanId: string) {
  const loan = await db.loan.findFirst({ where: { id: loanId, userId, deletedAt: null } });
  if (!loan) throw new NotFoundError("Loan not found");
  return loan;
}

export async function listPayments(db: Db, loanId: string) {
  return db.loanPayment.findMany({
    where: { loanId },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
  });
}

async function syncAmountPaid(db: Db, loanId: string): Promise<number> {
  const agg = await db.loanPayment.aggregate({ where: { loanId }, _sum: { amount: true } });
  const amountPaid = agg._sum.amount ?? 0;
  await db.loan.update({ where: { id: loanId }, data: { amountPaid } });
  return amountPaid;
}

export async function createLoan(userId: string, input: CreateLoanInput) {
  if (input.amountPaid > input.totalAmount) {
    throw new ValidationError({ amountPaid: ["Amount paid cannot exceed total amount"] });
  }
  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: {
        userId,
        clientName: input.clientName,
        totalAmount: input.totalAmount,
        amountPaid: 0,
        loanDate: input.loanDate ?? new Date(),
        description: input.description?.trim() || null,
        clientTrust: input.clientTrust,
      },
    });
    if (input.amountPaid > 0) {
      await tx.loanPayment.create({
        data: {
          loanId: loan.id,
          amount: input.amountPaid,
          paidAt: loan.loanDate,
          note: "Initial balance",
        },
      });
      const amountPaid = await syncAmountPaid(tx, loan.id);
      return { ...loan, amountPaid };
    }
    return loan;
  });
}

export async function updateLoan(userId: string, loanId: string, input: UpdateLoanInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await getOwnedLoanOrThrow(tx, userId, loanId);
    if (input.totalAmount < existing.amountPaid) {
      throw new ValidationError({
        totalAmount: [`Total cannot be below amount already paid (${formatCurrency(existing.amountPaid)})`],
      });
    }
    return tx.loan.update({
      where: { id: loanId },
      data: {
        clientName: input.clientName,
        totalAmount: input.totalAmount,
        loanDate: input.loanDate ?? existing.loanDate,
        description: input.description?.trim() || null,
        clientTrust: input.clientTrust,
      },
    });
  });
}

export async function softDeleteLoan(userId: string, loanId: string) {
  await getOwnedLoanOrThrow(prisma, userId, loanId);
  await prisma.loan.update({ where: { id: loanId }, data: { deletedAt: new Date() } });
}

export async function recordPayment(userId: string, loanId: string, input: LoanPaymentInput) {
  return prisma.$transaction(async (tx) => {
    const loan = await getOwnedLoanOrThrow(tx, userId, loanId);
    const currentPaid =
      (await tx.loanPayment.aggregate({ where: { loanId }, _sum: { amount: true } }))._sum.amount ?? 0;
    const outstanding = getOutstanding(loan.totalAmount, currentPaid);
    if (input.amount > outstanding) {
      throw new ValidationError({
        amount: [`Payment cannot exceed outstanding balance of ${formatCurrency(outstanding)}`],
      });
    }
    const payment = await tx.loanPayment.create({
      data: {
        loanId,
        amount: input.amount,
        paidAt: input.paidAt ?? new Date(),
        note: input.note?.trim() || null,
      },
    });
    const amountPaid = await syncAmountPaid(tx, loanId);
    return { payment, amountPaid, outstanding: getOutstanding(loan.totalAmount, amountPaid) };
  });
}

export async function updatePayment(
  userId: string,
  loanId: string,
  paymentId: string,
  input: LoanPaymentInput
) {
  return prisma.$transaction(async (tx) => {
    const loan = await getOwnedLoanOrThrow(tx, userId, loanId);
    const existing = await tx.loanPayment.findFirst({ where: { id: paymentId, loanId } });
    if (!existing) throw new NotFoundError("Payment not found");

    const totalPaid =
      (await tx.loanPayment.aggregate({ where: { loanId }, _sum: { amount: true } }))._sum.amount ?? 0;
    const currentPaidExcluding = totalPaid - existing.amount;
    const maxAllowed = loan.totalAmount - currentPaidExcluding;

    if (input.amount > maxAllowed) {
      throw new ValidationError({
        amount: [`Payment cannot exceed ${formatCurrency(maxAllowed)} for this loan`],
      });
    }

    const payment = await tx.loanPayment.update({
      where: { id: paymentId },
      data: {
        amount: input.amount,
        paidAt: input.paidAt ?? existing.paidAt,
        note: input.note?.trim() || null,
      },
    });
    const amountPaid = await syncAmountPaid(tx, loanId);
    return { payment, amountPaid, outstanding: getOutstanding(loan.totalAmount, amountPaid) };
  });
}

export async function deletePayment(userId: string, loanId: string, paymentId: string) {
  return prisma.$transaction(async (tx) => {
    const loan = await getOwnedLoanOrThrow(tx, userId, loanId);
    const existing = await tx.loanPayment.findFirst({ where: { id: paymentId, loanId } });
    if (!existing) throw new NotFoundError("Payment not found");

    await tx.loanPayment.delete({ where: { id: paymentId } });
    const amountPaid = await syncAmountPaid(tx, loanId);
    return { amountPaid, outstanding: getOutstanding(loan.totalAmount, amountPaid) };
  });
}
