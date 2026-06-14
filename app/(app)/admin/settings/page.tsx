import { ActivityFeed } from "@/components/activity/activity-feed";
import { SettingsForm } from "@/components/forms/settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { getSession, requireAdminOrRedirect } from "@/lib/session";

export default async function AdminSettingsPage() {
  await requireAdminOrRedirect();
  const session = await getSession();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Settings"
        description="Manage your admin account and review your recent activity."
      />
      <SettingsForm
        initialFullName={session?.user.name ?? ""}
        email={session?.user.email ?? ""}
      />
      <ActivityFeed
        admin
        embedded
        title="Activity"
        description="Your sign-ins, account changes, and user-management actions."
      />
    </div>
  );
}
