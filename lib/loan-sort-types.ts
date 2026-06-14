export const LOAN_SORT_FIELDS = [
  "clientName",
  "totalAmount",
  "amountPaid",
  "outstanding",
  "loanDate",
  "clientTrust",
] as const;

export type LoanSortField = (typeof LOAN_SORT_FIELDS)[number];
export type LoanSortOrder = "asc" | "desc";

export const DEFAULT_LOAN_SORT = {
  sortBy: "loanDate" as LoanSortField,
  sortOrder: "desc" as LoanSortOrder,
};

export function parseLoanSort(
  sortBy: string | null,
  sortOrder: string | null
): { sortBy: LoanSortField; sortOrder: LoanSortOrder } {
  const field = LOAN_SORT_FIELDS.includes(sortBy as LoanSortField)
    ? (sortBy as LoanSortField)
    : DEFAULT_LOAN_SORT.sortBy;

  const order =
    sortOrder === "asc" || sortOrder === "desc"
      ? sortOrder
      : DEFAULT_LOAN_SORT.sortOrder;

  return { sortBy: field, sortOrder: order };
}
