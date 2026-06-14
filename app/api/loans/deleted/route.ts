import { apiOk } from "@/lib/api-response";
import { withUser } from "@/lib/api-handler";
import { serializeLoan } from "@/lib/loans";
import { listDeletedLoans } from "@/lib/loans-service";

export const GET = withUser(async (_req, userId) => {
  const loans = await listDeletedLoans(userId);

  return apiOk({
    loans: loans.map((loan) => ({
      ...serializeLoan(loan),
      paymentCount: loan._count.payments,
    })),
  });
});
