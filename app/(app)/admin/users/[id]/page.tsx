import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { AdminUserProfile } from "@/components/admin/admin-user-profile";
import { DashboardCharts } from "@/components/dashboard/charts";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";
import { getManagerForAdmin, serializeUser } from "@/lib/users-service";

const STATUS_LABEL_KEY = {
  pending: "statusPending",
  active: "statusActive",
  frozen: "statusFrozen",
} as const;

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user;
  try {
    user = await getManagerForAdmin(id);
  } catch {
    notFound();
  }

  const [stats, t, locale] = await Promise.all([
    getDashboardStats(id),
    getTranslations("admin"),
    getLocale(),
  ]);
  const serializedUser = serializeUser(user);

  return (
    <div className="space-y-4">
      <PageHeader
        title={serializedUser.fullName}
        description={t("userDetailSummary", {
          email: serializedUser.email,
          status: t(STATUS_LABEL_KEY[serializedUser.status]),
          count: serializedUser.loanCount,
          date: formatDateTime(new Date(stats.updatedAt), locale as AppLocale),
        })}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t("backToUsers")}
          </Link>
        </Button>
      </PageHeader>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("portfolioKpis")}</h2>
        <KpiCards stats={stats} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("portfolioAnalytics")}</h2>
        <DashboardCharts
          trustDistribution={stats.trustDistribution}
          recoveryProgress={stats.recoveryProgress}
          topClients={stats.topClients}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("accountManagement")}</h2>
        <AdminUserProfile initialUser={serializedUser} />
      </section>

      <ActivityFeed
        embedded
        userId={id}
        title={t("userActivityTitle")}
        description={t("userActivityDescription")}
      />
    </div>
  );
}
