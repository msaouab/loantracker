"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const router = useRouter();
  const [loanId, setLoanId] = useState<string | null>(null);
  const [loan, setLoan] = useState<LoanDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLoan() {
      const { id } = await params;
      setLoanId(id);

      try {
        const data = await fetchLoan(id);
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
        notifyError(null, "Failed to load loan");
        router.push("/loans");
      } finally {
        setLoading(false);
      }
    }

    loadLoan();
  }, [params, router]);

  if (loading || !loan || !loanId) {
    return <LoanFormSkeleton />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Edit Loan"
        description={`Update loan details for ${loan.clientName}.`}
      />

      <div className="surface-card p-4 sm:p-6">
        <LoanForm
          initialValues={loan}
          submitLabel="Save changes"
          cancelHref={`/loans/${loanId}`}
          amountPaidReadOnly
          onSubmit={async (values) => {
            await updateLoan(loanId, {
              clientName: values.clientName,
              totalAmount: values.totalAmount,
              loanDate: dateParamToIso(values.loanDate),
              description: values.description,
              clientTrust: values.clientTrust,
            });

            notifySuccess(`Loan updated for ${values.clientName}`);
            router.push(`/loans/${loanId}`);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
