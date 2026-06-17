import Link from "next/link";
import { History, Users } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { AdminKpiCards } from "@/components/admin/admin-kpi-cards";
import { DashboardCharts } from "@/components/dashboard/charts";
import { DashboardRefreshButton } from "@/components/dashboard/dashboard-refresh-button";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getAdminDashboardStats } from "@/lib/admin-dashboard";
import { getOrgDashboardStats } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";

export default async function AdminDashboardPage() {
  const [userStats, portfolioStats, t, locale] = await Promise.all([
    getAdminDashboardStats(),
    getOrgDashboardStats(),
    getTranslations("admin"),
    getLocale(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboardTitle")}
        description={t("dashboardDescription", {
          date: formatDateTime(new Date(portfolioStats.updatedAt), locale as AppLocale),
        })}
      >
        <DashboardRefreshButton />
      </PageHeader>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("userManagement")}</h2>
        <AdminKpiCards stats={userStats} />
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
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("portfolioKpis")}</h2>
        <KpiCards stats={portfolioStats} />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("portfolioAnalytics")}</h2>
        <DashboardCharts
          trustDistribution={portfolioStats.trustDistribution}
          recoveryProgress={portfolioStats.recoveryProgress}
          topClients={portfolioStats.topClients}
        />
      </section>
    </div>
  );
}
