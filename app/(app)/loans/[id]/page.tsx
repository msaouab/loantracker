"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { PageHeader, PageHeaderAction } from "@/components/shared/page-header";
import { LoanDetailSkeleton } from "@/components/loans/loan-skeletons";
import { DeleteLoanDialog } from "@/components/loans/delete-loan-dialog";
import { LoanPaymentHistory } from "@/components/loans/loan-payment-history";
import { TrustBadge } from "@/components/loans/trust-badge";
import { fetchLoan, type LoanDetailRecord } from "@/lib/loans-client";
import { formatCurrency } from "@/lib/loans";

export default function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [loan, setLoan] = useState<LoanDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    async function loadLoan() {
      const { id } = await params;

      try {
        const data = await fetchLoan(id);
        setLoan(data.loan);
      } catch {
        router.push("/loans");
        return;
      } finally {
        setLoading(false);
      }
    }

    loadLoan();
  }, [params, router]);

  if (loading || !loan) {
    return <LoanDetailSkeleton />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={loan.clientName}
        description="Loan details"
      >
        <PageHeaderAction
          href="/loans"
          label="Back to list"
          icon={ArrowLeft}
          variant="outline"
        />
        <PageHeaderAction
          href={`/loans/${loan.id}/edit`}
          label="Edit"
          icon={Pencil}
          variant="outline"
        />
        <PageHeaderAction
          label="Delete"
          icon={Trash2}
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
        />
      </PageHeader>

      <DeleteLoanDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        loanId={loan.id}
        clientName={loan.clientName}
        redirectTo="/loans"
      />

      <div className="surface-card grid gap-4 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6">
          <DetailItem label="Total Amount" value={formatCurrency(loan.totalAmount)} />
          <DetailItem
            label="Amount Paid"
            value={
              <span className="text-success">{formatCurrency(loan.amountPaid)}</span>
            }
          />
          <DetailItem
            label="Outstanding"
            value={
              <span className="text-destructive">{formatCurrency(loan.outstanding)}</span>
            }
          />
          <DetailItem
            label="Loan Date"
            value={format(new Date(loan.loanDate), "MMM d, yyyy")}
          />
          <DetailItem
            label="Trust Status"
            value={<TrustBadge trusted={loan.clientTrust} label="long" />}
          />
          <div className="sm:col-span-2">
            <DetailItem
              label="Description"
              value={loan.description || "No notes provided."}
            />
          </div>
      </div>

      <div className="surface-card p-4 sm:p-6">
        <LoanPaymentHistory
          loanId={loan.id}
          clientName={loan.clientName}
          initialPayments={loan.payments}
          initialOutstanding={loan.outstanding}
          onPaymentsChanged={async () => {
            try {
              const data = await fetchLoan(loan.id);
              setLoan(data.loan);
            } catch {
              // Header stats stay stale; payment history refreshes itself.
            }
          }}
        />
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}
