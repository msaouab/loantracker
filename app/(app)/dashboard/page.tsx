import Link from "next/link";
import { format } from "date-fns";
import { Plus, RefreshCw } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/charts";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PageHeader, PageHeaderAction } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/lib/dashboard";
import { requireUserId } from "@/lib/session";

export default async function DashboardPage() {
  const userId = await requireUserId();
  const stats = await getDashboardStats(userId);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description={`Overview of your loan portfolio. Last updated ${format(new Date(stats.updatedAt), "MMM d, yyyy h:mm a")}.`}
      >
        <PageHeaderAction
          href="/dashboard"
          label="Refresh"
          icon={RefreshCw}
          variant="outline"
        />
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

      <Button variant="outline" asChild>
        <Link href="/loans">View All Loans</Link>
      </Button>
    </div>
  );
}
