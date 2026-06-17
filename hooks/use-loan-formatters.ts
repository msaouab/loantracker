"use client";

import { useLocale } from "next-intl";
import { formatCurrency, formatRecoveredRetention } from "@/lib/loans";
import type { AppLocale } from "@/lib/locale";
import { useTranslations } from "next-intl";

export function useLoanFormatters() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("loans");

  const retentionLabels = {
    today: t("retentionToday"),
    oneDayAgo: t("retentionOneDayAgo"),
    daysAgo: (count: number) => t("retentionDaysAgo", { count }),
    deletesToday: t("retentionDeletesToday"),
    oneDayLeft: t("retentionOneDayLeft"),
    daysLeft: (count: number) => t("retentionDaysLeft", { count }),
  };

  return {
    locale,
    formatMoney: (amount: number) => formatCurrency(amount, locale),
    formatRetention: (recoveredAt: string | null) =>
      formatRecoveredRetention(recoveredAt, locale, retentionLabels),
  };
}
