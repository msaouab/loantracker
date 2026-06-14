import { NextResponse } from "next/server";
import { withUser } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { ActivityActions } from "@/lib/activity-log";
import { logActivityFromRequest } from "@/lib/activity-log-service";
import { prisma } from "@/lib/db";
import { formatCurrency, serializeLoan } from "@/lib/loans";
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

  await logActivityFromRequest(userId, req, {
    action: ActivityActions.LOAN_UPDATED,
    summary: `Updated loan for ${loan.clientName}`,
    entityType: "loan",
    entityId: loan.id,
  });

  return NextResponse.json({ loan: serializeLoan(loan) });
});

export const DELETE = withUser<{ id: string }>(async (req, userId, { params }) => {
  const { id } = await params;
  const loan = await getOwnedLoanOrThrow(prisma, userId, id);
  await softDeleteLoan(userId, id);

  await logActivityFromRequest(userId, req, {
    action: ActivityActions.LOAN_DELETED,
    summary: `Deleted loan for ${loan.clientName} (${formatCurrency(loan.totalAmount)})`,
    entityType: "loan",
    entityId: id,
    metadata: {
      clientName: loan.clientName,
      totalAmount: loan.totalAmount,
    },
  });

  return NextResponse.json({ success: true });
});
