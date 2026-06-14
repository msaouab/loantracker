import { NextResponse } from "next/server";
import { withUser } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { getOutstanding } from "@/lib/loans";
import { getOwnedLoanOrThrow, listPayments, recordPayment, serializePayment } from "@/lib/loans-service";
import { loanPaymentSchema } from "@/lib/validations";

export const GET = withUser<{ id: string }>(async (_req, userId, { params }) => {
  const { id } = await params;
  const loan = await getOwnedLoanOrThrow(prisma, userId, id);
  const payments = await listPayments(prisma, id);

  return NextResponse.json({
    payments: payments.map(serializePayment),
    totalPaid: loan.amountPaid,
    outstanding: getOutstanding(loan.totalAmount, loan.amountPaid),
  });
});

export const POST = withUser<{ id: string }>(async (req, userId, { params }) => {
  const { id } = await params;
  const input = parseOrThrow(loanPaymentSchema, await req.json());
  const { payment, amountPaid, outstanding } = await recordPayment(userId, id, input);

  return NextResponse.json(
    {
      payment: serializePayment(payment),
      amountPaid,
      outstanding,
    },
    { status: 201 }
  );
});
