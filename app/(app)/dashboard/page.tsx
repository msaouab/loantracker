import Link from "next/link";
import { Plus } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { DashboardCharts } from "@/components/dashboard/charts";
import { DashboardRefreshButton } from "@/components/dashboard/dashboard-refresh-button";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PageHeader, PageHeaderAction } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";
import { getSession, redirectToLogin } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    return redirectToLogin();
  }

  if (session.user.isAdmin) {
    redirect("/admin/dashboard");
  }

  const [stats, t, locale] = await Promise.all([
    getDashboardStats(session.user.id),
    getTranslations("dashboard"),
    getLocale(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        description={t("description", {
          date: formatDateTime(new Date(stats.updatedAt), locale as AppLocale),
        })}
      >
        <DashboardRefreshButton />
        <PageHeaderAction
          href="/loans/new"
          label={t("addNewLoan")}
          icon={Plus}
          className="shadow-sm shadow-primary/20"
        />
      </PageHeader>

      <KpiCards stats={stats} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("analytics")}</h2>
        <DashboardCharts
          trustDistribution={stats.trustDistribution}
          recoveryProgress={stats.recoveryProgress}
          topClients={stats.topClients}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/loans">{t("viewAllLoans")}</Link>
        </Button>
      </div>
    </div>
  );
}
