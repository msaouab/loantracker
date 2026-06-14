import { apiOk } from "@/lib/api-response";
import { withManager } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { ActivityActions } from "@/lib/activity-log";
import { logActivityFromRequest } from "@/lib/activity-log-service";
import { prisma } from "@/lib/db";
import { formatCurrency, serializeLoan } from "@/lib/loans";
import { createLoan } from "@/lib/loans-service";
import { getLoanDateWhere, getLoanSearchWhere } from "@/lib/loan-search";
import { getLoanStatusWhere, parseLoanStatus } from "@/lib/loan-status";
import { findSortedLoans } from "@/lib/loan-sort";
import { parseLoanSort } from "@/lib/loan-sort-types";
import { parseLoanPageSize } from "@/lib/loan-list";
import { createLoanSchema } from "@/lib/validations";

export const GET = withManager(async (req, userId) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const status = parseLoanStatus(searchParams.get("status"));
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = parseLoanPageSize(searchParams.get("pageSize"));
  const { sortBy, sortOrder } = parseLoanSort(
    searchParams.get("sortBy"),
    searchParams.get("sortOrder")
  );

  const searchFilter = search
    ? await getLoanSearchWhere(prisma, userId, search)
    : undefined;
  const dateFilter = getLoanDateWhere(dateFrom, dateTo);
  const statusFilter = getLoanStatusWhere(prisma, status);

  const where = {
    userId,
    deletedAt: null,
    ...searchFilter,
    ...dateFilter,
    ...statusFilter,
  };

  const [loans, total] = await Promise.all([
    findSortedLoans(prisma, where, sortBy, sortOrder, (page - 1) * pageSize, pageSize),
    prisma.loan.count({ where }),
  ]);

  return apiOk({
    loans: loans.map((loan) => ({
      ...serializeLoan(loan),
      paymentCount: loan._count?.payments ?? 0,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

export const POST = withManager(async (req, userId) => {
  const input = parseOrThrow(createLoanSchema, await req.json());
  const loan = await createLoan(userId, input);

  await logActivityFromRequest(userId, req, {
    action: ActivityActions.LOAN_CREATED,
    summary: `Created loan for ${loan.clientName} (${formatCurrency(loan.totalAmount)})`,
    entityType: "loan",
    entityId: loan.id,
    metadata: {
      clientName: loan.clientName,
      totalAmount: loan.totalAmount,
    },
  });

  return apiOk(
    {
      loan: {
        ...serializeLoan(loan),
        paymentCount: input.amountPaid > 0 ? 1 : 0,
      },
    },
    { status: 201 }
  );
});
