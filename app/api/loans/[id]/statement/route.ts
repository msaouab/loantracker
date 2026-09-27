import { getTranslations } from "next-intl/server";
import { withManager } from "@/lib/api-handler";
import { ActivityActions } from "@/lib/activity-log";
import { logActivityFromRequest } from "@/lib/activity-log-service";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { getErrorMessage } from "@/lib/server-errors";
import {
  buildLoanStatementData,
  renderLoanStatementPdf,
} from "@/lib/pdf/generate-loan-statement";
import { buildPdfContentDisposition } from "@/lib/pdf/content-disposition";
import {
  getOwnedLoanOrThrow,
  listPayments,
} from "@/lib/loans-service";

export const GET = withManager<{ id: string }>(async (req, userId, { params }) => {
  const { id } = await params;
  const loan = await getOwnedLoanOrThrow(prisma, userId, id);
  const [payments, issuer] = await Promise.all([
    listPayments(prisma, id),
    prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true, locale: true },
    }),
  ]);

  if (!issuer) {
    throw new NotFoundError(await getErrorMessage("userNotFound"));
  }

  const statementData = await buildLoanStatementData(loan, payments, issuer);
  const pdfBuffer = await renderLoanStatementPdf(statementData);
  const tPdf = await getTranslations({
    locale: statementData.locale,
    namespace: "pdf",
  });

  await logActivityFromRequest(userId, req, {
    action: ActivityActions.LOAN_STATEMENT_EXPORTED,
    summary: `Exported loan statement for ${loan.clientName}`,
    entityType: "loan",
    entityId: loan.id,
    metadata: {
      clientName: loan.clientName,
      format: "pdf",
    },
  });

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": buildPdfContentDisposition(
        tPdf("filenamePrefix"),
        loan.clientName
      ),
      "Cache-Control": "private, no-store",
    },
  });
});
