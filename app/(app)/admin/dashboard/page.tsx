import Link from "next/link";
import { format } from "date-fns";
import { History, Users } from "lucide-react";
import { AdminKpiCards } from "@/components/admin/admin-kpi-cards";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getAdminDashboardStats } from "@/lib/admin-dashboard";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admin dashboard"
        description={`User management overview. Last updated ${format(new Date(stats.updatedAt), "MMM d, yyyy h:mm a")}.`}
      />

      <AdminKpiCards stats={stats} />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/admin/users">
            <Users className="mr-2 h-4 w-4" />
            Manage users
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/activity">
            <History className="mr-2 h-4 w-4" />
            View activity
          </Link>
        </Button>
      </div>
    </div>
  );
}
