"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ArrowLeft, FileDown, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PageHeader, PageHeaderAction } from "@/components/shared/page-header";
import { LoanDetailSkeleton } from "@/components/loans/loan-skeletons";
import { DeleteLoanDialog } from "@/components/loans/delete-loan-dialog";
import { LoanPaymentHistory } from "@/components/loans/loan-payment-history";
import { TrustBadge } from "@/components/loans/trust-badge";
import { fetchLoan, type LoanDetailRecord } from "@/lib/loans-client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";

export default function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("loans");
  const tc = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const [loan, setLoan] = useState<LoanDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    async function loadLoan() {
      
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
  }, [id, router]);

  if (loading || !loan) {
    return <LoanDetailSkeleton />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={loan.clientName}
        description={t("loanDetails")}
      >
        <PageHeaderAction
          href="/loans"
          label={t("backToList")}
          icon={ArrowLeft}
          variant="outline"
        />
        <PageHeaderAction
          href={`/api/loans/${loan.id}/statement`}
          download
          label={t("downloadStatement")}
          icon={FileDown}
          variant="outline"
        />
        <PageHeaderAction
          href={`/loans/${loan.id}/edit`}
          label={tc("edit")}
          icon={Pencil}
          variant="outline"
        />
        <PageHeaderAction
          label={tc("delete")}
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
        totalAmount={loan.totalAmount}
        redirectTo="/loans"
      />

      <div className="surface-card grid gap-4 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6">
          <DetailItem label={t("totalAmount")} value={formatCurrency(loan.totalAmount, locale)} />
          <DetailItem
            label={t("amountPaid")}
            value={
              <span className="text-success">{formatCurrency(loan.amountPaid, locale)}</span>
            }
          />
          <DetailItem
            label={t("outstanding")}
            value={
              <span className="text-destructive">{formatCurrency(loan.outstanding, locale)}</span>
            }
          />
          <DetailItem
            label={t("loanDate")}
            value={formatDate(loan.loanDate, locale)}
          />
          <DetailItem
            label={t("trustStatus")}
            value={<TrustBadge trusted={loan.clientTrust} label="long" />}
          />
          <div className="sm:col-span-2">
            <DetailItem
              label={tc("description")}
              value={loan.description || t("noNotes")}
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
