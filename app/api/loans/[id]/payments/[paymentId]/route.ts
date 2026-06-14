import { NextResponse } from "next/server";
import { withUser } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { deletePayment, serializePayment, updatePayment } from "@/lib/loans-service";
import { loanPaymentSchema } from "@/lib/validations";

export const PUT = withUser<{ id: string; paymentId: string }>(
  async (req, userId, { params }) => {
    const { id, paymentId } = await params;
    const input = parseOrThrow(loanPaymentSchema, await req.json());
    const { payment, amountPaid, outstanding } = await updatePayment(
      userId,
      id,
      paymentId,
      input
    );

    return NextResponse.json({
      payment: serializePayment(payment),
      amountPaid,
      outstanding,
    });
  }
);

export const DELETE = withUser<{ id: string; paymentId: string }>(
  async (_req, userId, { params }) => {
    const { id, paymentId } = await params;
    const { amountPaid, outstanding } = await deletePayment(userId, id, paymentId);

    return NextResponse.json({
      success: true,
      amountPaid,
      outstanding,
    });
  }
);
