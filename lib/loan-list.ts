export const LOAN_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const DEFAULT_LOAN_PAGE_SIZE = LOAN_PAGE_SIZE_OPTIONS[0];

export type LoanPageSize = (typeof LOAN_PAGE_SIZE_OPTIONS)[number];

export function parseLoanPageSize(value: string | null): LoanPageSize {
  const requested = Number(value ?? DEFAULT_LOAN_PAGE_SIZE);
  return LOAN_PAGE_SIZE_OPTIONS.includes(requested as LoanPageSize)
    ? (requested as LoanPageSize)
    : DEFAULT_LOAN_PAGE_SIZE;
}
