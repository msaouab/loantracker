import { getTranslations } from "next-intl/server";
import { LoanTable } from "@/components/loans/loan-table";

export default async function RecoveredLoansPage() {
  const t = await getTranslations("loans");

  return (
    <LoanTable
      status="completed"
      title={t("recoveredTitle")}
      emptyMessage={t("recoveredEmpty")}
    />
  );
}
