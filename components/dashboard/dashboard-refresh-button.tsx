"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeaderAction } from "@/components/shared/page-header";

export function DashboardRefreshButton() {
  const router = useRouter();
  const t = useTranslations("common");

  return (
    <PageHeaderAction
      label={t("refresh")}
      icon={RefreshCw}
      variant="outline"
      onClick={() => router.refresh()}
    />
  );
}
