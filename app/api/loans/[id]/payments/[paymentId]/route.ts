import { NextResponse } from "next/server";
import { withUser } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { ActivityActions } from "@/lib/activity-log";
import { logActivityFromRequest } from "@/lib/activity-log-service";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/loans";
import {
  deletePayment,
  getOwnedLoanOrThrow,
  serializePayment,
  updatePayment,
} from "@/lib/loans-service";
import { loanPaymentSchema } from "@/lib/validations";

export const PUT = withUser<{ id: string; paymentId: string }>(
  async (req, userId, { params }) => {
    const { id, paymentId } = await params;
    const input = parseOrThrow(loanPaymentSchema, await req.json());
    const loan = await getOwnedLoanOrThrow(prisma, userId, id);
    const { payment, amountPaid, outstanding } = await updatePayment(
      userId,
      id,
      paymentId,
      input
    );

    await logActivityFromRequest(userId, req, {
      action: ActivityActions.PAYMENT_UPDATED,
      summary: `Updated payment to ${formatCurrency(payment.amount)} for ${loan.clientName}`,
      entityType: "loan",
      entityId: id,
      metadata: { paymentId },
    });

    return NextResponse.json({
      payment: serializePayment(payment),
      amountPaid,
      outstanding,
    });
  }
);

export const DELETE = withUser<{ id: string; paymentId: string }>(
  async (req, userId, { params }) => {
    const { id, paymentId } = await params;
    const loan = await getOwnedLoanOrThrow(prisma, userId, id);
    const existing = await prisma.loanPayment.findFirst({ where: { id: paymentId, loanId: id } });
    const { amountPaid, outstanding } = await deletePayment(userId, id, paymentId);

    await logActivityFromRequest(userId, req, {
      action: ActivityActions.PAYMENT_DELETED,
      summary: existing
        ? `Deleted ${formatCurrency(existing.amount)} payment for ${loan.clientName}`
        : `Deleted payment for ${loan.clientName}`,
      entityType: "loan",
      entityId: id,
      metadata: { paymentId },
    });

    return NextResponse.json({
      success: true,
      amountPaid,
      outstanding,
    });
  }
);
