import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { AdminUserProfile } from "@/components/admin/admin-user-profile";
import { DashboardCharts } from "@/components/dashboard/charts";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/lib/dashboard";
import { getManagerForAdmin, serializeUser } from "@/lib/users-service";
import { ACCOUNT_STATUS_LABELS } from "@/lib/users";

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

  const stats = await getDashboardStats(id);
  const serializedUser = serializeUser(user);

  return (
    <div className="space-y-4">
      <PageHeader
        title={serializedUser.fullName}
        description={`${serializedUser.email} · ${ACCOUNT_STATUS_LABELS[serializedUser.status]} · ${serializedUser.loanCount} loan${serializedUser.loanCount === 1 ? "" : "s"} · Portfolio updated ${format(new Date(stats.updatedAt), "MMM d, yyyy h:mm a")}`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to users
          </Link>
        </Button>
      </PageHeader>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Portfolio KPIs</h2>
        <KpiCards stats={stats} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Portfolio analytics</h2>
        <DashboardCharts
          trustDistribution={stats.trustDistribution}
          recoveryProgress={stats.recoveryProgress}
          topClients={stats.topClients}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Account management</h2>
        <AdminUserProfile initialUser={serializedUser} />
      </section>

      <ActivityFeed
        embedded
        userId={id}
        title="Activity"
        description="Sign-ins, loan updates, payments, and account changes for this user."
      />
    </div>
  );
}
