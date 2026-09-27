"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoanForm } from "@/components/forms/loan-form";
import { PageHeader } from "@/components/shared/page-header";
import { dateParamToIso } from "@/lib/dates";
import { createLoan } from "@/lib/loans-client";
import { notifySuccess } from "@/lib/toast";

export default function NewLoanPage() {
  const router = useRouter();
  const t = useTranslations("loans");

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("addNewLoan")}
        description={t("addNewLoanDescription")}
      />

      <div className="surface-card p-4 sm:p-6">
        <LoanForm
            enableClientLookup
            submitLabel={t("createLoan")}
            cancelHref="/loans"
            onSubmit={async (values) => {
              const result = await createLoan({
                ...values,
                loanDate: dateParamToIso(values.loanDate),
              });

              notifySuccess(
                result.reopened
                  ? t("loanReopened", { clientName: values.clientName })
                  : t("loanCreated", { clientName: values.clientName })
              );
              router.push("/loans");
              router.refresh();
            }}
        />
      </div>
    </div>
  );
}
