import { request } from "@/lib/api-client";

export type LoanPayment = {
  id: string;
  loanId: string;
  amount: number;
  paidAt: string;
  note: string | null;
};

export type LoanPaymentsResponse = {
  payments: LoanPayment[];
  totalPaid: number;
  outstanding: number;
};

type PaymentMutationResponse = {
  payment: LoanPayment;
  amountPaid: number;
  outstanding: number;
};

type PaymentDeleteResponse = {
  success: boolean;
  amountPaid: number;
  outstanding: number;
};

export async function fetchLoanPayments(loanId: string) {
  return request<LoanPaymentsResponse>(
    `/api/loans/${loanId}/payments`,
    {},
    "Failed to load payment history"
  );
}

export async function createLoanPayment(
  loanId: string,
  payload: { amount: number; paidAt: string; note?: string }
) {
  return request<PaymentMutationResponse>(
    `/api/loans/${loanId}/payments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to record payment"
  );
}

export async function updateLoanPayment(
  loanId: string,
  paymentId: string,
  payload: { amount: number; paidAt: string; note?: string }
) {
  return request<PaymentMutationResponse>(
    `/api/loans/${loanId}/payments/${paymentId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    "Failed to update payment"
  );
}

export async function deleteLoanPayment(loanId: string, paymentId: string) {
  return request<PaymentDeleteResponse>(
    `/api/loans/${loanId}/payments/${paymentId}`,
    { method: "DELETE" },
    "Failed to delete payment"
  );
}
