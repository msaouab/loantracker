import { LoanTable } from "@/components/loans/loan-table";

export default function RecoveredLoansPage() {
  return (
    <LoanTable
      status="completed"
      title="Recovered Loans"
      emptyMessage="No fully recovered loans yet. Once paid in full, records stay here for 30 days before being permanently removed."
    />
  );
}
