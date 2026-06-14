"use client";

import { useRouter } from "next/navigation";
import { LoanForm } from "@/components/forms/loan-form";
import { PageHeader } from "@/components/shared/page-header";
import { dateParamToIso } from "@/lib/dates";
import { createLoan } from "@/lib/loans-client";

export default function NewLoanPage() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Add New Loan"
        description="Create a new loan record for a client."
      />

      <div className="surface-card p-4 sm:p-6">
        <LoanForm
            submitLabel="Create loan"
            cancelHref="/loans"
            onSubmit={async (values) => {
              await createLoan({
                ...values,
                loanDate: dateParamToIso(values.loanDate),
              });

            router.push("/loans");
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
