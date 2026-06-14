import { LoanTable } from "@/components/loans/loan-table";

export default function LoansPage() {
  return (
    <LoanTable
      status="active"
      title="Active Loans"
      emptyMessage="No active loans — everything has been recovered."
    />
  );
}
