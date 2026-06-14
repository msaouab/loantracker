import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/charts";
import { DashboardRefreshButton } from "@/components/dashboard/dashboard-refresh-button";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PageHeader, PageHeaderAction } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStats, getDashboardStats } from "@/lib/dashboard";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const isAdminView = session.user.isAdmin;
  const stats = isAdminView
    ? await getAdminDashboardStats()
    : await getDashboardStats(session.user.id);

  return (
    <div className="space-y-4">
      <PageHeader
        title={isAdminView ? "Organization dashboard" : "Dashboard"}
        description={
          isAdminView
            ? `Portfolio-wide overview across ${stats.activeUserCount ?? 0} active manager${stats.activeUserCount === 1 ? "" : "s"}. Last updated ${format(new Date(stats.updatedAt), "MMM d, yyyy h:mm a")}.`
            : `Overview of your loan portfolio. Last updated ${format(new Date(stats.updatedAt), "MMM d, yyyy h:mm a")}.`
        }
      >
        <DashboardRefreshButton />
        {!isAdminView ? (
          <PageHeaderAction
            href="/loans/new"
            label="Add New Loan"
            icon={Plus}
            className="shadow-sm shadow-primary/20"
          />
        ) : null}
      </PageHeader>

      <KpiCards stats={stats} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Analytics</h2>
        <DashboardCharts
          trustDistribution={stats.trustDistribution}
          recoveryProgress={stats.recoveryProgress}
          topClients={stats.topClients}
        />
      </section>

      <div className="flex flex-wrap gap-2">
        {isAdminView ? (
          <Button variant="outline" asChild>
            <Link href="/admin/users">Manage users</Link>
          </Button>
        ) : null}
        <Button variant="outline" asChild>
          <Link href="/loans">View all loans</Link>
        </Button>
      </div>
    </div>
  );
}
