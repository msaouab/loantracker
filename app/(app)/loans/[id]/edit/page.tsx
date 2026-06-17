"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LoanForm, type LoanFormValues } from "@/components/forms/loan-form";
import { LoanFormSkeleton } from "@/components/loans/loan-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { dateParamToIso, formatDateParam } from "@/lib/dates";
import { fetchLoan, updateLoan } from "@/lib/loans-client";
import { notifyError, notifySuccess } from "@/lib/toast";

type LoanDetails = LoanFormValues & {
  id: string;
  outstanding: number;
};

export default function EditLoanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: loanId } = use(params);
  const router = useRouter();
  const t = useTranslations("loans");
  const [loan, setLoan] = useState<LoanDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLoan() {

      try {
        const data = await fetchLoan(loanId);
        setLoan({
          id: data.loan.id,
          clientName: data.loan.clientName,
          totalAmount: data.loan.totalAmount,
          amountPaid: data.loan.amountPaid,
          loanDate: formatDateParam(new Date(data.loan.loanDate)),
          description: data.loan.description ?? "",
          clientTrust: data.loan.clientTrust,
          outstanding: data.loan.outstanding,
        });
      } catch {
        notifyError(null, t("failedLoadLoan"));
        router.push("/loans");
      } finally {
        setLoading(false);
      }
    }

    loadLoan();
  }, [loanId, router, t]);

  if (loading || !loan || !loanId) {
    return <LoanFormSkeleton />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("editLoan")}
        description={t("editLoanDescription", { clientName: loan.clientName })}
      />

      <div className="surface-card p-4 sm:p-6">
        <LoanForm
          initialValues={loan}
          submitLabel={t("saveChanges")}
          cancelHref="/loans"
          amountPaidReadOnly
          onSubmit={async (values) => {
            await updateLoan(loanId, {
              clientName: values.clientName,
              totalAmount: values.totalAmount,
              loanDate: dateParamToIso(values.loanDate),
              description: values.description,
              clientTrust: values.clientTrust,
            });

            notifySuccess(t("loanUpdated", { clientName: values.clientName }));
            router.push(`/loans/${loanId}`);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
