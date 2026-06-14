import { NextResponse } from "next/server";
import { withUser } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { serializeLoan } from "@/lib/loans";
import {
  getOwnedLoanOrThrow,
  listPayments,
  serializePayment,
  softDeleteLoan,
  updateLoan,
} from "@/lib/loans-service";
import { updateLoanSchema } from "@/lib/validations";

export const GET = withUser<{ id: string }>(async (_req, userId, { params }) => {
  const { id } = await params;
  const loan = await getOwnedLoanOrThrow(prisma, userId, id);
  const payments = await listPayments(prisma, id);

  return NextResponse.json({
    loan: {
      ...serializeLoan(loan),
      paymentCount: payments.length,
      payments: payments.map(serializePayment),
    },
  });
});

export const PUT = withUser<{ id: string }>(async (req, userId, { params }) => {
  const { id } = await params;
  const input = parseOrThrow(updateLoanSchema, await req.json());
  const loan = await updateLoan(userId, id, input);

  return NextResponse.json({ loan: serializeLoan(loan) });
});

export const DELETE = withUser<{ id: string }>(async (_req, userId, { params }) => {
  const { id } = await params;
  await softDeleteLoan(userId, id);

  return NextResponse.json({ success: true });
});
