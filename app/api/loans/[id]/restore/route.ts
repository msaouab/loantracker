import { apiOk } from "@/lib/api-response";
import { withUser } from "@/lib/api-handler";
import { ActivityActions } from "@/lib/activity-log";
import { logActivityFromRequest } from "@/lib/activity-log-service";
import { formatCurrency, serializeLoan } from "@/lib/loans";
import { restoreLoan } from "@/lib/loans-service";

export const POST = withUser<{ id: string }>(async (req, userId, { params }) => {
  const { id } = await params;
  const loan = await restoreLoan(userId, id);

  await logActivityFromRequest(userId, req, {
    action: ActivityActions.LOAN_RESTORED,
    summary: `Restored loan for ${loan.clientName} (${formatCurrency(loan.totalAmount)})`,
    entityType: "loan",
    entityId: loan.id,
    metadata: {
      clientName: loan.clientName,
      totalAmount: loan.totalAmount,
    },
  });

  return apiOk({ loan: serializeLoan(loan) });
});
