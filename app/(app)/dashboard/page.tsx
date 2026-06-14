import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/charts";
import { DashboardRefreshButton } from "@/components/dashboard/dashboard-refresh-button";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PageHeader, PageHeaderAction } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/lib/dashboard";
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

  const stats = await getDashboardStats(session.user.id);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description={`Overview of your loan portfolio. Last updated ${format(new Date(stats.updatedAt), "MMM d, yyyy h:mm a")}.`}
      >
        <DashboardRefreshButton />
        <PageHeaderAction
          href="/loans/new"
          label="Add New Loan"
          icon={Plus}
          className="shadow-sm shadow-primary/20"
        />
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
        <Button variant="outline" asChild>
          <Link href="/loans">View all loans</Link>
        </Button>
      </div>
    </div>
  );
}
