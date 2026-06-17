import Link from "next/link";
import { History, Users } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminKpiCards } from "@/components/admin/admin-kpi-cards";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStats } from "@/lib/admin-dashboard";
import { formatDateTime } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";

export default async function AdminDashboardPage() {
  const [stats, t, locale] = await Promise.all([
    getAdminDashboardStats(),
    getTranslations("admin"),
    getLocale(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("dashboardTitle")}
        description={t("dashboardDescription", {
          date: formatDateTime(new Date(stats.updatedAt), locale as AppLocale),
        })}
      />

      <AdminKpiCards stats={stats} />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin/users">
            <Users className="me-2 h-4 w-4" />
            {t("manageUsers")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/activity">
            <History className="me-2 h-4 w-4" />
            {t("viewActivity")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
