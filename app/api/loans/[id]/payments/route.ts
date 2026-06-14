import { apiOk } from "@/lib/api-response";
import { withManager } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { ActivityActions } from "@/lib/activity-log";
import { logActivityFromRequest } from "@/lib/activity-log-service";
import { prisma } from "@/lib/db";
import { formatCurrency, getOutstanding } from "@/lib/loans";
import { getOwnedLoanOrThrow, listPayments, recordPayment, serializePayment } from "@/lib/loans-service";
import { loanPaymentSchema } from "@/lib/validations";

export const GET = withManager<{ id: string }>(async (_req, userId, { params }) => {
  const { id } = await params;
  const loan = await getOwnedLoanOrThrow(prisma, userId, id);
  const payments = await listPayments(prisma, id);

  return apiOk({
    payments: payments.map(serializePayment),
    totalPaid: loan.amountPaid,
    outstanding: getOutstanding(loan.totalAmount, loan.amountPaid),
  });
});

export const POST = withManager<{ id: string }>(async (req, userId, { params }) => {
  const { id } = await params;
  const input = parseOrThrow(loanPaymentSchema, await req.json());
  const loan = await getOwnedLoanOrThrow(prisma, userId, id);
  const { payment, amountPaid, outstanding } = await recordPayment(userId, id, input);

  await logActivityFromRequest(userId, req, {
    action: ActivityActions.PAYMENT_ADDED,
    summary: `Recorded ${formatCurrency(payment.amount)} payment for ${loan.clientName}`,
    entityType: "loan",
    entityId: id,
    metadata: { paymentId: payment.id },
  });

  return apiOk(
    {
      payment: serializePayment(payment),
      amountPaid,
      outstanding,
    },
    { status: 201 }
  );
});
