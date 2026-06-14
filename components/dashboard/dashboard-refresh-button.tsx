"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { PageHeaderAction } from "@/components/shared/page-header";

export function DashboardRefreshButton() {
  const router = useRouter();

  return (
    <PageHeaderAction
      label="Refresh"
      icon={RefreshCw}
      variant="outline"
      onClick={() => router.refresh()}
    />
  );
}
