import { getTranslations } from "next-intl/server";
import { LoanTable } from "@/components/loans/loan-table";

export default async function LoansPage() {
  const t = await getTranslations("loans");

  return (
    <LoanTable
      status="active"
      title={t("activeTitle")}
      emptyMessage={t("activeEmpty")}
    />
  );
}
