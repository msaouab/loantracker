import { request } from "@/lib/api-client";
import type { LoanPayment } from "@/lib/loan-payments-client";
import type { LoanSortField, LoanSortOrder } from "@/lib/loan-sort-types";
import type { LoanStatus } from "@/lib/loan-status";

export type CreateLoanPayload = {
  clientName: string;
  totalAmount: number;
  amountPaid: number;
  loanDate?: string;
  description?: string;
  clientTrust: boolean;
};

export type UpdateLoanPayload = Omit<CreateLoanPayload, "amountPaid">;

export type LoanRecord = {
  id: string;
  clientName: string;
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
  loanDate: string;
  description: string | null;
  clientTrust: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  recoveredAt?: string | null;
  paymentCount?: number;
};

export type LoanDetailRecord = LoanRecord & {
  paymentCount: number;
  payments: LoanPayment[];
};

type LoanResponse = { loan: LoanRecord };
type LoanDetailResponse = { loan: LoanDetailRecord };

export type LoanListItem = {
  id: string;
  clientName: string;
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
  loanDate: string;
  clientTrust: boolean;
  paymentCount: number;
  recoveredAt?: string | null;
};

export type Loan = LoanListItem;

export type LoanListParams = {
  page: number;
  pageSize: number;
  sortBy: LoanSortField;
  sortOrder: LoanSortOrder;
  status: LoanStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

type LoanListResponse = {
  loans: LoanListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export async function fetchLoanList(params: LoanListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    status: params.status,
    ...(params.search ? { search: params.search } : {}),
    ...(params.dateFrom ? { dateFrom: params.dateFrom } : {}),
    ...(params.dateTo ? { dateTo: params.dateTo } : {}),
  });

  return request<LoanListResponse>(
    `/api/loans?${query.toString()}`,
    {},
    "Failed to load loans"
  );
}

export async function fetchLoan(id: string) {
  return request<LoanDetailResponse>(
    `/api/loans/${id}`,
    {},
    "Failed to load loan"
  );
}

export async function createLoan(payload: CreateLoanPayload) {
  return request<{ loan: LoanRecord; reopened?: boolean }>(
    "/api/loans",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to create loan"
  );
}

export async function updateLoan(id: string, payload: UpdateLoanPayload) {
  return request<LoanResponse>(
    `/api/loans/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to update loan"
  );
}

export async function deleteLoan(id: string) {
  await request<{ success: boolean }>(
    `/api/loans/${id}`,
    { method: "DELETE" },
    "Failed to delete loan"
  );
}

export async function fetchDeletedLoans() {
  return request<{ loans: LoanRecord[] }>(
    "/api/loans/deleted",
    {},
    "Failed to load deleted loans"
  );
}

export async function restoreLoan(id: string) {
  return request<{ loan: LoanRecord }>(
    `/api/loans/${id}/restore`,
    { method: "POST" },
    "Failed to restore loan"
  );
}

export type ClientLookupResult =
  | { status: "new" }
  | { status: "active"; loanId: string; clientName: string }
  | { status: "recovered"; loanId: string; clientName: string };

export async function lookupClientName(clientName: string) {
  const query = new URLSearchParams({ clientName });
  return request<ClientLookupResult>(
    `/api/loans/client-lookup?${query.toString()}`,
    {},
    "Failed to look up client"
  );
}
